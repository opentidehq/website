/**
 * The playground's deploy preview: what `opentide deploy` would create for a rule, compiled in the
 * browser from the rule's YAML and the platform TOML beside it.
 *
 * It follows the platform specs where it matters to a reader — the status picks the strategy and
 * the strategy picks the tenants, modifiers overlay the compiled rule, Sentinel takes ISO 8601
 * durations and Splunk a `savedsearches.conf` stanza — but it is a preview, not opentide: the
 * playground never talks to a platform, and the CLI's own `--dry-run` is the reference.
 */
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';

/** Deployment statuses bundled in `deployment.toml`, with their strategies. */
export const STATUS_STRATEGY: Record<string, Strategy> = {
  DEVELOPMENT: 'PREVIEW',
  IMPROVING: 'PREVIEW',
  STAGING: 'PREVIEW',
  ACCEPTANCE: 'PREVIEW',
  PRODUCTION: 'RELEASE',
  DISABLED: 'DISABLEMENT',
  REMOVED: 'DELETION',
};

export type Strategy = 'PREVIEW' | 'RELEASE' | 'DISABLEMENT' | 'DELETION' | 'UNIVERSAL';

export type Artefact = { label: string; language: 'json' | 'conf'; text: string };

export type Fact = { label: string; value: string };

export type DeployTarget = {
  /** The `configurations` key. */
  key: string;
  status: string;
  strategy: Strategy;
  /** What deploy does there. */
  action: 'create' | 'disable' | 'delete' | 'skip';
  /** Tenants this status reaches, from the platform TOML (or a default one). */
  tenants: string[];
  /** Modifiers whose conditions matched, by name. */
  modifiers: string[];
  /** The query as it is sent. */
  query: string;
  /** The alert or notable title, after modifiers. */
  title: string;
  severity: string;
  /** How often it runs, for the simulated schedule. */
  every: string;
  facts: Fact[];
  artefact: Artefact;
  warnings: string[];
};

export type CompiledRule = {
  name: string;
  uuid: string;
  status: string;
  targets: DeployTarget[];
  /** Why nothing could be compiled: the YAML does not parse, or the object is not a rule. */
  error?: string;
};

type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : fallback;
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** `30m`, `1h10m`, `1d2h`, `2m30s` → ISO 8601; ISO 8601 passes through. */
export function toIsoDuration(value: string): string | null {
  const v = value.trim();
  if (/^P(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/.test(v) && v !== 'P' && v !== 'PT') return v;
  const m = /^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(v);
  if (!m || !v) return null;
  const [, d, h, min, s] = m;
  const time = `${h ? `${h}H` : ''}${min ? `${min}M` : ''}${s ? `${s}S` : ''}`;
  return `P${d ? `${d}D` : ''}${time ? `T${time}` : ''}`;
}

/** A duration in words, for the run schedule: `PT1H` → `1h`, `15m` → `15m`. */
export function shortDuration(value: string): string {
  const iso = toIsoDuration(value);
  if (!iso) return value;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
  if (!m) return value;
  const [, d, h, min, s] = m;
  return [d && `${d}d`, h && `${h}h`, min && `${min}m`, s && `${s}s`].filter(Boolean).join('') || value;
}

/** Strip the common indentation of a block scalar and its trailing newline. */
export function dedent(text: string): string {
  const lines = text.replace(/\s+$/, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)![0].length));
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0)).join('\n');
}

/** Set a dotted path on an object (`alert.severity`), creating the objects on the way. */
function setPath(target: Obj, path: string, value: unknown) {
  const keys = path.split('.');
  let at = target;
  for (const key of keys.slice(0, -1)) {
    if (!isObj(at[key])) at[key] = {};
    at = at[key] as Obj;
  }
  at[keys[keys.length - 1]] = value;
}

type Platform = { tenants: { name: string; strategies: string[] }[]; modifiers: { name: string; conditions: Obj; modifications: Obj }[] };

function readPlatform(toml: string | undefined): Platform {
  if (!toml) return { tenants: [], modifiers: [] };
  try {
    const doc = parseToml(toml) as Obj;
    return {
      tenants: list(doc.tenants)
        .filter(isObj)
        .map((t) => ({ name: str(t.name, 'tenant'), strategies: list(t.strategies).map((s) => str(s)) })),
      modifiers: list(doc.modifiers)
        .filter(isObj)
        .map((m) => ({
          name: str(m.name, 'modifier'),
          conditions: isObj(m.conditions) ? m.conditions : {},
          modifications: isObj(m.modifications) ? m.modifications : {},
        })),
    };
  } catch {
    return { tenants: [], modifiers: [] };
  }
}

