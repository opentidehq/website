import assert from 'node:assert/strict';
import { test } from 'node:test';
import { colorizeCliOutput, paint, rehypeCliOutput } from './cli-output.mjs';

const ESC = '\u001b';
/** `⟦bold red:text⟧` for each painted run, so expectations read like the CLI's styles. */
function styles(text) {
  const names = { 1: 'bold', 2: 'dim', 31: 'red', 32: 'green', 33: 'yellow', 34: 'blue', 35: 'magenta', 36: 'cyan' };
  return text.replace(/\u001b\[([0-9;]+)m([^\u001b]*)\u001b\[0m/g, (_, codes, inner) => {
    const style = codes.split(';').map((code) => names[code]).join(' ');
    return `⟦${style}:${inner}⟧`;
  });
}

test('paint wraps text in the SGR codes of a Rich style', () => {
  assert.equal(paint('error:', 'bold red'), `${ESC}[1;31merror:${ESC}[0m`);
  assert.equal(paint('', 'bold'), '');
  assert.equal(paint('x', ''), 'x');
});

test('a code frame is coloured as codeframe.py prints it', () => {
  const frame = [
    "warning[placeholder]: type holds a placeholder value written by opentide new",
    '   ╭─▶ objects/objectives/lsass-obj.yaml:18:9',
    '   │',
    '18 │   type: Threat  # opentide:placeholder',
    '   │         ━━━━━━',
    '   │',
    "   ╰─ help: replace the value, then delete the '# opentide:placeholder' comment",
  ].join('\n');
  assert.deepEqual(styles(colorizeCliOutput(frame)).split('\n'), [
    '⟦bold yellow:warning[placeholder]⟧⟦bold:: type holds a placeholder value written by opentide new⟧',
    '   ⟦blue:╭─▶⟧ objects/objectives/lsass-obj.yaml:18:9',
    '   ⟦blue:│⟧',
    '⟦blue:18 │⟧   type: Threat  # opentide:placeholder',
    '   ⟦blue:│⟧         ⟦bold yellow:━━━━━━⟧',
    '   ⟦blue:│⟧',
    "   ⟦blue:╰─⟧ ⟦bold cyan:help:⟧ replace the value, then delete the '# opentide:placeholder' comment",
  ]);
});

test('labels, outcome lines and next steps take render.py styles', () => {
  const out = [
    "error: No such option: --strictt",
    "  help: did you mean '--strict'?",
    '  usage: opentide validate [OPTIONS] COMMAND [ARGS]...',
    '✓ 3 objects valid · 0 queries · 1.3s',
    '! 28 findings in 3 files · 25 warnings, 3 notes',
    '✗ sentinel · 2 deployed, 1 failed, 11 not attempted · 1.2s',
    '→ opentide lint --fix · rename 1 file to match their names',
  ].join('\n');
  assert.deepEqual(styles(colorizeCliOutput(out)).split('\n'), [
    '⟦bold red:error:⟧ No such option: --strictt',
    "  ⟦bold cyan:help:⟧ did you mean '--strict'?",
    '  ⟦bold:usage:⟧ opentide validate [OPTIONS] COMMAND [ARGS]...',
    '⟦bold green:✓⟧ 3 objects valid · 0 queries · 1.3s',
    '⟦bold yellow:!⟧ 28 findings in 3 files · 25 warnings, 3 notes',
    '⟦bold red:✗⟧ sentinel · 2 deployed, 1 failed, 11 not attempted · 1.2s',
    '⟦bold cyan:→⟧ ⟦bold:opentide lint --fix⟧⟦dim: · rename 1 file to match their names⟧',
  ]);
});

test("doctor's check code is dim, and a skipped check's fix", () => {
  const out = [
    '✓ opentide 0.18.0 · opentide_version',
    '○ No MCP configuration: agents in editors cannot call opentide tools · mcp_config',
    '  → opentide setup mcp --vscode',
    '! 1 of 2 variables unset · credentials',
    '  → set AZURE_CLIENT_SECRET',
    '✓ Generated 7 files in 1.2s · docs',
  ].join('\n');
  assert.deepEqual(styles(colorizeCliOutput(out)).split('\n'), [
    '⟦bold green:✓⟧ opentide 0.18.0⟦dim: · opentide_version⟧',
    '⟦bold dim:○⟧ No MCP configuration: agents in editors cannot call opentide tools⟦dim: · mcp_config⟧',
    '  ⟦bold cyan:→⟧ ⟦dim:opentide setup mcp --vscode⟧',
    '⟦bold yellow:!⟧ 1 of 2 variables unset⟦dim: · credentials⟧',
    '  ⟦bold cyan:→⟧ set AZURE_CLIENT_SECRET',
    '⟦bold green:✓⟧ Generated 7 files in 1.2s · docs',
  ]);
});

test('a deploy plan is coloured as plan.py prints it', () => {
  const out = [
    'Deploy plan · strategy PREVIEW · 1 platform, 0 tenants · dry run, nothing is sent',
    '',
    'sentinel · 0 tenants',
    '  + create or update  LSASS Rule  …1dce677221d4  status STAGING',
    '',
    'Plan: 0 to create, 0 to update, 1 to create or update, 0 to disable, 0 to delete',
    'dry run, nothing sent',
  ].join('\n');
  assert.deepEqual(styles(colorizeCliOutput(out)).split('\n'), [
    '⟦bold:Deploy plan⟧⟦bold dim: · strategy ⟧⟦bold:PREVIEW⟧⟦bold dim: · 1 platform, 0 tenants · dry run, nothing is sent⟧',
    '',
    '⟦bold:sentinel⟧⟦dim: · 0 tenants⟧',
    '  ⟦bold green:+ create or update⟧  ⟦bold:LSASS Rule⟧  ⟦dim:…1dce677221d4⟧  ⟦dim:status STAGING⟧',
    '',
    '⟦bold:Plan:⟧ 0 to create, 0 to update, 1 to create or update, 0 to disable, 0 to delete',
    '⟦dim:dry run, nothing sent⟧',
  ]);
});

test("generate's phase table: the phase bold, its columns dim", () => {
  assert.equal(
    styles(colorizeCliOutput('  ✓  schemas       8 files  3.2s  .opentide/')),
    '  ⟦bold green:✓⟧  ⟦bold:schemas⟧       ⟦dim:8 files⟧  ⟦dim:3.2s⟧  ⟦dim:.opentide/⟧',
  );
});

test('a fix diff is coloured, and the findings after it', () => {
  const out = ['--- a/objects/rules/x.yaml', '+++ b/objects/rules/x.yaml', '@@ -5,7 +5,7 @@', '-  tlp: Clear', '+  tlp: clear', '   name: x'].join('\n');
  assert.deepEqual(styles(colorizeCliOutput(out)).split('\n'), [
    '⟦bold:--- a/objects/rules/x.yaml⟧',
    '⟦bold:+++ b/objects/rules/x.yaml⟧',
    '⟦cyan:@@ -5,7 +5,7 @@⟧',
    '⟦red:-  tlp: Clear⟧',
    '⟦green:+  tlp: clear⟧',
    '   name: x',
  ]);
});

test('text that is not CLI output stays plain', () => {
  assert.equal(colorizeCliOutput('opentide validate'), null);
  assert.equal(colorizeCliOutput('.opentide/configurations/\n├── global.toml\n│   └── x\n└── systems/'), null);
  assert.equal(colorizeCliOutput('index=main sourcetype=misp | table value'), null);
});

function fence(lang, value, meta) {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className: [`language-${lang}`] },
            data: meta ? { meta } : undefined,
            children: [{ type: 'text', value }],
          },
        ],
      },
    ],
  };
}

test('the rehype plugin turns a text fence of CLI output into an ansi fence', () => {
  const tree = fence('text', '✓ 3 objects valid', 'output-of="opentide validate"');
  rehypeCliOutput()(tree);
  const code = tree.children[0].children[0];
  assert.deepEqual(code.properties.className, ['language-ansi']);
  assert.deepEqual(code.data, { meta: 'output-of="opentide validate"' });
  assert.equal(styles(code.children[0].value), '⟦bold green:✓⟧ 3 objects valid');
});

test('the rehype plugin leaves other fences alone', () => {
  for (const [lang, value] of [
    ['json', '{"ok": true}'],
    ['bash', 'opentide validate'],
    ['text', 'objects/rules/a.yaml'],
  ]) {
    const tree = fence(lang, value);
    const before = JSON.stringify(tree);
    rehypeCliOutput()(tree);
    assert.equal(JSON.stringify(tree), before, lang);
  }
});
