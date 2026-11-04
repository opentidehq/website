/**
 * Colour the opentide CLI output samples in the docs as the terminal shows them.
 *
 * The docs carry CLI output in `text` fences, as plain text, so that they read on
 * GitHub and the opentide golden test can match them against the CLI. On the site
 * those fences become Shiki `ansi` fences: `colorizeCliOutput` adds the SGR codes
 * the CLI's Rich styles print (`src/opentide/cli/ui/` in opentidehq/opentide),
 * and Shiki maps them onto the theme's terminal palette, in light and dark.
 *
 * Runs on the hast, before rehype-code, so the processed markdown (`llms.txt`,
 * search) and the copy button keep the plain text.
 */

const SGR = {
  bold: '1',
  dim: '2',
  red: '31',
  green: '32',
  yellow: '33',
  blue: '34',
  magenta: '35',
  cyan: '36',
};

/** Wrap `text` in the SGR codes of a Rich style such as `bold red`. */
export function paint(text, style) {
  if (!text || !style) return text;
  const codes = style
    .split(' ')
    .map((word) => SGR[word])
    .filter(Boolean)
    .join(';');
  return codes ? `\u001b[${codes}m${text}\u001b[0m` : text;
}

// The styles below mirror opentide's CLI; each names the module it follows.

// cli/ui/codeframe.py `_SEVERITY_STYLE`, plus `info` as the log renderer colours it.
const SEVERITY = { error: 'bold red', warning: 'bold yellow', note: 'bold blue', info: 'bold blue' };
// cli/ui/codeframe.py `_NOTE_STYLE`, for the notes under a code frame.
const FRAME_NOTE = { help: 'bold cyan', note: 'bold blue', expected: 'bold', fix: 'bold cyan' };
// cli/ui/render.py `_LABEL_STYLE`, core/logging/render.py `LEVEL_STYLE`, codeframe `fixed:`.
const LABEL = {
  error: 'bold red',
  warning: 'bold yellow',
  note: 'bold blue',
  help: 'bold cyan',
  tip: 'bold cyan',
  info: 'blue',
  debug: 'dim magenta',
  fixed: 'bold green',
  usage: 'bold',
  FATAL: 'bold red',
};
// cli/ui/render.py `_OUTCOME_STYLE` and services/doctor.py `_GLYPHS`.
const OUTCOME = { '✓': 'bold green', '✗': 'bold red', '!': 'bold yellow', '○': 'bold dim' };
// cli/ui/plan.py `_ROWS`.
const PLAN_ROW = {
  create: 'bold green',
  'create or update': 'bold green',
  'would fail': 'bold red',
  update: 'bold yellow',
  disable: 'bold magenta',
  delete: 'bold red',
};
const GUTTER = 'blue';
const SEPARATOR = ' · ';

const RE_HEADER = /^(\s*)(error|warning|note|info)\[([^\]\s]+)\](:)(.*)$/;
const RE_LABEL = /^(\s*)(error|warning|note|help|tip|info|debug|fixed|usage|FATAL):(?=\s|$)(.*)$/;
const RE_OUTCOME = /^(\s*)([✓✗!○])( .*)$/;
const RE_NEXT = /^(\s*)(→)( )(.*)$/;
const RE_TIME = /^(\d\d:\d\d:\d\d)( )(.*)$/;
const RE_PLAN_ROW = /^(\s+)([+~\-×✗])( )(create or update|create|update|disable|delete|would fail)(\s.*)?$/;
const RE_PHASE_ROW = /^(\s+)([✓✗!])(  )(\S+)(\s.*)?$/;
const RE_PLAN_PLATFORM = /^(\S+)( · \d+ tenants?)$/;
const RE_DEPLOY_ROW = /^(\s*)(\[\s*\d+\/\d+\])( )([✓✗·])( \S+)(.*)$/;
const RE_STEP = /^(\s+)(\d+)(  )(.*)$/;
// A code frame: an opener, or a gutter (optional line number, then a bar or a note).
const RE_FRAME_OPEN = /^(\s*)(╭─▶|╰─▶)(.*)$/;
const RE_FRAME_LINE = /^(\s*)(\d+ )?(\s*)(│|├─|╰─)(.*)$/;
const RE_UNDERLINE = /^(\s*)([━^]+)(.*)$/;
const RE_DOCTOR_CODE = / · ([a-z][a-z0-9_]*)$/;
const RE_DIFF_START = /^(--- |diff --git )/;

