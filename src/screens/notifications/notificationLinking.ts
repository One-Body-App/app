type NotificationPayloadData = Record<string, unknown>;

const ONEBODY_WEB_HOSTS = new Set([
  'app.onebodyapp.com',
  'www.onebodyapp.com',
  'onebodyapp.com',
  'auth.onebodyapp.com',
]);

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const tryParseUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const getPayloadString = (data: NotificationPayloadData | undefined, key: string) =>
  normalizeOptionalString(data?.[key]);

const normalizePostType = (value: unknown) => {
  const normalized = normalizeOptionalString(value)?.toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (
    normalized === 'social' ||
    normalized === 'prayer' ||
    normalized === 'watch' ||
    normalized === 'rss'
  ) {
    return normalized;
  }

  return undefined;
};

export const isOneBodyDeepLinkCandidate = (value?: string | null) => {
  const parsed = tryParseUrl(value);
  if (!parsed) {
    return false;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol === 'onebodyapp:') {
    return true;
  }

  return (protocol === 'https:' || protocol === 'http:') && ONEBODY_WEB_HOSTS.has(parsed.host);
};

export const normalizeNotificationTapUrl = (rawUrl?: string | null) => {
  const parsed = tryParseUrl(rawUrl);
  if (!parsed || !rawUrl) {
    return rawUrl || '';
  }

  if (parsed.protocol.toLowerCase() === 'onebodyapp:') {
    return rawUrl;
  }

  if (!ONEBODY_WEB_HOSTS.has(parsed.host)) {
    return rawUrl;
  }

  const normalizedPath = parsed.pathname.replace(/^\/+/, '');
  const query = parsed.search || '';
  const hash = parsed.hash || '';
  return `onebodyapp://${normalizedPath}${query}${hash}`;
};

export const buildNotificationPostDeepLink = (
  postType: unknown,
  postId: unknown,
  commentId?: unknown
) => {
  const normalizedPostType = normalizePostType(postType);
  const normalizedPostId = normalizeOptionalString(postId);
  const normalizedCommentId = normalizeOptionalString(commentId);

  if (!normalizedPostType || !normalizedPostId) {
    return undefined;
  }

  const url = `onebodyapp://post/${normalizedPostType}/${normalizedPostId}`;
  if (!normalizedCommentId) {
    return url;
  }

  return `${url}?commentId=${encodeURIComponent(normalizedCommentId)}`;
};

export const resolveNotificationTargetUrl = (input: {
  url?: string;
  data?: NotificationPayloadData;
}) => {
  const directUrl = normalizeOptionalString(input.url);
  if (directUrl) {
    return directUrl;
  }

  const nestedUrl =
    getPayloadString(input.data, 'url') ||
    getPayloadString(input.data, 'deepLink') ||
    getPayloadString(input.data, 'link');
  if (nestedUrl) {
    return nestedUrl;
  }

  return buildNotificationPostDeepLink(
    input.data?.postType,
    input.data?.postId,
    input.data?.commentId
  );
};