/** Tenants a strategy reaches: PREVIEW ones for PREVIEW, RELEASE ones for RELEASE, both for UNIVERSAL. */
function tenantsFor(platform: Platform, strategy: Strategy, fallback: string): string[] {
  if (strategy === 'DISABLEMENT' || strategy === 'DELETION') {
    return platform.tenants.length ? platform.tenants.map((t) => t.name) : [fallback];
  }
  const wanted = strategy === 'UNIVERSAL' ? ['PREVIEW', 'RELEASE'] : [strategy];
  const hit = platform.tenants.filter((t) => t.strategies.some((s) => wanted.includes(s.toUpperCase())));
  return hit.length ? hit.map((t) => t.name) : platform.tenants.length ? [] : [fallback];
}

/** Modifiers whose conditions hold for this block: `default`, or its status. */
function matchModifiers(platform: Platform, status: string, kind: 'default' | 'status') {
  return platform.modifiers.filter((m) => {
    if (kind === 'default') return m.conditions.default === true;
    const statuses = list(m.conditions.status).map((s) => str(s).toUpperCase());
    return statuses.includes(status.toUpperCase());
  });
}

/** `prefix::[STAGING] ` prepends, `suffix::…` appends, anything else replaces. */
function applyModification(current: unknown, value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('prefix::')) return `${value.slice(8)}${str(current)}`;
    if (value.startsWith('suffix::')) return `${str(current)}${value.slice(8)}`;
  }
  return value;
}

function getPath(source: Obj, path: string): unknown {
  return path.split('.').reduce<unknown>((at, key) => (isObj(at) ? at[key] : undefined), source);
}

const SENTINEL_SEVERITY = new Set(['Informational', 'Low', 'Medium', 'High']);

function compileSentinel(rule: Obj, block: Obj, platform: Platform, status: string, strategy: Strategy): Omit<DeployTarget, 'key' | 'status' | 'strategy' | 'action' | 'tenants'> {
  const warnings: string[] = [];
  const scheduling = isObj(block.scheduling) ? block.scheduling : {};
  const alert: Obj = isObj(block.alert) ? { ...block.alert } : {};
  const grouping = isObj(block.grouping) ? block.grouping : {};
  const response = isObj(rule.response) ? rule.response : {};

  const frequencyIn = str(scheduling.frequency, 'PT1H');
  const lookbackIn = str(scheduling.lookback, frequencyIn);
  const frequency = toIsoDuration(frequencyIn);
  const lookback = toIsoDuration(lookbackIn);
  if (!frequency) warnings.push(`scheduling.frequency "${frequencyIn}" is not a duration: deploy fails`);
  if (!lookback) warnings.push(`scheduling.lookback "${lookbackIn}" is not a duration: deploy fails`);

  let severity = str(alert.severity) || str(response.alert_severity, 'Medium');
  if (severity === 'Critical') severity = 'High';
  alert.severity = severity;
  alert.title = str(alert.title, str(rule.name));

  const applied: string[] = [];
  const modified: Obj = { alert };
  for (const m of matchModifiers(platform, status, 'status')) {
    applied.push(m.name);
    for (const [path, value] of flatten(m.modifications)) setPath(modified, path, applyModification(getPath(modified, path), value));
  }
  severity = str(alert.severity);
  if (!SENTINEL_SEVERITY.has(severity)) warnings.push(`severity "${severity}" is not a Sentinel severity`);

  const suppression = alert.suppression;
  if (suppression === true) warnings.push('alert.suppression: true fails deploy; use false or a duration');
  const suppressionDuration = typeof suppression === 'string' ? toIsoDuration(suppression) : null;

  const techniques = list(alert.techniques).map((t) => str(t)).filter(Boolean);
  const resolved = techniques.length ? techniques : list(rule.techniques).map((t) => str(t));
  const query = dedent(str(block.query));

  const entityMappings = list(block.entities)
    .filter(isObj)
    .map((e) => ({
      entityType: str(e.entity),
      fieldMappings: list(e.mappings)
        .filter(isObj)
        .map((m) => ({ identifier: str(m.identifier), columnName: str(m.column) })),
    }));

  const groupAlert = isObj(grouping.alert) ? grouping.alert : {};
  const groupingEnabled = groupAlert.enabled === true;

  const properties = {
    displayName: str(block.name, str(rule.name)),
    description: dedent(str(rule.description)),
    severity,
    enabled: strategy !== 'DISABLEMENT',
    query,
    queryFrequency: frequency ?? frequencyIn,
    queryPeriod: lookback ?? lookbackIn,
    triggerOperator: 'GreaterThan',
    triggerThreshold: 0,
    suppressionEnabled: Boolean(suppressionDuration),
    suppressionDuration: suppressionDuration ?? 'PT1H',
    tactics: list(alert.tactics).map((t) => str(t)),
    techniques: resolved.map((t) => t.split('.')[0]),
    subTechniques: resolved.filter((t) => t.includes('.')),
    alertDetailsOverride: { alertDisplayNameFormat: str(alert.title) },
    entityMappings,
    eventGroupingSettings: { aggregationKind: str(grouping.event, 'SingleAlert') },
    incidentConfiguration: {
      createIncident: alert.create_incident !== false,
      groupingConfiguration: {
        enabled: groupingEnabled,
        reopenClosedIncident: groupAlert.reopen_closed_incidents === true,
        lookbackDuration: toIsoDuration(str(groupAlert.grouping_lookback, 'PT1H')) ?? 'PT1H',
        matchingMethod: str(groupAlert.matching, 'AllEntities'),
      },
    },
  };
  const uuid = str(isObj(rule.metadata) ? rule.metadata.uuid : '');
  const arm = {
    id: `/subscriptions/…/providers/Microsoft.SecurityInsights/alertRules/${uuid}`,
    name: uuid,
    kind: 'Scheduled',
    properties,
  };
  return {
    modifiers: applied,
    query,
    title: str(alert.title),
    severity,
    every: shortDuration(frequency ?? frequencyIn),
    facts: [
      { label: 'Rule', value: 'Scheduled analytics rule' },
      { label: 'Runs every', value: shortDuration(frequency ?? frequencyIn) },
      { label: 'Looks back', value: shortDuration(lookback ?? lookbackIn) },
      { label: 'Severity', value: severity },
      { label: 'Incidents', value: properties.incidentConfiguration.createIncident ? 'created' : 'off' },
      { label: 'Entities', value: entityMappings.map((e) => e.entityType).join(', ') || 'none' },
    ],
    artefact: { label: `alertRules/${uuid || 'rule'}.json`, language: 'json', text: JSON.stringify(arm, null, 2) },
    warnings,
  };
}