/** An outcome line's message is plain; a doctor line's trailing ` · check_code` is dim. */
function message(text) {
  const code = text.match(RE_DOCTOR_CODE);
  // `✓ Generated 7 files in 1.2s · docs` names a phase, after a duration: not a check.
  if (code && code.index !== undefined && !/\d(?:\.\d+)?m?s$/.test(text.slice(0, code.index))) {
    return text.slice(0, code.index) + paint(code[0], 'dim');
  }
  return text;
}

/** Columns two or more spaces apart: the first in `first`, the others in `rest`. */
function columns(text, first, rest) {
  const parts = text.split(/(\s{2,})/);
  return parts
    .map((part, index) => (index % 2 === 1 || part === '' ? part : paint(part, index === 0 ? first : rest)))
    .join('');
}

function frameRest(rest, severityStyle) {
  // After the bar: a note (`help: …`), an underline with its label, or source.
  const note = rest.match(/^(\s*)(help|note|expected|fix):(.*)$/);
  if (note) return note[1] + paint(`${note[2]}:`, FRAME_NOTE[note[2]] ?? 'bold') + note[3];
  const underline = rest.match(RE_UNDERLINE);
  if (underline) return underline[1] + paint(underline[2] + underline[3], severityStyle);
  return rest;
}

function diffLine(line) {
  if (line.startsWith('+++') || line.startsWith('---')) return paint(line, 'bold');
  if (line.startsWith('@@')) return paint(line, 'cyan');
  if (line.startsWith('+')) return paint(line, 'green');
  if (line.startsWith('-')) return paint(line, 'red');
  return line;
}

/**
 * The fence's text with the CLI's colours, or `null` when no line of it reads
 * like opentide output (a file tree, a query, a command), which stays plain.
 */
