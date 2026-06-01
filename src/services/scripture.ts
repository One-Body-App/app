import { ApiCall } from '@/services/api';
import type { ScriptureMention } from '@/utils/types';

/**
 * Scripture detection + verse fetching for mobile. Talks to the One Body API's
 * scripture module (mirrors the web/src/api/scripture.ts contract):
 *   POST scripture/parse, GET scripture/verse, GET scripture/translations
 *
 * `hasLikelyScripture` is a local, network-free heuristic used to flash the
 * composer chip while typing. The server stays authoritative for what's
 * persisted on a post.
 */

export interface VerseResult {
  reference: string;
  translation: string;
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseEnd: number;
  text: string;
}

export interface BibleTranslation {
  id: string;
  name: string;
  englishName: string;
  shortName?: string;
  language: string;
}

export const DEFAULT_TRANSLATION = 'BSB';

/**
 * YouVersion bible.com URL for a reference (universal link: opens the YouVersion
 * app if installed, else the web). Shared via the native share sheet so the
 * reader can route it to any Bible app — there is no OS-level "Bible apps"
 * picker, so the share sheet IS the native picker. USFM codes match YouVersion.
 */
export function bibleAppUrl(m: {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
}): string {
  const range = m.verseEnd && m.verseEnd > m.verse ? `${m.verse}-${m.verseEnd}` : `${m.verse}`;
  return `https://www.bible.com/bible/1/${m.book}.${m.chapter}.${range}`;
}

// Lightweight client-side trigger only (full validation is server-side):
// <Book> <chapter>:<verse>[-<end>].
const LOCAL_REF_REGEX =
  /\b(?:(?:1|2|3|i{1,3})\s*)?[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\.?\s+\d{1,3}\s*[:.]\s*\d{1,3}(?:\s*[-–]\s*\d{1,3})?/g;

export function hasLikelyScripture(text: string): boolean {
  if (!text) return false;
  LOCAL_REF_REGEX.lastIndex = 0;
  return LOCAL_REF_REGEX.test(text);
}

export async function parseScripture(
  text: string,
  token?: string | boolean,
  translation?: string
): Promise<ScriptureMention[]> {
  try {
    const { response } = await ApiCall<{ mentions: ScriptureMention[] }>({
      route: 'scripture/parse',
      verb: 'post',
      token: token ?? true,
      params: { text, translation },
      suppressErrorLog: true,
    });
    return response?.mentions ?? [];
  } catch {
    return [];
  }
}

export async function fetchVerse(
  m: Pick<ScriptureMention, 'book' | 'chapter' | 'verse' | 'verseEnd'>,
  translation: string = DEFAULT_TRANSLATION,
  token?: string | boolean
): Promise<VerseResult> {
  const query = new URLSearchParams({
    book: m.book,
    chapter: String(m.chapter),
    verse: String(m.verse),
    translation,
  });
  if (m.verseEnd && m.verseEnd > m.verse) {
    query.set('verseEnd', String(m.verseEnd));
  }
  const { response } = await ApiCall<VerseResult>({
    route: `scripture/verse?${query.toString()}`,
    verb: 'get',
    token: token ?? true,
    suppressErrorLog: true,
  });
  return response;
}

let translationsCache: BibleTranslation[] | null = null;
export async function fetchTranslations(token?: string | boolean): Promise<BibleTranslation[]> {
  if (translationsCache) return translationsCache;
  try {
    const { response } = await ApiCall<BibleTranslation[]>({
      route: 'scripture/translations',
      verb: 'get',
      token: token ?? true,
      suppressErrorLog: true,
    });
    translationsCache = Array.isArray(response) ? response : [];
    return translationsCache;
  } catch {
    return [];
  }
}
