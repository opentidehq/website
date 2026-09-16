/**
 * Sync documentation from opentide and specifications repos into content/docs/.
 *
 * Published pages are always `.mdx` so Fumadocs compiles JSX (Tabs, Callout, Cards, Steps).
 * A `.sync-stamp.json` records the source git SHAs so CI can refuse submodule bumps
 * that did not refresh the committed tree.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..', '..');
export const OUT = join(ROOT, 'content', 'docs');
export const STAMP_NAME = '.sync-stamp.json';

export const OPENTIDE_SECTIONS = ['usage', 'cli', 'mcp', 'sdk'];

export const SPECS_BLOB = 'https://github.com/OpenTideHQ/specifications/blob/main';
const OPENTIDE_BLOB = 'https://github.com/OpenTideHQ/opentide/blob/development/docs';

/** Repo-root trees that are never published under content/docs (no specs/<tree> pages). */
const UNPUBLISHED_SPECS_TREES = ['fixtures', 'schemas', 'rfcs'];
const UNPUBLISHED_SPEC_FILES = ['AGENTS.md', 'CHANGELOG.md', 'llms.txt'];
/** Repo-root `vocabularies/` is unpublished; `specifications/specs/vocabularies/` is published. */
const UNPUBLISHED_SPEC_TOP_LEVEL = new Set([...UNPUBLISHED_SPECS_TREES, 'vocabularies', ...UNPUBLISHED_SPEC_FILES]);

/**
 * Map a path under content/docs to a GitHub blob when it would 404 on the site.
 * `specifications/specs/vocabularies/` is published; repo-root `vocabularies/` is not.
 */
export function unpublishedSpecsUrl(resolved, hash = '') {
  const normalized = resolved.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized.startsWith('specifications/')) return null;
  const rest = normalized.slice('specifications/'.length);
  const top = rest.split('/')[0];
  if (!top || !UNPUBLISHED_SPEC_TOP_LEVEL.has(top)) return null;
  return `${SPECS_BLOB}/${rest}${hash}`;
}

export function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

export function isRegularFile(path) {
  try {
    return lstatSync(path).isFile();
  } catch {
    return false;
  }
}

export function publishedDestName(name) {
  if (name.endsWith('.md') && !name.endsWith('.mdx')) {
    return `${name.slice(0, -3)}.mdx`;
  }
  return name;
}

export function isMarkdownSource(name) {
  return name.endsWith('.md') && !name.endsWith('.mdx');
}

export function isPublishedPage(name) {
  return name.endsWith('.mdx') || isMarkdownSource(name);
}

export function resolvePath(envVar, candidates, validate, { root = ROOT, env = process.env } = {}) {
  if (env[envVar]) {
    const p = resolve(env[envVar]);
    if (!existsSync(p)) throw new Error(`${envVar} points to missing path: ${p}`);
    if (validate && !validate(p)) {
      throw new Error(`${envVar} points to an incomplete documentation tree: ${p}`);
    }
    return p;
  }
  for (const candidate of candidates) {
    const p = resolve(root, candidate);
    if (existsSync(p) && (!validate || validate(p))) return p;
  }
  throw new Error(
    `Could not resolve ${envVar}. Set the env var or add vendor submodules. Tried: ${candidates.join(', ')}`,
  );
}

export function isOpentideDocsPath(p) {
  return existsSync(join(p, 'usage', 'meta.json'));
}

export function isSpecificationsPath(p) {
  return existsSync(join(p, 'specs'));
}

