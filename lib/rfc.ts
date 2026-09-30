export const RFC_STATUS_ORDER = [
  'proposed',
  'draft',
  'accepted',
  'reserved',
  'rejected',
  'superseded',
  'template',
] as const;

export type RfcStatus = (typeof RFC_STATUS_ORDER)[number];

export type RfcSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href: string };

export type RfcField = {
  label: string;
  parts: RfcSegment[];
};

export type RfcBannerData = {
  number: string;
  status: string;
  note?: string | null;
  fields: RfcField[];
};

export type RfcIndexEntry = {
  number: string;
  title: string;
  status: string;
  summary: string;
  href: string;
  external: boolean;
};

const WIDE_LABELS = new Set(['Revised', 'Accepted', 'Supersedes']);

export function isRfcStatus(value: string): value is RfcStatus {
  return (RFC_STATUS_ORDER as readonly string[]).includes(value);
}

export function rfcStatusLabel(status: string): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function rfcStatusClass(status: string): string {
  switch (status) {
    case 'accepted':
      return 'bg-[#e5f6ec] text-[#085c38] dark:bg-[#06281a] dark:text-[#b6f3d3]';
    case 'proposed':
      return 'bg-[#e7ecfb] text-[#001489] dark:bg-[#2a2200] dark:text-[#ffcc00]';
    case 'rejected':
      return 'bg-[#fde8e8] text-[#9f1239] dark:bg-[#3f1018] dark:text-[#fecdd3]';
    case 'reserved':
      return 'bg-transparent text-[#3f3f46] ring-1 ring-inset ring-[#d4d4d8] dark:text-[#e4e4e7] dark:ring-[#52525b]';
    case 'draft':
    case 'superseded':
    case 'template':
      return 'bg-[#f4f4f5] text-[#3f3f46] dark:bg-[#27272a] dark:text-[#e4e4e7]';
    default:
      return 'bg-[#f4f4f5] text-[#3f3f46] dark:bg-[#27272a] dark:text-[#e4e4e7]';
  }
}

export function sidebarLabel(title: string, rfc: string | undefined): string {
  const stripped = title.replace(/^RFC\s+\d{4}:\s*/i, '').trim();
  if (rfc && rfc !== '0000') return `${rfc} ${stripped || title}`;
  return stripped || title;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatRfcDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function displayFieldParts(label: string, parts: RfcSegment[]): RfcSegment[] {
  if (label !== 'Created' && label !== 'Accepted' && label !== 'Revised') return parts;
  return parts.map((part, index) => {
    if (index !== 0 || part.kind !== 'text') return part;
    return {
      ...part,
      text: part.text.replace(/^(\d{4}-\d{2}-\d{2})/, (iso) => formatRfcDate(iso)),
    };
  });
}

export function fieldIsWide(label: string, parts: RfcSegment[]): boolean {
  if (WIDE_LABELS.has(label)) return true;
  const text = parts.map((part) => part.text).join('');
  return text.length > 80;
}

export function safeHref(href: string): string | null {
  if (href.startsWith('/') || href.startsWith('#')) return href;
  try {
    const url = new URL(href);
    if (url.protocol === 'https:' || url.protocol === 'http:') return href;
  } catch {
    return null;
  }
  return null;
}

function isSegment(value: unknown): value is RfcSegment {
  if (typeof value !== 'object' || value === null) return false;
  if (!('kind' in value) || !('text' in value) || typeof value.text !== 'string') return false;
  if (value.kind === 'text') return true;
  return value.kind === 'link' && 'href' in value && typeof value.href === 'string';
}

function isField(value: unknown): value is RfcField {
  if (typeof value !== 'object' || value === null) return false;
  if (!('label' in value) || typeof value.label !== 'string') return false;
  if (!('parts' in value) || !Array.isArray(value.parts)) return false;
  return value.parts.every(isSegment);
}

export function parseBannerData(raw: string): RfcBannerData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  if (!('number' in parsed) || typeof parsed.number !== 'string') return null;
  if (!('status' in parsed) || typeof parsed.status !== 'string') return null;
  if (!('fields' in parsed) || !Array.isArray(parsed.fields) || !parsed.fields.every(isField)) return null;
  const note = 'note' in parsed && typeof parsed.note === 'string' ? parsed.note : null;
  return { number: parsed.number, status: parsed.status, note, fields: parsed.fields };
}

export function parseIndexEntries(raw: string): RfcIndexEntry[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const entries: RfcIndexEntry[] = [];
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) return null;
    if (!('number' in item) || typeof item.number !== 'string') return null;
    if (!('title' in item) || typeof item.title !== 'string') return null;
    if (!('status' in item) || typeof item.status !== 'string') return null;
    if (!('summary' in item) || typeof item.summary !== 'string') return null;
    if (!('href' in item) || typeof item.href !== 'string') return null;
    if (!('external' in item) || typeof item.external !== 'boolean') return null;
    entries.push({
      number: item.number,
      title: item.title,
      status: item.status,
      summary: item.summary,
      href: item.href,
      external: item.external,
    });
  }
  return entries;
}
