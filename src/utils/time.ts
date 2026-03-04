const ISO_WITH_ZONE_SUFFIX_REGEX = /(Z|[+-]\d{2}:\d{2})$/i;

export const nowUtcIso = () => new Date().toISOString();

export const isIsoWithZone = (value: unknown) => {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed || !ISO_WITH_ZONE_SUFFIX_REGEX.test(trimmed)) {
    return false;
  }

  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime());
};

export const parseIsoOrNull = (value: unknown, options: { requireZone?: boolean } = {}) => {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return null;
  }

  if (options.requireZone && typeof value === 'string' && !isIsoWithZone(value)) {
    return null;
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export const formatLocalDate = (value: unknown, options?: Intl.DateTimeFormatOptions) => {
  const parsed = parseIsoOrNull(value);
  if (!parsed) {
    return '';
  }

  return parsed.toLocaleDateString(undefined, options);
};

export const formatRelativeTime = (value: unknown) => {
  const parsed = parseIsoOrNull(value);
  if (!parsed) {
    return '';
  }

  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatLocalDate(parsed);
};