const SPLUNK_SEVERITY: Record<string, number> = { Informational: 2, Low: 3, Medium: 4, High: 5, Critical: 6 };

/** `15m` → a cron that runs every 15 minutes, its minute offset fixed by the rule's UUID (the `random` mode, made stable). */
export function frequencyToCron(frequency: string, seed: string): string | null {
  const m = /^(\d+)([mhd])$/.exec(frequency.trim());
  if (!m) return null;
  const n = Number(m[1]);
  let hash = 0;
  for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  if (m[2] === 'm') return n >= 60 ? null : `${hash % n}-59/${n} * * * *`;
  const minute = hash % 60;
  if (m[2] === 'h') return n === 1 ? `${minute} * * * *` : `${minute} ${(hash >> 6) % n}-23/${n} * * *`;
  return `${minute} ${(hash >> 6) % 24} */${n} * *`;
}

function compileSplunk(rule: Obj, block: Obj, platform: Platform, status: string, strategy: Strategy): Omit<DeployTarget, 'key' | 'status' | 'strategy' | 'action' | 'tenants'> {
  const warnings: string[] = [];
  const name = str(block.name, str(rule.name));
  const uuid = str(isObj(rule.metadata) ? rule.metadata.uuid : '');
  const scheduling = isObj(block.scheduling) ? block.scheduling : {};
  const schedule = isObj(scheduling.schedule) ? scheduling.schedule : {};
  const timerange = isObj(scheduling.timerange) ? scheduling.timerange : {};
  const trigger = isObj(block.trigger) ? block.trigger : {};
  const throttling = isObj(trigger.throttling) ? trigger.throttling : {};
  const actions = isObj(block.actions) ? block.actions : {};
  const response = isObj(rule.response) ? rule.response : {};
  const query = dedent(str(block.query ?? block.search));

  const conf: [string, string][] = [];
  const put = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return;
    const i = conf.findIndex(([k]) => k === key);
    const text = typeof value === 'boolean' ? (value ? '1' : '0') : str(value, JSON.stringify(value));
    if (i >= 0) conf[i] = [key, text];
    else conf.push([key, text]);
  };

  put('search', query);
  put('description', dedent(str(rule.description)));
  put('disabled', strategy === 'DISABLEMENT');
  const realtime = str(scheduling.type).toLowerCase() === 'real time';
  let every = '';
  if (realtime) {
    put('dispatch.earliest_time', 'rt');
    put('dispatch.latest_time', 'rt');
    every = 'real time';
  } else {
    put('is_scheduled', true);
    const cron = str(schedule.cron) || (str(schedule.frequency) ? frequencyToCron(str(schedule.frequency), uuid || name) : null);
    if (!cron) warnings.push('scheduling.schedule needs a cron or a frequency (5m, 1h, 1d)');
    put('cron_schedule', cron ?? '');
    every = str(schedule.frequency) || str(schedule.cron) || '';
    const lookback = str(timerange.lookback);
    put('dispatch.earliest_time', str(timerange.earliest) || (lookback ? `-${lookback}@m` : ''));
    put('dispatch.latest_time', str(timerange.latest));
  }
  put('alert.expires', str(scheduling.expires));
  const severityNumber =
    typeof trigger.severity === 'number' ? trigger.severity : SPLUNK_SEVERITY[str(response.alert_severity)] ?? 3;
  put('alert.severity', severityNumber);
  put('counttype', str(trigger.condition, 'number of events'));
  put('relation', str(trigger.comparator, 'greater than'));
  put('quantity', typeof trigger.threshold === 'number' ? trigger.threshold : 0);
  put('alert_condition', str(trigger.custom_condition));
  if (trigger.type !== undefined) put('alert.digest_mode', str(trigger.type).toLowerCase() === 'once');
  if (str(throttling.duration)) {
    put('alert.suppress', true);
    put('alert.suppress.period', str(throttling.duration));
  }
  put('alert.suppress.fields', list(throttling.fields).map((f) => str(f)).join(','));
  put('alert.suppress.group_name', str(throttling.group_name));

  const notable = isObj(actions.notable) ? actions.notable : null;
  const risk = isObj(actions.risk) ? actions.risk : null;
  const enabledActions: string[] = [];
  put('action.correlationsearch.enabled', true);
  put('action.correlationsearch.label', name);
  if (notable) {
    enabledActions.push('notable');
    const event = isObj(notable.event) ? notable.event : {};
    put('action.notable', true);
    put('action.notable.param.rule_title', str(event.title, name));
    put('action.notable.param.rule_description', str(event.description));
    put('action.notable.param.security_domain', str(notable.security_domain).toLowerCase());
  }
  if (risk) {
    enabledActions.push('risk');
    const objects = [
      ...list(risk.risk_objects)
        .filter(isObj)
        .map((o) => ({ risk_object_field: str(o.field), risk_object_type: str(o.type), risk_score: o.score })),
      ...list(risk.threat_objects)
        .filter(isObj)
        .map((o) => ({ threat_object_field: str(o.field), threat_object_type: str(o.type) })),
    ];
    put('action.risk', true);
    put('action.risk.param._risk_message', str(risk.message));
    put('action.risk.param._risk', JSON.stringify(objects));
  }
  put('actions', enabledActions.join(','));

  const applied: string[] = [];
  // Default modifiers fill gaps; status modifiers overwrite.
  for (const m of matchModifiers(platform, status, 'default')) {
    applied.push(m.name);
    for (const [key, value] of flatten(m.modifications)) if (!conf.some(([k]) => k === key)) put(key, value);
  }
  for (const m of matchModifiers(platform, status, 'status')) {
    applied.push(m.name);
    for (const [key, value] of flatten(m.modifications)) put(key, applyModification(conf.find(([k]) => k === key)?.[1], value));
  }

  const severityName = Object.entries(SPLUNK_SEVERITY).find(([, n]) => n === Number(conf.find(([k]) => k === 'alert.severity')?.[1]))?.[0] ?? 'Low';
  const title = conf.find(([k]) => k === 'action.notable.param.rule_title')?.[1] ?? name;
  const stanza = [
    `[${name}]`,
    ...conf.map(([k, v]) => `${k} = ${v.includes('\n') ? v.split('\n').join(' \\\n') : v}`),
  ].join('\n');

  return {
    modifiers: applied,
    query,
    title,
    severity: severityName,
    every: shortDuration(every) || every,
    facts: [
      { label: 'Search', value: notable ? 'Correlation search' : 'Saved search' },
      { label: 'Schedule', value: realtime ? 'real time' : conf.find(([k]) => k === 'cron_schedule')?.[1] ?? '—' },
      { label: 'Window', value: `${conf.find(([k]) => k === 'dispatch.earliest_time')?.[1] ?? '—'} → ${conf.find(([k]) => k === 'dispatch.latest_time')?.[1] ?? 'now'}` },
      { label: 'Severity', value: `${severityName} (${conf.find(([k]) => k === 'alert.severity')?.[1]})` },
      { label: 'Actions', value: enabledActions.join(', ') || 'none' },
      { label: 'Throttle', value: str(throttling.duration) ? `${str(throttling.duration)} by ${list(throttling.fields).join(', ')}` : 'off' },
    ],
    artefact: { label: 'savedsearches.conf', language: 'conf', text: stanza },
    warnings,
  };
}

