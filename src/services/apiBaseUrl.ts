export function normalizeApiBaseUrl(value?: string | null) {
  const trimmed = String(value ?? '')
    .trim()
    .replace(/\/+$/, '');

  if (!trimmed) {
    return '';
  }

  const absoluteOriginOnly = /^[a-z][a-z\d+\-.]*:\/\/[^/?#]+$/i.test(trimmed);

  if (absoluteOriginOnly) {
    return `${trimmed}/api`;
  }

  return trimmed;
}
