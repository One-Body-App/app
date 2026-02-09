import { PrayerWallCategory } from '@/utils/types';
// eslint-disable-next-line import/extensions
import prayerWallFeedStyles from '@/src/screens/main/prayer/OnePrayerWallFeed.module.scss';

function getPrayerWallWebClassName(category?: PrayerWallCategory, answered?: boolean) {
  const baseClass = `${prayerWallFeedStyles.postCard} ${prayerWallFeedStyles.bodyText}`;

  if (answered || category === PrayerWallCategory.AnsweredPrayer) {
    return `${baseClass} ${prayerWallFeedStyles.answeredPrayer}`;
  }

  if (category === PrayerWallCategory.Exhortation) {
    return `${baseClass} ${prayerWallFeedStyles.exhortation}`;
  }

  if (category === PrayerWallCategory.Testimony) {
    return `${baseClass} ${prayerWallFeedStyles.testimony}`;
  }

  return `${baseClass} ${prayerWallFeedStyles.request}`;
}

export default getPrayerWallWebClassName;
