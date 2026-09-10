#!/usr/bin/env node
/**
 * Sync documentation from opentide and specifications repos into content/docs/.
 *
 * Path resolution (first match wins):
 *   OPENTIDE_DOCS_PATH  → vendor/opentide/docs → ../opentide/docs
 *   SPECIFICATIONS_PATH → vendor/specifications → ../specifications
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'content', 'docs');

const OPENTIDE_SECTIONS = ['usage', 'cli', 'mcp', 'sdk'];

function resolvePath(envVar, candidates, validate) {
  if (process.env[envVar]) {
    const p = resolve(process.env[envVar]);
    if (!existsSync(p)) throw new Error(`${envVar} points to missing path: ${p}`);
    if (validate && !validate(p)) {
      throw new Error(`${envVar} points to an incomplete documentation tree: ${p}`);
    }
    return p;
  }
  for (const candidate of candidates) {
    const p = resolve(ROOT, candidate);
    if (existsSync(p) && (!validate || validate(p))) return p;
  }
  throw new Error(
    `Could not resolve ${envVar}. Set the env var or add vendor submodules. Tried: ${candidates.join(', ')}`,
  );
}

function isOpentideDocsPath(p) {
  return existsSync(join(p, 'usage', 'meta.json'));
}

function isSpecificationsPath(p) {
  return existsSync(join(p, 'specs'));
}

function copyDir(src, dest, { exclude = [] } = {}) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to, { exclude });
    } else {
      cpSync(from, to);
    }
  }
}

function extractTitleAndDescription(body) {
  const h1 = body.match(/^#\s+(.+)$/m);
  const summary = body.match(/^## Summary\s*\n+([\s\S]*?)(?=\n## |\n# |\Z)/m);
  const firstPara = body
    .replace(/^#.*\n+/m, '')
    .split('\n\n')
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('-'));

  const title = h1?.[1]?.trim() ?? 'Untitled';
  const description =
    summary?.[1]
      ?.split('\n')
      .map((l) => l.trim())
      .filter(Boolean)[0]
      ?.slice(0, 320) ??
    firstPara?.slice(0, 320) ??
    `opentide normative specification — ${title}`;

  return { title, description };
}

function yamlValue(value) {
  if (/[:#\n'"]/.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function transformSpecFrontmatter(content, relPath) {
  const hasFrontmatter = content.startsWith('---\n');
  let frontmatter = '';
  let body = content;

  if (hasFrontmatter) {
    const end = content.indexOf('\n---\n', 4);
    if (end === -1) return content;
    frontmatter = content.slice(4, end);
    body = content.slice(end + 5);
  }

  if (/^title:\s/m.test(frontmatter)) {
    return postProcessMarkdown(content);
  }

  const { title, description } = extractTitleAndDescription(body);
  const specMatch = frontmatter.match(/^spec:\s*(.+)$/m);
  const versionMatch = frontmatter.match(/^version:\s*"?([^"\n]+)"?/m);
  const resolvedTitle =
    specMatch && !h1InBody(body)
      ? `${specMatch[1].trim()} ${versionMatch?.[1] ?? ''}`.trim()
      : title;

  const fumadocsLines = [
    `title: ${yamlValue(resolvedTitle)}`,
    `description: ${yamlValue(description)}`,
  ];
  if (frontmatter.trim()) {
    fumadocsLines.push(frontmatter.trim());
  }

  return postProcessMarkdown(`---\n${fumadocsLines.join('\n')}\n---\n${body}`);
}

function h1InBody(body) {
  return /^#\s+/m.test(body);
}

const SPECS_BLOB = 'https://github.com/OpenTideHQ/specifications/blob/main';
const OPENTIDE_BLOB = 'https://github.com/OpenTideHQ/opentide/blob/development/docs';

function splitFrontmatter(content) {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  return { frontmatter: content.slice(4, end), body: content.slice(end + 5) };
}

function joinFrontmatter(frontmatter, body) {
  return `---\n${frontmatter}\n---\n\n${body.replace(/^\s+/, '')}`;
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return null;
  const raw = match[1].trim();
  if (raw.startsWith('"')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw.slice(1, -1);
    }
  }
  return raw;
}

function normalizeProse(value) {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * The docs layout renders the frontmatter title as the page h1, so a leading body
 * H1 is always redundant — and would make the page carry two h1 elements.
 */
