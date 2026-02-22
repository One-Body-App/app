import { buildSlideHeights, clampAspectRatio } from '../ImageSlider';
import { ImageForSlider } from '../types';

const MIN_RATIO = 9 / 16;
const MAX_RATIO = 1;

const makeImage = (width: number, height: number): ImageForSlider => ({
  url: `https://example.com/${width}x${height}.jpg`,
  width,
  height,
  type: 'image',
});

describe('ImageSlider ratio helpers', () => {
  it('clamps ratios larger than max to 1', () => {
    expect(clampAspectRatio(1.8, MIN_RATIO, MAX_RATIO)).toBe(1);
  });

  it('clamps ratios lower than min to 9/16', () => {
    expect(clampAspectRatio(0.4, MIN_RATIO, MAX_RATIO)).toBe(MIN_RATIO);
  });

  it('keeps in-range ratio unchanged', () => {
    expect(clampAspectRatio(0.75, MIN_RATIO, MAX_RATIO)).toBe(0.75);
  });

  it('builds slide heights from clamped ratios', () => {
    const width = 160;
    const images: ImageForSlider[] = [makeImage(1600, 900), makeImage(900, 1600), makeImage(4, 5)];

    const heights = buildSlideHeights(images, width, MIN_RATIO, MAX_RATIO);

    expect(heights).toHaveLength(3);
    expect(heights[0]).toBeCloseTo(160, 5);
    expect(heights[1]).toBeCloseTo(width / MIN_RATIO, 5);
    expect(heights[2]).toBeCloseTo(width / 0.8, 5);
  });
});