export function colorizeCliOutput(text) {
  const lines = text.split('\n');
  const firstLine = lines.find((line) => line.trim() !== '') ?? '';
  const diff = RE_DIFF_START.test(firstLine);
  let changed = false;
  let frame = null; // the severity style of the code frame being printed
  let plan = false; // inside a deploy plan (plan.py), whose platform and tenant lines are bold
  let skipped = false; // the line above is a skipped doctor check, whose fix is dim

  const out = lines.map((raw) => {
    if (raw.trim() === '') {
      frame = null;
      return raw;
    }
    let prefix = '';
    let line = raw;
    const time = line.match(RE_TIME);
    if (time) {
      prefix = paint(time[1], 'dim') + time[2];
      line = time[3];
    }
    const result = colorLine(line);
    skipped = /^○ /.test(line);
    if (result === null) return raw;
    changed = true;
    return prefix + result;
  });
  return changed ? out.join('\n') : null;

  function colorLine(line) {
    if (diff) {
      // A diff (validate --fix --dry-run) ends where the findings start.
      if (!RE_HEADER.test(line) && !RE_LABEL.test(line)) return diffLine(line);
    }
    let m = line.match(RE_HEADER);
    if (m) {
      frame = SEVERITY[m[2]];
      return m[1] + paint(`${m[2]}[${m[3]}]`, frame) + paint(m[4] + m[5], 'bold');
    }
    m = line.match(RE_FRAME_OPEN);
    if (m) {
      frame ??= 'bold';
      return m[1] + paint(m[2], GUTTER) + m[3];
    }
    if (frame) {
      m = line.match(RE_FRAME_LINE);
      if (m) {
        const gutter = paint(`${m[2] ?? ''}${m[3]}${m[4]}`, GUTTER);
        return m[1] + gutter + frameRest(m[5], frame);
      }
      m = line.match(RE_UNDERLINE);
      if (m) return m[1] + paint(m[2] + m[3], frame);
    }
    m = line.match(RE_LABEL);
    if (m) return m[1] + paint(`${m[2]}:`, LABEL[m[2]]) + m[3];
    m = line.match(RE_PHASE_ROW);
    if (m) {
      // generate's phase table: the phase bold, its counts, time and folder dim.
      return m[1] + paint(m[2], OUTCOME[m[2]]) + m[3] + paint(m[4], 'bold') + columns(m[5] ?? '', 'dim', 'dim');
    }
    m = line.match(RE_OUTCOME);
    if (m) return m[1] + paint(m[2], OUTCOME[m[2]]) + message(m[3]);
    m = line.match(RE_NEXT);
    if (m) {
      const glyph = m[1] + paint(m[2], 'bold cyan') + m[3];
      const at = m[4].indexOf(SEPARATOR);
      // render.py next_action_text: the command bold, its reason dim.
      if (m[1] === '' && at > 0) {
        return glyph + paint(m[4].slice(0, at), 'bold') + paint(m[4].slice(at), 'dim');
      }
      // doctor.py: a skipped check's fix is dim.
      return glyph + (skipped ? paint(m[4], 'dim') : m[4]);
    }
    m = line.match(RE_DEPLOY_ROW);
    if (m) {
      const style = m[4] === '✗' ? 'bold red' : m[4] === '·' ? 'dim' : 'green';
      const rest = m[6].replace(/(\s)(\d+(?:\.\d+)?s|\d+m\d+s?)$/, (_, space, seconds) => space + paint(seconds, 'dim'));
      return m[1] + paint(m[2], 'dim') + m[3] + paint(m[4] + m[5], style) + rest;
    }
    m = line.match(RE_PLAN_ROW);
    if (m) {
      // plan.py: the action, then the rule's name bold, its UUID and status dim.
      const rest = (m[5] ?? '').replace(/^(\s*)(.*)$/, (_, space, cells) => space + columns(cells, 'bold', 'dim'));
      return m[1] + paint(`${m[2]}${m[3]}${m[4]}`, PLAN_ROW[m[4]]) + rest;
    }
    if (plan) {
      m = line.match(RE_PLAN_PLATFORM);
      if (m) return paint(m[1], 'bold') + paint(m[2], 'dim');
      m = line.match(/^(\s{2})(\S+)$/);
      if (m) return m[1] + paint(m[2], 'bold');
    }
    if (/^(Skipped|Plan):/.test(line)) {
      const at = line.indexOf(':') + 1;
      return paint(line.slice(0, at), 'bold') + line.slice(at);
    }
    m = line.match(/^(Deploy plan)( · strategy )(\S+)(.*)$/);
    if (m) {
      plan = true;
      // The header is bold, so its dim parts are `bold dim`.
      return paint(m[1], 'bold') + paint(m[2], 'bold dim') + paint(m[3], 'bold') + paint(m[4], 'bold dim');
    }
    if (/^(Deploy plan|Deploying to) /.test(line)) {
      plan = line.startsWith('Deploy plan');
      const at = line.indexOf(SEPARATOR);
      return at < 0 ? paint(line, 'bold') : paint(line.slice(0, at), 'bold') + paint(line.slice(at), 'dim');
    }
    if (/^dry run, nothing (is )?sent/.test(line)) return paint(line, 'dim');
    if (line === 'Next steps') return paint(line, 'bold');
    m = line.match(RE_STEP);
    if (m && m[4].includes(SEPARATOR) && m[4].startsWith('opentide ')) {
      const at = m[4].indexOf(SEPARATOR);
      return m[1] + paint(m[2], 'dim') + m[3] + paint(m[4].slice(0, at), 'bold') + paint(m[4].slice(at), 'dim');
    }
    return null;
  }
}

const COLOURED_LANGUAGES = new Set(['text', 'console']);

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

function visit(node, fn) {
  fn(node);
  for (const child of node.children ?? []) visit(child, fn);
}

/** Rehype plugin: `text` and `console` fences of CLI output become coloured `ansi` fences. */
export function rehypeCliOutput() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'pre') return;
      const code = node.children?.[0];
      if (!code || code.type !== 'element' || code.tagName !== 'code') return;
      const classes = Array.isArray(code.properties?.className) ? code.properties.className : [];
      const index = classes.findIndex((name) => typeof name === 'string' && name.startsWith('language-'));
      if (index < 0 || !COLOURED_LANGUAGES.has(classes[index].slice('language-'.length))) return;
      const coloured = colorizeCliOutput(textOf(code));
      if (coloured === null) return;
      const className = [...classes];
      className[index] = 'language-ansi';
      code.properties = { ...code.properties, className };
      code.children = [{ type: 'text', value: coloured }];
    });
  };
}