function stripLeadingH1(content) {
  const parts = splitFrontmatter(content);
  if (!parts) return content;
  if (!frontmatterValue(parts.frontmatter, 'title')) return content;
  const leadingH1 = parts.body.match(/^\s*#\s+.+?\s*(?:\n|$)/);
  if (!leadingH1) return content;
  return joinFrontmatter(parts.frontmatter, parts.body.slice(leadingH1[0].length));
}

/**
 * Spec pages open with a `## Summary` whose first paragraph becomes the frontmatter
 * description. The layout already renders that description, so drop the duplicated
 * paragraph — and the heading with it, keeping any remaining prose as the page lead.
 */
function stripRedundantSummary(content) {
  const parts = splitFrontmatter(content);
  if (!parts) return content;
  const description = frontmatterValue(parts.frontmatter, 'description');
  if (!description) return content;

  const section = parts.body.match(/^##\s+Summary\s*\n([\s\S]*?)(?=\n##\s|\n#\s|$)/m);
  if (!section) return content;

  const paragraphs = section[1]
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paragraphs.length) return content;
  if (normalizeProse(paragraphs[0]) !== normalizeProse(description)) return content;

  const remaining = paragraphs.slice(1).join('\n\n');
  const body =
    parts.body.slice(0, section.index) +
    (remaining ? `${remaining}\n` : '') +
    parts.body.slice(section.index + section[0].length);
  return joinFrontmatter(parts.frontmatter, body);
}

function rewritePublishedLinks(content) {
  return content
    .replace(/\]\(\.\.\/\.\.\/fixtures\//g, `](${SPECS_BLOB}/fixtures/`)
    .replace(/\]\(\.\.\/fixtures\//g, `](${SPECS_BLOB}/fixtures/`)
    .replace(/\]\(fixtures\//g, `](${SPECS_BLOB}/fixtures/`)
    .replace(/\]\(\.\.\/\.\.\/schemas\//g, `](${SPECS_BLOB}/schemas/`)
    .replace(/\]\(\.\.\/\.\.\/vocabularies\//g, `](${SPECS_BLOB}/vocabularies/`)
    .replace(/\]\(\.\.\/vocabularies\//g, `](${SPECS_BLOB}/vocabularies/`)
    .replace(/\]\(\.\.\/rfcs\//g, `](${SPECS_BLOB}/rfcs/`)
    .replace(/\]\(rfcs\//g, `](${SPECS_BLOB}/rfcs/`)
    .replace(/\]\(llms\.txt\)/g, `](${SPECS_BLOB}/llms.txt)`)
    .replace(/\]\(\.\.\/\.\.\/CHANGELOG\.md\)/g, `](${SPECS_BLOB}/CHANGELOG.md)`)
    .replace(/\]\(\.\.\/CHANGELOG\.md\)/g, `](${SPECS_BLOB}/CHANGELOG.md)`)
    .replace(/\]\(CHANGELOG\.md\)/g, `](${SPECS_BLOB}/CHANGELOG.md)`)
    .replace(
      /https:\/\/github\.com\/(?:OpenTide|opentide)\/opentide/g,
      'https://github.com/OpenTideHQ/opentide',
    )
    .replace(/\]\(\.\.\/\.\.\/internal\//g, `](${OPENTIDE_BLOB}/internal/`)
    .replace(/\]\(\.agents\//g, '](https://github.com/OpenTideHQ/opentide/blob/development/.agents/')
    .replace(/\]\(\.github\//g, '](https://github.com/OpenTideHQ/specifications/blob/main/.github/');
}

/** Brand is lowercase. Keep the GitHub org suffix HQ and the Python registry identifier. */
function rewriteBrandName(content) {
  const camel = 'Open' + 'Tide';
  const hq = camel + 'HQ';
  const registry = camel + 'Registry';
  const tick = '`' + camel + '`';
  const imported = 'from opentide import ' + camel;
  const exported = camel + ', __version__';
  const oldOrg = 'github.com/' + camel + '/';
  return content
    .replaceAll(hq, '\uE000HQ\uE001')
    .replaceAll(registry, '\uE000REG\uE001')
    .replaceAll(oldOrg, '\uE000OLDORG\uE001')
    .replaceAll(imported, '\uE000IMPORT\uE001')
    .replaceAll(exported, '\uE000EXPORT\uE001')
    .replaceAll(tick, '\uE000TICK\uE001')
    .replace(new RegExp(`${camel}(?=\\.[A-Za-z_])`, 'g'), '\uE000API\uE001')
    .replaceAll(camel, 'opentide')
    .replaceAll('\uE000HQ\uE001', hq)
    .replaceAll('\uE000REG\uE001', registry)
    .replaceAll('\uE000OLDORG\uE001', oldOrg)
    .replaceAll('\uE000IMPORT\uE001', imported)
    .replaceAll('\uE000EXPORT\uE001', exported)
    .replaceAll('\uE000TICK\uE001', tick)
    .replaceAll('\uE000API\uE001', camel);
}

function postProcessMarkdown(content) {
  return rewriteBrandName(rewritePublishedLinks(stripRedundantSummary(stripLeadingH1(content))));
}

function postProcessPublishedTree(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      postProcessPublishedTree(p);
      continue;
    }
    if (entry.name.endsWith('.md')) {
      writeFileSync(p, postProcessMarkdown(readFileSync(p, 'utf8')));
    } else if (entry.name.endsWith('.json')) {
      writeFileSync(p, rewriteBrandName(readFileSync(p, 'utf8')));
    }
  }
}

function syncMarkdownTree(srcDir, destDir, { exclude = [] } = {}) {
  if (!existsSync(srcDir)) return;
  mkdirSync(destDir, { recursive: true });

  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const from = join(srcDir, entry.name);
    const to = join(destDir, entry.name);

    if (entry.isDirectory()) {
      syncMarkdownTree(from, to, { exclude });
      continue;
    }

    if (!entry.name.endsWith('.md')) {
      cpSync(from, to);
      continue;
    }

    const rel = relative(srcDir, from);
    const raw = readFileSync(from, 'utf8');
    writeFileSync(to, transformSpecFrontmatter(raw, rel));
  }
}

function buildSpecificationsMeta() {
  return {
    root: true,
    title: 'Specifications',
    description: 'Normative opentide specifications for authors, maintainers, and agents',
    icon: 'FileText',
    pages: [
      'index',
      'SPECS',
      'conformance',
      '---Core---',
      'specs/versioning',
      'specs/metadata',
      'specs/workspace',
      'specs/configuration',
      'specs/deployment',
      'specs/validation',
      'specs/platforms',
      'specs/metaschema-keywords',
      '---Objects---',
      'specs/objects/threat-1.0',
      'specs/objects/objective-1.0',
      'specs/objects/rule-1.0',
      '---Vocabularies---',
      'specs/vocabularies/format',
      'specs/vocabularies/catalog',
      '---Governance---',
      'GOVERNANCE',
    ],
  };
}

function buildSpecificationsIndex() {
  return `---
title: Specifications
description: Normative opentide specifications — versioning, objects, vocabularies, and governance.
---

# opentide Specifications

Normative specifications define the contract between opentide implementations, detection repositories, and agent tooling. Each spec is independently versioned.

## Start here

| Document | Purpose |
|----------|---------|
| [Spec index](./SPECS.md) | One-page index of active spec versions |
| [Governance](./GOVERNANCE.md) | Change process and authority model |
| [Agent guide](./AGENTS.md) | How agents should read and apply specs |

## Object specs

- [Threat](./specs/objects/threat-1.0.md) — \`threat::1.0\`
- [Objective](./specs/objects/objective-1.0.md) — \`objective::1.0\`
- [Rule](./specs/objects/rule-1.0.md) — \`rule::1.0\` (exemplar spec)

Implementation lives in the [opentide](https://github.com/OpenTideHQ/opentide) Python package. JSON Schema is generated from Pydantic models — specs are the source of truth.
`;
}

function main() {
  if (process.env.SKIP_SYNC === '1') {
    console.log('sync-content: skipped (SKIP_SYNC=1)');
    return;
  }
  const opentideDocs = resolvePath(
    'OPENTIDE_DOCS_PATH',
    ['vendor/opentide/docs', '../opentide/docs'],
    isOpentideDocsPath,
  );
  const specificationsRoot = resolvePath(
    'SPECIFICATIONS_PATH',
    ['vendor/specifications', '../specifications'],
    isSpecificationsPath,
  );

  console.log(`sync-content: opentide docs ← ${opentideDocs}`);
  console.log(`sync-content: specifications ← ${specificationsRoot}`);

  if (existsSync(OUT)) {
    rmSync(OUT, { recursive: true, force: true });
  }
  mkdirSync(OUT, { recursive: true });

  for (const section of OPENTIDE_SECTIONS) {
    copyDir(join(opentideDocs, section), join(OUT, section));
  }

  // Specifications section
  const specOut = join(OUT, 'specifications');
  mkdirSync(specOut, { recursive: true });

  // Conceptual overview: prefer an authored site/index.md, else fall back to the generated stub.
  const authoredIndex = join(specificationsRoot, 'site', 'index.md');
  if (existsSync(authoredIndex)) {
    writeFileSync(
      join(specOut, 'index.md'),
      transformSpecFrontmatter(readFileSync(authoredIndex, 'utf8'), 'index.md'),
    );
  } else {
    writeFileSync(join(specOut, 'index.md'), buildSpecificationsIndex());
  }
  syncMarkdownTree(join(specificationsRoot, 'specs'), join(specOut, 'specs'));

  // RFCs are contributor/provenance docs — kept in the specifications repo, not published to the site.
  for (const file of ['SPECS.md', 'GOVERNANCE.md', 'conformance.md']) {
    const src = join(specificationsRoot, file);
    if (existsSync(src)) {
      const dest = join(specOut, file);
      const raw = readFileSync(src, 'utf8');
      writeFileSync(dest, transformSpecFrontmatter(raw, file));
    }
  }

  const siteMeta = join(specificationsRoot, 'site', 'meta.json');
  if (existsSync(siteMeta)) {
    cpSync(siteMeta, join(specOut, 'meta.json'));
  } else {
    writeFileSync(join(specOut, 'meta.json'), `${JSON.stringify(buildSpecificationsMeta(), null, 2)}\n`);
  }

  // Root navigation — five root sections only (Usage first; no docs index wrapper)
  writeFileSync(
    join(OUT, 'meta.json'),
    `${JSON.stringify(
      {
        pages: ['usage', 'specifications', 'cli', 'mcp', 'sdk'],
      },
      null,
      2,
    )}\n`,
  );

  const pageCount = countFiles(OUT, (f) => f.endsWith('.md'));
  postProcessPublishedTree(OUT);
  console.log(`sync-content: wrote ${pageCount} markdown pages to content/docs/`);
}

function countFiles(dir, predicate) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(p, predicate);
    else if (predicate(p)) count += 1;
  }
  return count;
}

main();
