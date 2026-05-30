import { NO_PROFILE_IMAGE } from '@/services/constants';

const DEFAULT_PROFILE_PLACEHOLDER_PATH = '/user/no-image.png';

type AvatarSource = {
  profileImage?: unknown;
  profile_image?: unknown;
  avatar?: unknown;
};

type FeedAvatarSource = {
  authorAvatar?: unknown;
  user?: AvatarSource | null;
  userData?: AvatarSource | null;
};

const normalizeAvatarCandidate = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const isValidHttpUrl = (value: string) => /^https?:\/\/.+/i.test(value);

export const isFeedAvatarPlaceholderUri = (value: unknown) => {
  const normalizedValue = normalizeAvatarCandidate(value);
  if (!normalizedValue) {
    return false;
  }

  const configuredPlaceholder = normalizeAvatarCandidate(NO_PROFILE_IMAGE);
  if (
    configuredPlaceholder &&
    normalizedValue.toLowerCase() === configuredPlaceholder.toLowerCase()
  ) {
    return true;
  }

  if (!isValidHttpUrl(normalizedValue)) {
    return false;
  }

  try {
    const pathname = new URL(normalizedValue).pathname.replace(/\/+/g, '/').toLowerCase();
    return pathname.endsWith(DEFAULT_PROFILE_PLACEHOLDER_PATH);
  } catch {
    return /\/user\/no-image\.png(?:$|[?#])/i.test(normalizedValue);
  }
};

const resolveFirstRealAvatarUri = (candidates: unknown[]) =>
  candidates
    .map(normalizeAvatarCandidate)
    .find((candidate) => candidate && !isFeedAvatarPlaceholderUri(candidate));

export const resolveProfileAvatarUri = (profile?: AvatarSource | null) => {
  const avatarUri = resolveFirstRealAvatarUri([
    profile?.profileImage,
    profile?.avatar,
    profile?.profile_image,
  ]);

  return avatarUri || normalizeAvatarCandidate(NO_PROFILE_IMAGE);
};

export const resolveFeedAvatarUri = (item?: FeedAvatarSource | null) => {
  const avatarUri = resolveFirstRealAvatarUri([
    item?.authorAvatar,
    item?.user?.profileImage,
    item?.user?.avatar,
    item?.user?.profile_image,
    item?.userData?.profileImage,
    item?.userData?.avatar,
    item?.userData?.profile_image,
  ]);

  return avatarUri || normalizeAvatarCandidate(NO_PROFILE_IMAGE);
};
