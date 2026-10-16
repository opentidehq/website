/**
 * Publish specifications/rfcs as browsable docs pages.
 *
 * The specifications repository is the source of truth. Each sync rebuilds
 * /docs/specifications/rfcs from the markdown files and the RFC README index,
 * including reserved numbers that do not have a file yet.
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export const SPECS_GITHUB = 'https://github.com/OpenTideHQ/specifications/blob/main';
export const RFC_TEMPLATE_FILENAME = '0000-template.md';

/** Browse order: open proposals first, then accepted work, then closed states. */
export const RFC_STATUS_ORDER = [
  'proposed',
  'draft',
  'accepted',
  'reserved',
  'rejected',
  'superseded',
  'template',
];

const HIDDEN_BANNER_LABELS = new Set(['rfc', 'title', 'status']);
const INDEX_PLACEHOLDER = 'RFCINDEXPLACEHOLDER';

export function statusLabel(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function yamlScalar(value) {
  if (value === '') return '""';
  if (/^[A-Za-z0-9][A-Za-z0-9 ._-]*$/.test(value) && !/^(true|false|null|yes|no)$/i.test(value)) {
    return value;
  }
  return JSON.stringify(value);
}

export function mdxJsonProp(value) {
  return `{${JSON.stringify(JSON.stringify(value))}}`;
}

export function plainText(markdown) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`|\*+|(?<![A-Za-z0-9])_+|_+(?![A-Za-z0-9])/g, (_, code) => code ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function clipText(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > 40 ? cut.slice(0, space) : cut).trim()}…`;
}

function bracketsBalanced(text) {
  let paren = 0;
  let bracket = 0;
  for (const ch of text) {
    if (ch === '(') paren += 1;
    else if (ch === ')') paren -= 1;
    else if (ch === '[') bracket += 1;
    else if (ch === ']') bracket -= 1;
    if (paren < 0 || bracket < 0) return false;
  }
  return paren === 0 && bracket === 0;
}

export function rfcDescription(paragraph) {
  const text = plainText(paragraph);
  if (!text) return '';
  if (text.length <= 180 && bracketsBalanced(text)) return text;
  const window = text.slice(0, 180);
  const sentence = window.match(/^([\s\S]{40,}?[.!?])(?:\s|$)/);
  if (sentence && sentence[1].length < text.length && bracketsBalanced(sentence[1])) return sentence[1];
  let cut = window.lastIndexOf(' ');
  while (cut >= 60) {
    const slice = window.slice(0, cut).trim();
    if (bracketsBalanced(slice)) return `${slice}…`;
    cut = window.lastIndexOf(' ', cut - 1);
  }
  return clipText(text, 160);
}

/**
 * MDX treats `{...}`, `<Tag>`, HTML comments, and column-1 `import` / `export`
 * statements as JavaScript. RFC sources are markdown, so neutralize those
 * outside CommonMark code spans and fences.
 *
 * Fences are recognized only when the opening marker is at the start of a
 * line (0–3 spaces). A backtick run later in a paragraph is not a fence, and
 * treating it as one would leave the following expression live.
 */
export function escapeMdxProse(markdown) {
  const lines = markdown.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const parts = [];
  let fence = null;
  let prose = [];

  const flushProse = () => {
    if (prose.length === 0) return;
    parts.push(escapeProseBlock(prose.join('\n')));
    prose = [];
  };

  for (const line of lines) {
    if (fence) {
      parts.push(line);
      if (closingFence(line, fence)) fence = null;
      continue;
    }
    const opened = openingFence(line);
    if (opened) {
      flushProse();
      fence = opened;
      parts.push(line);
      continue;
    }
    prose.push(line);
  }
  flushProse();
  return parts.join('\n');
}

function openingFence(line) {
  const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) return null;
  const marker = match[2];
  const info = match[3];
  // A backtick fence's info string cannot contain a backtick. That line is
  // prose, and the characters after it must still be escaped.
  if (marker.startsWith('`') && info.includes('`')) return null;
  return { char: marker[0], length: marker.length };
}

