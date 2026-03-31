import {
  extractExifOrientation,
  getOrientationTransform,
  getOrientedDimensions,
  normalizeExifOrientation,
  orientationSwapsDimensions,
} from '../uploadImageOrientation';
import {
  CLIENT_IMAGE_MAX_HEIGHT,
  CLIENT_IMAGE_MAX_WIDTH,
  CLIENT_IMAGE_PICKER_QUALITY,
  UPLOAD_IMAGE_EXPORT_QUALITY,
} from '../uploadImageConfig';

describe('uploadImageOrientation', () => {
  it('normalizes supported EXIF orientation values', () => {
    expect(normalizeExifOrientation('6')).toBe(6);
    expect(normalizeExifOrientation(3)).toBe(3);
    expect(normalizeExifOrientation(9)).toBeUndefined();
  });

  it('extracts orientation from picker metadata payloads', () => {
    expect(extractExifOrientation({ exif: { Orientation: 8 } })).toBe(8);
    expect(extractExifOrientation({ orientation: '6' })).toBe(6);
  });

  it('marks rotated EXIF values as dimension-swapping', () => {
    expect(orientationSwapsDimensions(6)).toBe(true);
    expect(orientationSwapsDimensions(8)).toBe(true);
    expect(orientationSwapsDimensions(3)).toBe(false);
  });

  it('swaps output geometry for 90-degree rotations', () => {
    expect(getOrientedDimensions(1200, 1600, 6)).toEqual({
      width: 1600,
      height: 1200,
    });
    expect(getOrientedDimensions(1200, 1600, 1)).toEqual({
      width: 1200,
      height: 1600,
    });
  });

  it('builds the expected canvas transform for rotated exports', () => {
    expect(getOrientationTransform(1200, 1600, 6)).toEqual({
      matrix: [0, -1, 1600, 1, 0, 0, 0, 0, 1],
      outputWidth: 1600,
      outputHeight: 1200,
    });
  });

  it('uses the higher-quality editor export and picker limits', () => {
    expect(CLIENT_IMAGE_PICKER_QUALITY).toBe(0.9);
    expect(CLIENT_IMAGE_MAX_WIDTH).toBe(2048);
    expect(CLIENT_IMAGE_MAX_HEIGHT).toBe(2560);
    expect(UPLOAD_IMAGE_EXPORT_QUALITY).toBe(90);
  });
});
