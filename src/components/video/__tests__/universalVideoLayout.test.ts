import {
  FEED_TALL_VIDEO_MAX_HEIGHT,
  getFeedVideoLayout,
  getWatchVideoLayout,
  resolveVideoMetadata,
} from '../universalVideoLayout';

describe('universalVideoLayout', () => {
  it('prefers aspect_ratio string over numeric metadata', () => {
    const metadata = resolveVideoMetadata({
      aspect_ratio: '9:16',
      aspectRatio: 16 / 9,
      videoWidth: 1920,
      videoHeight: 1080,
    });

    expect(metadata.aspectRatio).toBeCloseTo(9 / 16);
    expect(metadata.aspectRatioLabel).toBe('9:16');
    expect(metadata.isNineBySixteen).toBe(true);
  });

  it('caps tall feed previews and keeps contain framing', () => {
    const layout = getFeedVideoLayout(320, { aspect_ratio: '9:16' });

    expect(layout.frameWidth).toBe(320);
    expect(layout.frameHeight).toBe(FEED_TALL_VIDEO_MAX_HEIGHT);
    expect(layout.isCappedTallPreview).toBe(true);
    expect(layout.resizeMode).toBe('contain');
  });

  it('renders nine-by-sixteen watch items full screen and others contained', () => {
    const fullScreen = getWatchVideoLayout(390, 780, { aspect_ratio: '9:16' });
    const landscape = getWatchVideoLayout(390, 780, { aspect_ratio: '16:9' });

    expect(fullScreen.isFullScreen).toBe(true);
    expect(fullScreen.resizeMode).toBe('cover');
    expect(fullScreen.frameWidth).toBe(390);
    expect(fullScreen.frameHeight).toBe(780);

    expect(landscape.isFullScreen).toBe(false);
    expect(landscape.resizeMode).toBe('contain');
    expect(landscape.frameWidth).toBe(390);
    expect(landscape.frameHeight).toBeCloseTo(390 / (16 / 9));
  });
});
