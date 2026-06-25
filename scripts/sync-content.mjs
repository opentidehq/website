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
      ?.slice(0, 200) ??
    firstPara?.slice(0, 200) ??
    `OpenTide normative specification — ${title}`;

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
    return content;
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

  return `---\n${fumadocsLines.join('\n')}\n---\n${body}`;
}

function h1InBody(body) {
  return /^#\s+/m.test(body);
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
    description: 'Normative OpenTide specifications for authors, maintainers, and agents',
    icon: 'FileText',
    pages: [
      'index',
      'SPECS',
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
      'AGENTS',
      '---RFCs---',
      'rfcs/0001-authority-model',
    ],
  };
}

function buildSpecificationsIndex() {
  return `---
title: Specifications
description: Normative OpenTide specifications — versioning, objects, vocabularies, and governance.
---

# OpenTide Specifications

Normative specifications define the contract between OpenTide implementations, detection repositories, and agent tooling. Each spec is independently versioned.

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

  // Docs home
  cpSync(join(opentideDocs, 'index.md'), join(OUT, 'index.md'));

  // Four opentide sections
  for (const section of OPENTIDE_SECTIONS) {
    copyDir(join(opentideDocs, section), join(OUT, section));
  }

  // Specifications section
  const specOut = join(OUT, 'specifications');
  mkdirSync(specOut, { recursive: true });

  writeFileSync(join(specOut, 'index.md'), buildSpecificationsIndex());
  syncMarkdownTree(join(specificationsRoot, 'specs'), join(specOut, 'specs'));
  syncMarkdownTree(join(specificationsRoot, 'rfcs'), join(specOut, 'rfcs'), {
    exclude: ['0000-template.md', 'README.md'],
  });

  for (const file of ['SPECS.md', 'GOVERNANCE.md', 'AGENTS.md']) {
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

  // Root navigation — five dropdown sections
  writeFileSync(
    join(OUT, 'meta.json'),
    `${JSON.stringify(
      {
        title: 'OpenTide',
        description: 'DetectionOps engine documentation',
        pages: ['index', 'specifications', ...OPENTIDE_SECTIONS],
      },
      null,
      2,
    )}\n`,
  );

  const pageCount = countFiles(OUT, (f) => f.endsWith('.md'));
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