/** Any other integration: the block as deploy reads it, with the shared fields. */
function compileGeneric(rule: Obj, block: Obj): Omit<DeployTarget, 'key' | 'status' | 'strategy' | 'action' | 'tenants'> {
  const response = isObj(rule.response) ? rule.response : {};
  const query = dedent(str(block.query ?? (isObj(block.condition) ? JSON.stringify(block.condition) : '')));
  const scheduling = isObj(block.scheduling) ? block.scheduling : isObj(block.schedule) ? block.schedule : {};
  const every = str(scheduling.frequency) || str(scheduling.every) || str(block.scheduling) || '1h';
  const severity = str(isObj(block.alert) ? block.alert.severity : undefined) || str(block.severity) || str(response.alert_severity, 'Medium');
  return {
    modifiers: [],
    query,
    title: str(block.name, str(rule.name)),
    severity,
    every: shortDuration(every),
    facts: [
      { label: 'Runs every', value: shortDuration(every) },
      { label: 'Severity', value: severity },
    ],
    artefact: { label: 'payload.json', language: 'json', text: JSON.stringify({ name: str(block.name, str(rule.name)), ...block }, null, 2) },
    warnings: [],
  };
}

/** Flatten TOML modifications: `alert.severity = "x"` and `[alert] severity = "x"` both become `alert.severity`. */
function flatten(source: Obj, prefix = ''): [string, unknown][] {
  return Object.entries(source).flatMap(([key, value]) =>
    isObj(value) ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value] as [string, unknown]],
  );
}

