/**
 * Simulated results for the playground's deploy preview: the columns come from the query (KQL
 * `project`, SPL `stats … by` and `table`), the values are made up from the column names, and the
 * same rule always gets the same rows. Nothing here ran against data.
 */

export type SimulatedHit = Record<string, string>;

/** The columns a query returns, read from its last `project`, `table` or `stats … by`. */
export function resultColumns(query: string): string[] {
  const lines = query.split('\n').map((l) => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].replace(/^\|\s*/, '');
    let m = /^(?:project|table|fields)\s+(.+)$/i.exec(line);
    if (m) return splitColumns(m[1]);
    m = /^stats\s+(.+?)\s+by\s+(.+)$/i.exec(line);
    if (m) {
      const aggregates = splitColumns(m[1]).map((a) => /\bas\s+(\w+)/i.exec(a)?.[1] ?? a.replace(/\(.*$/, ''));
      return [...splitColumns(m[2]), ...aggregates];
    }
    m = /^summarize\s+(.+?)\s+by\s+(.+)$/i.exec(line);
    if (m) {
      const aggregates = splitColumns(m[1]).map((a) => /^(\w+)\s*=/.exec(a)?.[1] ?? `${a.replace(/\(.*$/, '')}_`);
      return [...splitColumns(m[2]), ...aggregates];
    }
  }
  return ['TimeGenerated', 'Computer', 'Account', 'Detail'];
}

function splitColumns(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const c of text) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
    } else current += c;
  }
  if (current.trim()) out.push(current.trim());
  return out.map((c) => c.replace(/^\w+\s*=\s*/, (m) => m)).slice(0, 7);
}

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const HOSTS = ['WS-FIN-0142', 'WS-ENG-0087', 'WS-HR-0219', 'SRV-JUMP-02', 'WS-OPS-0031'];
const USERS = ['a.moreau@example.eu', 'j.kowalski@example.eu', 'm.rossi@example.eu', 'svc-backup@example.eu', 'l.nagy@example.eu'];
const PROCESSES = ['rundll32.exe', 'procdump64.exe', 'taskmgr.exe', 'werfault.exe', 'powershell.exe', 'mimikatz.exe'];
const ACCESS = ['0x1010', '0x1410', '0x1fffff', '0x143a'];

/** A value for a column, guessed from its name. */
function valueFor(column: string, row: number, random: () => number, now: number): string {
  const c = column.toLowerCase();
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  if (/time|timestamp|_time|firsttime|lasttime/.test(c)) {
    return new Date(now - (row * 11 + Math.floor(random() * 9)) * 60_000).toISOString().replace('T', ' ').slice(0, 19);
  }
  if (/count|total|num|quantity/.test(c)) return String(1 + Math.floor(random() * 6));
  if (/upn|user|account/.test(c)) return pick(USERS);
  if (/device|host|computer|dest|src_host/.test(c)) return pick(HOSTS);
  if (/grantedaccess|access/.test(c)) return pick(ACCESS);
  if (/image|process|filename|file/.test(c)) {
    const p = pick(PROCESSES);
    return /image/.test(c) ? `C:\\Windows\\Temp\\${p}` : p;
  }
  if (/ip|addr/.test(c)) return `10.20.${Math.floor(random() * 40)}.${Math.floor(random() * 250)}`;
  if (/commandline|cmd/.test(c)) return `${pick(PROCESSES)} -ma lsass.exe out.dmp`;
  return pick(['observed', 'matched', 'flagged']);
}

/** Up to `count` hits for a query; the same seed gives the same rows. */
export function simulateHits(query: string, seed: string, count = 3, now = Date.now()): { columns: string[]; rows: SimulatedHit[] } {
  const columns = resultColumns(query);
  const random = rng(seed);
  const rows = Array.from({ length: count }, (_, row) =>
    Object.fromEntries(columns.map((column) => [column, valueFor(column, row, random, now)])),
  );
  return { columns, rows };
}