function closingFence(line, open) {
  const match = /^( {0,3})(`{3,}|~{3,})[ \t]*$/.exec(line);
  if (!match) return false;
  const marker = match[2];
  return marker[0] === open.char && marker.length >= open.length;
}

function escapeProseBlock(block) {
  const masks = [];
  const masked = block.replace(/`[^`\n]+`/g, (span) => {
    const token = `\u0000${masks.length}\u0000`;
    masks.push(span);
    return token;
  });
  const escaped = neutralizeEsm(
    masked
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/[{}]/g, (ch) => `\\${ch}`)
      .replace(/<(?!https?:\/\/)(?=[A-Za-z/!?])/g, '&lt;'),
  );
  return escaped.replace(/\u0000(\d+)\u0000/g, (_, index) => masks[Number(index)] ?? '');
}

/** micromark only accepts `import ` / `export ` at column 1. */
function neutralizeEsm(text) {
  return text
    .split('\n')
    .map((line) => (/^(import|export) /.test(line) ? `\u200b${line}` : line))
    .join('\n');
}

export function parseRichText(value) {
  const cleaned = value.replace(/`([^`]+)`/g, '$1');
  const parts = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const match of cleaned.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ kind: 'text', text: cleaned.slice(last, index) });
    parts.push({ kind: 'link', text: match[1], href: match[2] });
    last = index + match[0].length;
  }
  if (last < cleaned.length) parts.push({ kind: 'text', text: cleaned.slice(last) });
  return parts.filter((part) => part.text.length > 0);
}

export function rewriteRichText(parts, rewriteHref, fromDir = 'specifications/rfcs') {
  if (!rewriteHref) return parts;
  return parts.map((part) =>
    part.kind === 'link' ? { ...part, href: rewriteHref(part.href, fromDir) } : part,
  );
}

export function splitRfcDocument(markdown) {
  const h1Match = markdown.match(/^#\s+(.+)\r?\n?/);
  const h1 = h1Match?.[1]?.trim() ?? 'RFC';
  let rest = h1Match ? markdown.slice(h1Match[0].length) : markdown;
  rest = rest.replace(/^\r?\n+/, '');
  const lines = rest.split(/\r?\n/);
  const fields = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (line.trim() === '') {
      if (fields.length === 0) {
        index += 1;
        continue;
      }
      break;
    }
    const match = line.match(/^- \*\*([^*]+):\*\*\s*(.*)$/);
    if (!match) break;
    fields.push({ label: match[1].trim(), value: match[2].trim() });
    index += 1;
  }
  const body = lines.slice(index).join('\n').replace(/^\n+/, '');
  return { h1, fields, body, rest };
}

function fieldValue(fields, label) {
  return fields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value ?? null;
}

function summaryParagraph(body) {
  const match = body.match(/^##\s+Summary[^\n]*\n+([\s\S]*)$/m);
  const chunk = match ? (match[1].split(/\n## |\n# /)[0] ?? '') : body;
  const paragraph = chunk
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#') && !part.startsWith('|') && !part.startsWith('-') && !part.startsWith('>'));
  return paragraph ?? '';
}

export function parseRfcFile(filename, markdown, rewriteHref) {
  const isTemplate = filename === RFC_TEMPLATE_FILENAME;
  const number = filename.match(/^(\d{4})-/)?.[1] ?? '0000';
  const slug = filename.replace(/\.mdx?$/i, '');
  const split = splitRfcDocument(markdown);
  const statusRaw = (fieldValue(split.fields, 'status') ?? 'draft').trim().toLowerCase();
  const status = isTemplate ? 'template' : statusRaw.split(/\s+/)[0] ?? 'draft';
  const shortTitle = fieldValue(split.fields, 'title');
  const title = isTemplate ? 'RFC template' : split.h1;
  const body = isTemplate ? split.rest.replace(/^\n+/, '') : split.body;
  const summarySource = summaryParagraph(body);
  const description = isTemplate
    ? 'Starting point for a new proposal. Not a live RFC.'
    : rfcDescription(summarySource) || `RFC ${number}`;
  const bannerFields = isTemplate
    ? []
    : split.fields
        .filter((field) => !HIDDEN_BANNER_LABELS.has(field.label.toLowerCase()))
        .map((field) => ({
          label: field.label,
          parts: rewriteRichText(parseRichText(field.value), rewriteHref),
        }));

  return {
    filename,
    slug,
    number,
    isTemplate,
    status,
    title,
    shortTitle: shortTitle?.trim() || title.replace(/^RFC\s+\d{4}:\s*/i, '').trim() || title,
    description,
    summary: description,
    body,
    banner: {
      number,
      status,
      note: isTemplate ? 'Copy this file when drafting a proposal. It is not a live RFC.' : null,
      fields: bannerFields,
    },
  };
}

export function renderRfcDocument(model) {
  return [
    '---',
    `title: ${yamlScalar(model.title)}`,
    `description: ${yamlScalar(model.description)}`,
    `status: ${yamlScalar(model.status)}`,
    `rfc: ${JSON.stringify(model.number)}`,
    '---',
    '',
    `<RfcBanner entry=${mdxJsonProp(model.banner)} />`,
    '',
    escapeMdxProse(model.body).replace(/^\n+/, ''),
    '',
  ].join('\n');
}

export function parseReadmeIndex(markdown) {
  const rows = [];
  const rowRe = /^\|\s*\[(\d{4})\]\(([^)]+)\)\s*\|\s*(.*?)\s*\|\s*([A-Za-z]+)\s*\|$/gm;
  for (const match of markdown.matchAll(rowRe)) {
    rows.push({
      number: match[1],
      href: match[2].trim(),
      title: match[3].trim(),
      status: match[4].trim().toLowerCase(),
    });
  }
  return rows;
}

function reservedHref(href) {
  if (/^https?:\/\//i.test(href)) return href;
  const name = href.split('/').pop() || href;
  return `${SPECS_GITHUB}/rfcs/${name}`;
}

export function mergeRfcCatalog(models, readmeRows) {
  const entries = [];
  const seen = new Set();
  for (const model of models) {
    if (model.isTemplate) continue;
    seen.add(model.number);
    entries.push({
      number: model.number,
      slug: model.slug,
      title: model.shortTitle,
      status: model.status,
      summary: model.summary,
      href: `/docs/specifications/rfcs/${model.slug}/`,
      external: false,
    });
  }
  for (const row of readmeRows) {
    if (seen.has(row.number) || row.number === '0000') continue;
    entries.push({
      number: row.number,
      slug: null,
      title: row.title,
      status: row.status,
      summary: 'Reserved in the RFC index. The proposal file is not in the repository yet.',
      href: reservedHref(row.href),
      external: true,
    });
  }
  const rank = (status) => {
    const index = RFC_STATUS_ORDER.indexOf(status);
    return index === -1 ? RFC_STATUS_ORDER.length : index;
  };
  entries.sort((a, b) => rank(a.status) - rank(b.status) || b.number.localeCompare(a.number));
  return entries;
}

function stripH1(markdown) {
  const match = markdown.match(/^#\s+.+\r?\n+/);
  if (!match) return markdown.replace(/^\n+/, '');
  return markdown.slice(match[0].length);
}

function dropFirstParagraph(body, lede) {
  if (!lede) return body;
  const index = body.indexOf(lede);
  if (index === -1) return body;
  return `${body.slice(0, index)}${body.slice(index + lede.length)}`.replace(/^\n+/, '');
}

const INDEX_TABLE_RE = /\|[^\n]*RFC[^\n]*\|[^\n]*Title[^\n]*\|[^\n]*Status[^\n]*\|\r?\n\|[-| :]+\|\r?\n(?:\|.*\|\r?\n?)*/i;

export function renderRfcIndex(readme, entries) {
  const lede = summaryParagraph(stripH1(readme));
  const description = rfcDescription(lede) || 'Proposals for changes to the opentide specifications.';
  let body = dropFirstParagraph(stripH1(readme), lede);
  if (INDEX_TABLE_RE.test(body)) {
    body = body.replace(INDEX_TABLE_RE, `\n${INDEX_PLACEHOLDER}\n\n`);
  } else if (body.includes('## Index')) {
    body = body.replace('## Index', `## Index\n\n${INDEX_PLACEHOLDER}\n`);
  } else {
    body = `${INDEX_PLACEHOLDER}\n\n${body}`;
  }
  const component = `<RfcIndex entries=${mdxJsonProp(entries)} />`;
  const escaped = escapeMdxProse(body).replaceAll(INDEX_PLACEHOLDER, component);
  return ['---', 'title: RFC index', `description: ${yamlScalar(description)}`, '---', '', escaped.replace(/^\n+/, ''), ''].join(
    '\n',
  );
}