/**
 * Compile a rule for every integration its `configurations` enables.
 * `platforms` maps a `configurations` key to that platform's TOML text.
 */
export function compileRule(yamlText: string, platforms: Record<string, string>): CompiledRule {
  let rule: unknown;
  try {
    rule = parseYaml(yamlText);
  } catch (error) {
    return { name: '', uuid: '', status: '', targets: [], error: `The YAML does not parse: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}` };
  }
  if (!isObj(rule)) return { name: '', uuid: '', status: '', targets: [], error: 'This file is not a Tide object.' };
  const metadata = isObj(rule.metadata) ? rule.metadata : {};
  const schema = str(metadata.schema);
  const name = str(rule.name, 'Untitled rule');
  const uuid = str(metadata.uuid);
  const status = str(rule.status, 'DEVELOPMENT').toUpperCase();
  if (!schema.startsWith('rule::')) {
    return { name, uuid, status, targets: [], error: `Only rules deploy. This is ${schema ? `a ${schema.split('::')[0]}` : 'not a Tide rule'}: open a rule to deploy it.` };
  }
  const configurations = isObj(rule.configurations) ? rule.configurations : {};
  const targets: DeployTarget[] = [];
  for (const [key, value] of Object.entries(configurations)) {
    if (!isObj(value)) continue;
    const blockStatus = str(value.status, status).toUpperCase();
    const strategy = STATUS_STRATEGY[blockStatus] ?? 'PREVIEW';
    const platform = readPlatform(platforms[key]);
    const enabled = value.enabled !== false;
    const action: DeployTarget['action'] = !enabled
      ? 'skip'
      : strategy === 'DISABLEMENT'
        ? 'disable'
        : strategy === 'DELETION'
          ? 'delete'
          : 'create';
    const compiled =
      key === 'sentinel'
        ? compileSentinel(rule, value, platform, blockStatus, strategy)
        : key === 'splunk'
          ? compileSplunk(rule, value, platform, blockStatus, strategy)
          : compileGeneric(rule, value);
    const tenants = tenantsFor(platform, strategy, strategy === 'RELEASE' ? 'production' : 'staging');
    if (action !== 'skip' && tenants.length === 0) {
      compiled.warnings.push(`no ${key} tenant takes ${strategy} deploys: nothing is deployed`);
    }
    if (!STATUS_STRATEGY[blockStatus]) compiled.warnings.push(`status ${blockStatus} is not a bundled status`);
    targets.push({ key, status: blockStatus, strategy, action, tenants, ...compiled });
  }
  return { name, uuid, status, targets };
}
