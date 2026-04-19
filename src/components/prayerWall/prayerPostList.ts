import { PrayerPost } from '@/utils/types';

export const getPrayerPostIdentity = (post: PrayerPost): string | null => {
  const candidate = String(post.postId ?? post.id ?? '').trim();
  return candidate.length > 0 ? candidate : null;
};

export const dedupePrayerPosts = (posts: PrayerPost[]): PrayerPost[] => {
  const seen = new Set<string>();
  const deduped: PrayerPost[] = [];

  posts.forEach((post) => {
    const identity = getPrayerPostIdentity(post);
    if (!identity) {
      deduped.push(post);
      return;
    }

    if (seen.has(identity)) {
      return;
    }

    seen.add(identity);
    deduped.push(post);
  });

  return deduped;
};

export const appendUniquePrayerPosts = (
  previous: PrayerPost[],
  incoming: PrayerPost[]
): PrayerPost[] => {
  return dedupePrayerPosts([...previous, ...incoming]);
};