export function buildRfcFolderMeta(entries, templateSlug) {
  const pages = ['index'];
  const grouped = new Map();
  for (const entry of entries) {
    if (!entry.slug) continue;
    const list = grouped.get(entry.status) ?? [];
    list.push(entry.slug);
    grouped.set(entry.status, list);
  }
  const used = new Set(RFC_STATUS_ORDER);
  for (const status of RFC_STATUS_ORDER) {
    const slugs = grouped.get(status);
    if (!slugs?.length) continue;
    pages.push(`---${statusLabel(status)}---`, ...slugs);
  }
  for (const [status, slugs] of grouped) {
    if (used.has(status) || !slugs.length) continue;
    pages.push(`---${statusLabel(status)}---`, ...slugs);
  }
  if (templateSlug) pages.push('---Template---', templateSlug);
  return {
    title: 'RFCs',
    description: 'Proposals for changes to the opentide specifications',
    icon: 'ScrollText',
    defaultOpen: true,
    pages,
  };
}

export function withRfcNav(meta) {
  if (!meta || typeof meta !== 'object' || !Array.isArray(meta.pages)) return meta;
  if (meta.pages.includes('rfcs')) return meta;
  return { ...meta, pages: [...meta.pages, '---RFCs---', 'rfcs'] };
}

