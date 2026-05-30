export const COMPOSER_MAX_CONSECUTIVE_NEWLINES = 4;

export const collapseComposerNewlines = (value: string) =>
  String(value || '').replace(/\n{5,}/g, '\n\n\n\n');

export const sanitizeComposerText = (value: string, maxCharacters?: number) => {
  const normalized = collapseComposerNewlines(value);
  if (typeof maxCharacters === 'number' && maxCharacters >= 0) {
    return normalized.slice(0, maxCharacters);
  }

  return normalized;
};