export function gitRevParse(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

export function gitHeadForPath(start) {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    const sha = gitRevParse(dir);
    if (sha) return { sha, repo: dir };
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return { sha: null, repo: null };
}

export function gitLinkSha(root, submodulePath) {
  try {
    const out = execFileSync('git', ['-C', root, 'ls-tree', 'HEAD', submodulePath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const match = out.match(/^160000\s+commit\s+([0-9a-f]{40})\t/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function stampPath(outDir = OUT) {
  return join(outDir, STAMP_NAME);
}

export function readSyncStamp(outDir = OUT) {
  const p = stampPath(outDir);
  if (!existsSync(p)) return null;
  const parsed = JSON.parse(readFileSync(p, 'utf8'));
  if (typeof parsed !== 'object' || parsed === null) return null;
  return parsed;
}

export function writeSyncStamp(outDir, stamp) {
  writeFileSync(stampPath(outDir), `${JSON.stringify(stamp, null, 2)}\n`);
}

export function extractTitleAndDescription(body) {
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

export function yamlValue(value) {
  if (/[:#\n'"]/.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

export function splitFrontmatter(content) {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  return { frontmatter: content.slice(4, end), body: content.slice(end + 5) };
}

export function joinFrontmatter(frontmatter, body) {
  return `---\n${frontmatter}\n---\n\n${body.replace(/^\s+/, '')}`;
}

export function frontmatterValue(frontmatter, key) {
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

export function normalizeProse(value) {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * The docs layout renders the frontmatter title as the page h1, so a leading body
 * H1 is always redundant — and would make the page carry two h1 elements.
 */
export function stripLeadingH1(content) {
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
export function stripRedundantSummary(content) {
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

export function rewritePublishedLinks(content) {
  let out = content;
  for (const tree of UNPUBLISHED_SPECS_TREES) {
    out = out.replace(new RegExp(`\\]\\((?:\\.\\.?/)*${tree}/`, 'g'), `](${SPECS_BLOB}/${tree}/`);
  }
  // Require `../` so `vocabularies/format.md` under specs/ stays a published page.
  out = out.replace(/\]\((?:\.\.\/)+vocabularies\//g, `](${SPECS_BLOB}/vocabularies/`);
  for (const file of UNPUBLISHED_SPEC_FILES) {
    const escaped = file.replaceAll('.', '\\.');
    out = out.replace(new RegExp(`\\]\\((?:\\.\\.?/)*${escaped}\\)`, 'g'), `](${SPECS_BLOB}/${file})`);
  }
  return out
    .replace(
      /https:\/\/github\.com\/(?:OpenTide|opentide)\/opentide/g,
      'https://github.com/OpenTideHQ/opentide',
    )
    .replace(/\]\((?:\.\.?\/)*internal\//g, `](${OPENTIDE_BLOB}/internal/`)
    .replace(/\]\(\.agents\//g, '](https://github.com/OpenTideHQ/opentide/blob/development/.agents/')
    .replace(/\]\(\.github\//g, '](https://github.com/OpenTideHQ/specifications/blob/main/.github/');
}

/** Brand is lowercase. Keep the GitHub org suffix HQ and the Python registry identifier. */
export function rewriteBrandName(content) {
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

export function toDocsUrl(withoutExt, hash) {
  const slug = withoutExt.replace(/\/index$/i, '').replace(/^\/+/, '');
  const path = `/docs/${slug}/`.replace(/\/{2,}/g, '/');
  return hash ? `${path}${hash}` : path;
}

export function rewriteHref(href, fromDir) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('/') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return href;
  }
  const hashIndex = trimmed.indexOf('#');
  const pathPart = hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : trimmed.slice(hashIndex);
  const resolved = posix.normalize(posix.join(fromDir || '.', pathPart)).replace(/\\/g, '/');
  if (resolved.startsWith('..')) return href;
  const unpublished = unpublishedSpecsUrl(resolved, hash);
  if (unpublished) return unpublished;
  if (!/\.mdx?$/i.test(pathPart)) return href;
  const withoutExt = resolved.replace(/\.mdx?$/i, '');
  return toDocsUrl(withoutExt, hash);
}

export function rewriteSiteLinks(content, publishedRelPath) {
  const fromDir = posix.dirname(publishedRelPath.replace(/\\/g, '/'));
  return content
    .replace(/\]\(([^)\s]+)\)/g, (full, href) => `](${rewriteHref(href, fromDir)})`)
    .replace(/\bhref=(["'])([^"']+)\1/g, (full, quote, href) => `href=${quote}${rewriteHref(href, fromDir)}${quote}`);
}

export function postProcessMarkdown(content, publishedRelPath = '') {
  const stripped = stripRedundantSummary(stripLeadingH1(content));
  const linked = rewritePublishedLinks(stripped);
  const withSiteLinks = publishedRelPath ? rewriteSiteLinks(linked, publishedRelPath) : linked;
  return rewriteBrandName(withSiteLinks);
}

export function h1InBody(body) {
  return /^#\s+/m.test(body);
}

export function transformSpecFrontmatter(content, publishedRelPath = '') {
  const hasFrontmatter = content.startsWith('---\n');
  let frontmatter = '';
  let body = content;

  if (hasFrontmatter) {
    const end = content.indexOf('\n---\n', 4);
    if (end === -1) return postProcessMarkdown(content, publishedRelPath);
    frontmatter = content.slice(4, end);
    body = content.slice(end + 5);
  }

  if (/^title:\s/m.test(frontmatter)) {
    return postProcessMarkdown(content, publishedRelPath);
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

  return postProcessMarkdown(`---\n${fumadocsLines.join('\n')}\n---\n${body}`, publishedRelPath);
}

export function listFiles(dir, predicate) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(p, predicate));
    else if (predicate(p, entry.name)) files.push(p);
  }
  return files;
}

export function countFiles(dir, predicate) {
  return listFiles(dir, predicate).length;
}

export function copyPublishedTree(src, dest, { exclude = [] } = {}) {
  if (!existsSync(src) || isSymlink(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name) || entry.isSymbolicLink()) continue;
    const from = join(src, entry.name);
    const to = join(dest, publishedDestName(entry.name));
    if (entry.isDirectory()) {
      copyPublishedTree(from, to, { exclude });
      continue;
    }
    if (isMarkdownSource(entry.name) && existsSync(to)) {
      throw new Error(`Refusing to overwrite ${to} while copying ${from}`);
    }
    if (isMarkdownSource(entry.name)) {
      writeFileSync(to, readFileSync(from));
    } else {
      cpSync(from, to);
    }
  }
}

export function syncMarkdownTree(srcDir, destDir, { exclude = [], outRoot = OUT } = {}) {
  if (!existsSync(srcDir) || isSymlink(srcDir)) return;
  mkdirSync(destDir, { recursive: true });

  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    if (exclude.includes(entry.name) || entry.isSymbolicLink()) continue;
    const from = join(srcDir, entry.name);
    const to = join(destDir, publishedDestName(entry.name));

    if (entry.isDirectory()) {
      syncMarkdownTree(from, to, { exclude, outRoot });
      continue;
    }

    if (!isMarkdownSource(entry.name)) {
      cpSync(from, to);
      continue;
    }

    const publishedRel = relative(outRoot, to);
    const raw = readFileSync(from, 'utf8');
    writeFileSync(to, transformSpecFrontmatter(raw, publishedRel));
  }
}

export function postProcessPublishedTree(dir, outRoot = OUT) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      postProcessPublishedTree(p, outRoot);
      continue;
    }
    if (entry.name === STAMP_NAME) continue;
    if (isPublishedPage(entry.name)) {
      writeFileSync(p, postProcessMarkdown(readFileSync(p, 'utf8'), relative(outRoot, p)));
    } else if (entry.name.endsWith('.json')) {
      writeFileSync(p, rewriteBrandName(readFileSync(p, 'utf8')));
    }
  }
}

export function assertNoMarkdownPages(outDir = OUT) {
  const leftover = listFiles(outDir, (p, name) => isMarkdownSource(name));
  if (leftover.length) {
    const preview = leftover.slice(0, 8).map((p) => relative(outDir, p)).join(', ');
    throw new Error(
      `Synced docs still include .md pages (Fumadocs will not run JSX): ${preview}`,
    );
  }
}

export function buildSpecificationsMeta() {
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

export function buildSpecificationsIndex() {
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

export function collectGitlinks(root) {
  return {
    opentide: gitLinkSha(root, 'vendor/opentide'),
    specifications: gitLinkSha(root, 'vendor/specifications'),
  };
}

export function checkPublishedDocsFreshness({
  root = ROOT,
  outDir = join(root, 'content', 'docs'),
  source = 'head',
} = {}) {
  const stamp = readSyncStamp(outDir);
  if (!stamp) {
    throw new Error(
      'content/docs/.sync-stamp.json is missing. Run `pnpm sync:content` and commit vendor gitlinks together with content/docs.',
    );
  }

  const expected =
    source === 'worktree'
      ? {
          opentide: gitRevParse(join(root, 'vendor', 'opentide')),
          specifications: gitRevParse(join(root, 'vendor', 'specifications')),
        }
      : collectGitlinks(root);

  const problems = [];
  if (!stamp.opentide || !stamp.specifications) {
    problems.push('content/docs/.sync-stamp.json is missing opentide or specifications SHAs');
  }
  if (expected.opentide && stamp.opentide !== expected.opentide) {
    problems.push(
      `vendor/opentide is ${expected.opentide} but content/docs was synced from ${stamp.opentide}. Run \`pnpm sync:content\` and commit content/docs.`,
    );
  }
  if (expected.specifications && stamp.specifications !== expected.specifications) {
    problems.push(
      `vendor/specifications is ${expected.specifications} but content/docs was synced from ${stamp.specifications}. Run \`pnpm sync:content\` and commit content/docs.`,
    );
  }
  if (source === 'head' && (!expected.opentide || !expected.specifications)) {
    problems.push('Could not read vendor gitlinks from HEAD. Submodules vendor/opentide and vendor/specifications are required.');
  }

  try {
    assertNoMarkdownPages(outDir);
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }

  if (problems.length) {
    throw new Error(problems.join('\n'));
  }

  return { stamp, expected };
}

export function promoteCommittedMarkdownToMdx({
  outDir = OUT,
  root = ROOT,
} = {}) {
  const pages = listFiles(outDir, (p, name) => isMarkdownSource(name));
  for (const from of pages) {
    const to = `${from.slice(0, -3)}.mdx`;
    const publishedRel = relative(outDir, to);
    writeFileSync(to, postProcessMarkdown(readFileSync(from, 'utf8'), publishedRel));
    unlinkSync(from);
  }
  const links = collectGitlinks(root);
  writeSyncStamp(outDir, {
    format: 'mdx',
    opentide: links.opentide,
    specifications: links.specifications,
  });
  assertNoMarkdownPages(outDir);
  return { converted: pages.length, stamp: readSyncStamp(outDir) };
}

export function syncContent({
  root = ROOT,
  outDir = join(root, 'content', 'docs'),
  env = process.env,
} = {}) {
  if (env.SKIP_SYNC === '1') {
    console.log('sync-content: skipped (SKIP_SYNC=1)');
    return { skipped: true };
  }

  const opentideDocs = resolvePath(
    'OPENTIDE_DOCS_PATH',
    ['vendor/opentide/docs', '../opentide/docs'],
    isOpentideDocsPath,
    { root, env },
  );
  const specificationsRoot = resolvePath(
    'SPECIFICATIONS_PATH',
    ['vendor/specifications', '../specifications'],
    isSpecificationsPath,
    { root, env },
  );

  console.log(`sync-content: opentide docs ← ${opentideDocs}`);
  console.log(`sync-content: specifications ← ${specificationsRoot}`);

  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true });
  }
  mkdirSync(outDir, { recursive: true });

  for (const section of OPENTIDE_SECTIONS) {
    copyPublishedTree(join(opentideDocs, section), join(outDir, section));
  }

  const specOut = join(outDir, 'specifications');
  mkdirSync(specOut, { recursive: true });

  const authoredIndex = join(specificationsRoot, 'site', 'index.md');
  if (isRegularFile(authoredIndex)) {
    writeFileSync(
      join(specOut, 'index.mdx'),
      transformSpecFrontmatter(readFileSync(authoredIndex, 'utf8'), 'specifications/index.mdx'),
    );
  } else {
    writeFileSync(
      join(specOut, 'index.mdx'),
      postProcessMarkdown(buildSpecificationsIndex(), 'specifications/index.mdx'),
    );
  }
  syncMarkdownTree(join(specificationsRoot, 'specs'), join(specOut, 'specs'), { outRoot: outDir });

  for (const file of ['SPECS.md', 'GOVERNANCE.md', 'conformance.md']) {
    const src = join(specificationsRoot, file);
    if (!isRegularFile(src)) continue;
    const dest = join(specOut, publishedDestName(file));
    const raw = readFileSync(src, 'utf8');
    writeFileSync(dest, transformSpecFrontmatter(raw, relative(outDir, dest)));
  }

  const siteMeta = join(specificationsRoot, 'site', 'meta.json');
  if (isRegularFile(siteMeta)) {
    cpSync(siteMeta, join(specOut, 'meta.json'));
  } else {
    writeFileSync(join(specOut, 'meta.json'), `${JSON.stringify(buildSpecificationsMeta(), null, 2)}\n`);
  }

  writeFileSync(
    join(outDir, 'meta.json'),
    `${JSON.stringify(
      {
        pages: ['usage', 'specifications', 'cli', 'mcp', 'sdk'],
      },
      null,
      2,
    )}\n`,
  );

  const pageCount = countFiles(outDir, (p, name) => name.endsWith('.mdx'));
  postProcessPublishedTree(outDir, outDir);
  assertNoMarkdownPages(outDir);

  const opentideSha = gitHeadForPath(opentideDocs).sha;
  const specificationsSha = gitHeadForPath(specificationsRoot).sha;
  writeSyncStamp(outDir, {
    format: 'mdx',
    opentide: opentideSha,
    specifications: specificationsSha,
  });

  console.log(`sync-content: wrote ${pageCount} mdx pages to content/docs/`);
  return {
    skipped: false,
    pageCount,
    opentideDocs,
    specificationsRoot,
    stamp: readSyncStamp(outDir),
  };
}

export function main(options) {
  return syncContent(options);
}
