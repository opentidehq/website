/**
 * Derives the taxonomy from the specification itself.
 *
 * `OpenTideHQ/specifications` owns the vocabularies: one `<field>.vocab.toml` per vocabulary
 * under `vocabularies/` at the repo root. This module parses that directory and writes
 * `lib/generated/vocabularies.json`, which the landing page reads. Nothing about the taxonomy
 * is written down twice.
 *
 * The contract this module deliberately keeps: **an upstream vocabulary change must never fail
 * the build.** Adding, removing or renaming a vocabulary changes the generated artifact, the
 * ribbon renders whatever the artifact holds, and the deploy proceeds. Before this existed the
 * list lived in `lib/landing/vocabularies.ts` and a test asserted set-equality against the
 * synced catalogue, so retiring `responders` (specifications#38) froze every deploy for ~20h
 * until a human hand-edited two TypeScript files.
 *
 * Integrity problems that are genuinely the *specification's* (a `field` that disagrees with its
 * filename) are reported as warnings on the artifact rather than thrown, for the same reason.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse as parseToml } from 'smol-toml';

/** Where the specification keeps the vocabulary sources, relative to its repo root. */
export const VOCAB_DIR = 'vocabularies';
export const VOCAB_SUFFIX = '.vocab.toml';

/** Where the derived artifact lands, relative to the website repo root. */
export const GENERATED_REL = join('lib', 'generated', 'vocabularies.ts');

/** How many sample values the ribbon shows per vocabulary. */
export const SAMPLE_COUNT = 6;

/**
 * `SAMPLE_COUNT` values: the first few, or spread evenly through a long vocabulary so the
 * sample is representative of the whole range rather than its alphabetical head.
 */
export function pickSamples(values, count = SAMPLE_COUNT) {
  if (values.length <= count) return [...values];
  const last = values.length - 1;
  return Array.from({ length: count }, (_, i) => values[Math.round((i * last) / (count - 1))]);
}

/** The vocabulary's declared value key — the field a detection author actually writes. */
export function valueKeyFor(doc) {
  if (typeof doc.key === 'string' && doc.key) return doc.key;
  const first = Array.isArray(doc.keys) ? doc.keys[0] : undefined;
  if (first && typeof first === 'object' && typeof first.name === 'string') return 'name';
  return 'id';
}

/**
 * The stage identifiers a vocabulary declares as `[[stages]]` tables.
 *
 * `stages` comes in two shapes, and only one of them scopes values. A *table* array
 * (`[[stages]]` with `id`/`name`) declares the stage namespace of a scoped vocabulary —
 * `surface`, `signal.entities`, `actors`, `chaining_relations`, `malapi`. A plain *string*
 * array (`stages = ["Reconnaissance", ...]` in `att&ck` and `killchain`) is classification
 * metadata whose values stay bare. Returning `[]` for the string form is what keeps `att&ck`
 * rendering `T1548` rather than `Defense Evasion::T1548`.
 */
export function stageIdsFor(doc) {
  if (!Array.isArray(doc.stages)) return [];
  return doc.stages
    .map((s) => (s && typeof s === 'object' ? (s.id ?? s.name) : undefined))
    .filter((s) => typeof s === 'string' && s);
}

/** The stage identifiers a key belongs to, as a list. A key may belong to several. */
export function stagesForEntry(entry) {
  const stages = entry['tide.vocab.stages'];
  if (Array.isArray(stages)) return stages.filter((s) => typeof s === 'string' && s);
  if (typeof stages === 'string' && stages) return [stages];
  return [];
}

/**
 * The authored values for one vocabulary — what a detection author actually writes.
 *
 * A vocabulary that declares `[[stages]]` tables is a *staged* vocabulary, and
 * [RFC 0005](https://github.com/OpenTideHQ/specifications/blob/main/rfcs/0005-scoped-signal-entities.md)
 * ("one prefixing rule for every staged vocabulary") makes its authored values `<stage>::<key>`.
 * The prefix is load-bearing: it tells two stages' identically-named keys apart, so a key in
 * several stages yields one authored value per stage — which is why `signal.entities` resolves
 * to 35 values from 28 keys, the count RFC 0005 states. `specs/objects/threat-1.0.md` is
 * explicit that the unscoped form is invalid (`att&ck::G0007`, never `G0007`).
 */
export function authoredValues(doc, entries, valueKey, stageIds = stageIdsFor(doc)) {
  const staged = stageIds.length > 0;
  const values = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    // A key retired in place by `removed` is no longer part of the contract.
    if (entry.removed !== undefined && entry.removed !== null && entry.removed !== '') continue;
    const raw = entry[valueKey];
    if (typeof raw !== 'string' || !raw) continue;
    const label = typeof entry.name === 'string' && entry.name ? entry.name : raw;
    const stages = staged ? stagesForEntry(entry) : [];
    if (stages.length === 0) {
      values.push({ value: raw, label });
      continue;
    }
    for (const stage of stages) values.push({ value: `${stage}::${raw}`, label });
  }
  return values;
}

