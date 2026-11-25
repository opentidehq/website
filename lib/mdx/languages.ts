import type { LanguageRegistration } from 'shiki';
import yaralGrammar from './grammars/yaral.tmLanguage.json' with { type: 'json' };

/**
 * Code-block languages Shiki does not bundle. Each grammar is copied verbatim from
 * opentidehq/opentide `highlights/generated/` (written by `opentide-lsp generate-highlights`
 * from the frozen HighlightSpec), so a fence on the site colours like the editor. Refresh the copy
 * when opentide changes the grammar.
 */
export const EXTRA_LANGUAGES: LanguageRegistration[] = [
  {
    ...(yaralGrammar as unknown as LanguageRegistration),
    // Shiki keys a fence by `name`; the generated file names itself "opentide yaral".
    name: 'yaral',
    displayName: 'YARA-L',
    aliases: ['yara-l', 'yl2'],
  },
];