export function ensureRfcDiscovery(markdown) {
  if (markdown.includes('rfcs/')) return markdown;
  return `${markdown.trimEnd()}

## Proposals

Non-trivial changes are written up as [RFCs](rfcs/README.md) before they become normative. The index lists each proposal and its status.
`;
}

function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function isRegularFile(path) {
  try {
    return lstatSync(path).isFile();
  } catch {
    return false;
  }
}

export function readRfcSources(rfcDir) {
  if (isSymlink(rfcDir)) return [];
  let entries;
  try {
    entries = readdirSync(rfcDir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
    .map((entry) => entry.name)
    .sort();
}

export function syncRfcSection({ specificationsRoot, specOut, outDir, rewriteHref }) {
  const rfcSrc = join(specificationsRoot, 'rfcs');
  if (isSymlink(rfcSrc) || !existsSync(rfcSrc)) return null;

  const rfcOut = join(specOut, 'rfcs');
  mkdirSync(rfcOut, { recursive: true });

  const models = [];
  for (const name of readRfcSources(rfcSrc)) {
    const sourcePath = join(rfcSrc, name);
    if (!isRegularFile(sourcePath)) continue;
    const model = parseRfcFile(name, readFileSync(sourcePath, 'utf8'), rewriteHref);
    models.push(model);
    const dest = join(rfcOut, `${model.slug}.mdx`);
    writeFileSync(dest, renderRfcDocument(model));
  }

  const readmePath = join(rfcSrc, 'README.md');
  const readme = isRegularFile(readmePath)
    ? readFileSync(readmePath, 'utf8')
    : '# RFCs\n\nProposals for specification changes.\n\n## Index\n\n';
  const entries = mergeRfcCatalog(models, parseReadmeIndex(readme));
  const indexPath = join(rfcOut, 'index.mdx');
  writeFileSync(indexPath, renderRfcIndex(readme, entries));
  const template = models.find((model) => model.isTemplate);
  writeFileSync(
    join(rfcOut, 'meta.json'),
    `${JSON.stringify(buildRfcFolderMeta(entries, template?.slug ?? null), null, 2)}\n`,
  );

  return {
    synced: true,
    count: models.length,
    entries,
    indexPath: relative(outDir, indexPath),
  };
}
