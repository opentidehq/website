/**
 * The repository the playground opens: the landing's demo objects (they pass `opentide validate
 * --strict` in `pnpm verify:demos`), the visibility file and the two platform files. The engine is
 * given every file on `initialize`, so UUID references resolve across them as they do on disk.
 */
import { DEMO_FILES, DEMO_PATHS, RULE_PATH, VISIBILITY_PATH, VISIBILITY_TOML } from '@/lib/landing/demo-registry';

export const ROOT_URI = 'file:///detection-repo';

export type PlaygroundFile = {
  path: string;
  text: string;
  /** What the editor and the engine call the file's language. */
  language: 'opentide-yaml' | 'toml';
};

export const PLAYGROUND_PATHS = [...DEMO_PATHS, VISIBILITY_PATH] as const;

export function initialFiles(): PlaygroundFile[] {
  return [
    ...DEMO_PATHS.map((path) => ({ path, text: DEMO_FILES[path], language: languageOf(path) })),
    { path: VISIBILITY_PATH, text: VISIBILITY_TOML, language: 'toml' as const },
  ];
}

export const INITIAL_PATH: string = RULE_PATH;
export { VISIBILITY_PATH };

export function languageOf(path: string): PlaygroundFile['language'] {
  return path.endsWith('.toml') ? 'toml' : 'opentide-yaml';
}

export const uriOf = (path: string) => `${ROOT_URI}/${path}`;
export const pathOf = (uri: string) => (uri.startsWith(`${ROOT_URI}/`) ? uri.slice(ROOT_URI.length + 1) : uri);

/** `configurations` key → the platform file beside it. */
export function platformFiles(files: PlaygroundFile[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of files) {
    const m = /^\.opentide\/configurations\/platforms\/([^/]+)\.toml$/.exec(file.path);
    if (m) out[m[1]] = file.text;
  }
  return out;
}

/** A blank rule to start from, linked to the demo objective so the reference resolves. */
export function newRuleTemplate(name: string, uuid: string, today: string): string {
  return `name: ${name}

metadata:
  uuid: ${uuid}
  schema: rule::1.1
  version: 1.0.0
  created: "${today}"
  modified: "${today}"
  tlp: clear
  author: you
  organisation:
    uuid: 00000000-0000-4000-8000-000000000099
    name: Example Corp

description: |
  What this rule detects, and why.
status: DEVELOPMENT
severity: Medium
techniques:
  - T1059.001
detection_model: 00000000-0000-4000-8002-000000000001

configurations:
  sentinel:
    enabled: true
    query: |
      DeviceProcessEvents
      | where FileName =~ "powershell.exe"
      | where ProcessCommandLine has "-EncodedCommand"
    scheduling:
      frequency: 30m
      lookback: 1h
`;
}
