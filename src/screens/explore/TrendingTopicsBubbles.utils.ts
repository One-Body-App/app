const BASE_FONT_SIZE = 14;
const BASE_LINE_HEIGHT = 18;
const BASE_PADDING_HORIZONTAL = 12;
const BASE_PADDING_VERTICAL = 6;

export const TAP_ANIMATION_DURATION_MS = 180;
export const TOPIC_TIER_SCALE = {
  1: 1,
  2: 1.1,
  3: 1.2,
  4: 1.3,
} as const;

type TopicPalette = {
  backgroundColor: string;
  textColor: string;
};

export type TrendingTopicTier = 1 | 2 | 3 | 4;

export type TrendingTopicBubbleItem = {
  id: string;
  topic: string;
  popularity: number;
};

const LIGHT_TIER_PALETTE: Record<TrendingTopicTier, TopicPalette> = {
  1: { backgroundColor: '#e6eaec', textColor: '#3c4b64' },
  2: { backgroundColor: '#cdd5d8', textColor: '#126b87' },
  3: { backgroundColor: '#d0f6f7', textColor: '#032f3c' },
  4: { backgroundColor: '#89e9ec', textColor: '#000015' },
};

const DARK_TIER_PALETTE: Record<TrendingTopicTier, TopicPalette> = {
  1: { backgroundColor: '#355963', textColor: '#e6eaec' },
  2: { backgroundColor: '#4f6d77', textColor: '#e6eaec' },
  3: { backgroundColor: '#126b87', textColor: '#e6eaec' },
  4: { backgroundColor: '#41899f', textColor: '#ffffff' },
};

export const TRENDING_TOPICS_MOCK_DATA: TrendingTopicBubbleItem[] = [
  { id: 'prayer-requests', topic: 'Prayer Requests', popularity: 96 },
  { id: 'local-missions', topic: 'Local Missions', popularity: 88 },
  { id: 'bible-study', topic: 'Bible Study', popularity: 84 },
  { id: 'worship', topic: 'Worship', popularity: 78 },
  { id: 'youth-ministry', topic: 'Youth Ministry', popularity: 68 },
  { id: 'apologetics', topic: 'Apologetics', popularity: 58 },
];

export const mapTrendingTopicResponse = (items: unknown[]): TrendingTopicBubbleItem[] =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const candidate = item as {
        _id?: string;
        id?: string;
        name?: string;
        title?: string;
        popularity?: number;
      };
      const topic = candidate?.name ?? candidate?.title ?? '';
      if (!topic) {
        return null;
      }

      return {
        id: candidate?._id ?? candidate?.id ?? `topic-${index}`,
        topic,
        popularity:
          typeof candidate?.popularity === 'number' && Number.isFinite(candidate.popularity)
            ? candidate.popularity
            : 1,
      };
    })
    .filter((item): item is TrendingTopicBubbleItem => item !== null);

export const getTopicTier = (
  popularity: number,
  minPopularity: number,
  maxPopularity: number
): TrendingTopicTier => {
  if (maxPopularity <= minPopularity) {
    return 1;
  }

  const normalized = (popularity - minPopularity) / (maxPopularity - minPopularity);
  if (normalized < 0.25) return 1;
  if (normalized < 0.55) return 2;
  if (normalized < 0.8) return 3;
  return 4;
};

export const getTopicScale = (tier: TrendingTopicTier) => TOPIC_TIER_SCALE[tier];

export const getTopicMetrics = (tier: TrendingTopicTier) => {
  const scale = getTopicScale(tier);
  return {
    scale,
    fontSize: BASE_FONT_SIZE * scale,
    lineHeight: BASE_LINE_HEIGHT * scale,
    paddingHorizontal: BASE_PADDING_HORIZONTAL * scale,
    paddingVertical: BASE_PADDING_VERTICAL * scale,
  };
};

export const getTopicPalette = (tier: TrendingTopicTier, isDarkMode: boolean) =>
  (isDarkMode ? DARK_TIER_PALETTE : LIGHT_TIER_PALETTE)[tier];