/** Parse one `<field>.vocab.toml` into the shape the artifact stores. */
export function readVocabularyFile(path) {
  const fileName = basename(path);
  const stem = fileName.slice(0, -VOCAB_SUFFIX.length);
  const doc = parseToml(readFileSync(path, 'utf8'));

  const warnings = [];
  const field = typeof doc.field === 'string' && doc.field ? doc.field : stem;
  if (field !== stem) {
    warnings.push(`${fileName}: declares field "${field}" but the filename says "${stem}"`);
  }

  const entries = Array.isArray(doc.keys) ? doc.keys : [];
  const valueKey = valueKeyFor(doc);
  const stageIds = stageIdsFor(doc);
  const values = authoredValues(doc, entries, valueKey, stageIds);

  return {
    vocabulary: {
      field,
      file: fileName,
      name: typeof doc.name === 'string' ? doc.name : field,
      description: typeof doc.description === 'string' ? doc.description : '',
      reference: typeof doc.reference === 'string' ? doc.reference : '',
      valueKey,
      staged: stageIds.length > 0,
      stages: stageIds,
      keyCount: entries.length,
      valueCount: values.length,
      samples: pickSamples(values),
    },
    warnings,
  };
}

/** Every `*.vocab.toml` the specification ships, by filename, sorted for a stable artifact. */
export function listVocabularyFiles(specificationsRoot) {
  const dir = join(specificationsRoot, VOCAB_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(VOCAB_SUFFIX))
    .sort()
    .map((name) => join(dir, name));
}

/** Build the artifact from a checked-out specifications tree. Never throws on spec content. */
export function buildVocabularyIndex(specificationsRoot, { sha = '' } = {}) {
  const files = listVocabularyFiles(specificationsRoot);
  const vocabularies = [];
  const warnings = [];
  for (const path of files) {
    try {
      const { vocabulary, warnings: fileWarnings } = readVocabularyFile(path);
      vocabularies.push(vocabulary);
      warnings.push(...fileWarnings);
    } catch (error) {
      // A malformed TOML is the specification's problem to fix; it must not take the site down.
      warnings.push(`${basename(path)}: could not be parsed (${error.message})`);
    }
  }
  return {
    source: { repo: 'OpenTideHQ/specifications', directory: VOCAB_DIR, sha },
    count: vocabularies.length,
    warnings,
    vocabularies,
  };
}

/** Render the index as a TypeScript module. */
export function renderModule(index) {
  const json = (value) => JSON.stringify(value);
  const lines = [
    '/**',
    ' * GENERATED FILE — DO NOT EDIT.',
    ' *',
    ` * Derived from ${index.source.repo}/${index.source.directory} by`,
    ' * `scripts/lib/vocab-derive.mjs`, which runs as part of `pnpm sync:content`.',
    ' * Edit the vocabularies in the specification, then re-run the sync.',
    ' */',
    '',
    '/** One vocabulary, as the specification defines it. */',
    'export type GeneratedVocabulary = {',
    '  /** The YAML/JSON field path this vocabulary constrains, e.g. `tlp`, `detection.methodology`. */',
    '  readonly field: string;',
    '  /** Source filename in the specification. */',
    '  readonly file: string;',
    '  /** Human-readable vocabulary name. */',
    '  readonly name: string;',
    '  readonly description: string;',
    '  readonly reference: string;',
    '  /** Whether entries are keyed by `name` or `id`. */',
    '  readonly valueKey: string;',
    '  /** True when authored values are stage-prefixed `<stage>::<key>` (RFC 0005). */',
    '  readonly staged: boolean;',
    '  readonly stages: readonly string[];',
    '  /** `[[keys]]` entries in the source file. */',
    '  readonly keyCount: number;',
    '  /** Authored values, after stage expansion — a multi-stage key yields one per stage. */',
    '  readonly valueCount: number;',
    '  /** A representative handful of authored values, for display. */',
    '  readonly samples: readonly { readonly value: string; readonly label: string }[];',
    '};',
    '',
    '/** The specification commit this was derived from. */',
    'export const VOCABULARY_SOURCE = {',
    `  repo: ${json(index.source.repo)},`,
    `  directory: ${json(index.source.directory)},`,
    `  sha: ${json(index.source.sha)},`,
    '} as const;',
    '',
    '/** Integrity problems found in the specification while deriving. */',
    `export const VOCABULARY_WARNINGS: readonly string[] = ${
      index.warnings.length === 0 ? '[]' : `[\n${index.warnings.map((w) => `  ${json(w)},`).join('\n')}\n]`
    };`,
    '',
    '/** Every vocabulary the specification ships, in filename order. */',
    'export const GENERATED_VOCABULARIES: readonly GeneratedVocabulary[] = [',
  ];

  for (const v of index.vocabularies) {
    lines.push('  {');
    lines.push(`    field: ${json(v.field)},`);
    lines.push(`    file: ${json(v.file)},`);
    lines.push(`    name: ${json(v.name)},`);
    lines.push(`    description: ${json(v.description)},`);
    lines.push(`    reference: ${json(v.reference)},`);
    lines.push(`    valueKey: ${json(v.valueKey)},`);
    lines.push(`    staged: ${v.staged},`);
    lines.push(`    stages: ${json(v.stages)},`);
    lines.push(`    keyCount: ${v.keyCount},`);
    lines.push(`    valueCount: ${v.valueCount},`);
    lines.push('    samples: [');
    for (const s of v.samples) lines.push(`      { value: ${json(s.value)}, label: ${json(s.label)} },`);
    lines.push('    ],');
    lines.push('  },');
  }

  lines.push('];', '');
  return lines.join('\n');
}

/** Write the artifact to `lib/generated/vocabularies.ts`. Returns the index it wrote. */
export function deriveVocabularies({ specificationsRoot, root, sha = '', outPath } = {}) {
  const index = buildVocabularyIndex(specificationsRoot, { sha });
  const dest = outPath ?? join(root, GENERATED_REL);
  mkdirSync(join(dest, '..'), { recursive: true });
  writeFileSync(dest, renderModule(index));
  return index;
}
