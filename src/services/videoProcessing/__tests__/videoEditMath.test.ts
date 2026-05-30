import {
  AUDIO_BITRATE,
  SUPPORTED_VIDEO_RATIO_IDS,
  VIDEO_RATIO_CONFIG,
  clampVideoTransform,
  createDefaultVideoTransform,
  resolveClosestVideoRatioId,
  resolveCropRect,
  resolveModerationFrameCount,
  resolveSourceCrop,
  resolveSupportedUploadRatioId,
  SUPPORTED_UPLOAD_RATIO_TOLERANCE,
} from '../videoEditMath';

describe('videoEditMath', () => {
  it('resolves the expected output targets for supported ratios', () => {
    expect(SUPPORTED_VIDEO_RATIO_IDS).toEqual(['1:1', '4:3', '16:9', '9:16']);
    expect(VIDEO_RATIO_CONFIG['9:16']).toEqual({
      ratio: 9 / 16,
      outputWidth: 1080,
      outputHeight: 1920,
      videoBitrate: 5_000_000,
    });
    expect(VIDEO_RATIO_CONFIG['16:9']).toEqual({
      ratio: 16 / 9,
      outputWidth: 1920,
      outputHeight: 1080,
      videoBitrate: 5_000_000,
    });
    expect(AUDIO_BITRATE).toBe(128_000);
  });

  it('resolves the closest supported ratio id from source dimensions', () => {
    expect(resolveClosestVideoRatioId(1080, 1920)).toBe('9:16');
    expect(resolveClosestVideoRatioId(1920, 1080)).toBe('16:9');
    expect(resolveClosestVideoRatioId(1440, 1080)).toBe('4:3');
    expect(resolveClosestVideoRatioId(1080, 1080)).toBe('1:1');
    expect(resolveClosestVideoRatioId(undefined, 1080)).toBe('9:16');
  });

  it('classifies supported uploaded video ratios and rejects unsupported families', () => {
    expect(resolveSupportedUploadRatioId(1080, 1080)).toBe('1:1');
    expect(resolveSupportedUploadRatioId(1440, 1080)).toBe('4:3');
    expect(resolveSupportedUploadRatioId(1920, 1080)).toBe('16:9');
    expect(resolveSupportedUploadRatioId(1080, 1920)).toBe('9:16');
    expect(resolveSupportedUploadRatioId(1910, 1080)).toBe('16:9');
    expect(resolveSupportedUploadRatioId(1088, 1920)).toBe('9:16');
    expect(resolveSupportedUploadRatioId(1620, 1080)).toBeNull();
    expect(resolveSupportedUploadRatioId(2390, 1000)).toBeNull();
    expect(resolveSupportedUploadRatioId(1000, 1600)).toBeNull();
    expect(resolveSupportedUploadRatioId(undefined, 1080)).toBeNull();
    expect(SUPPORTED_UPLOAD_RATIO_TOLERANCE).toBe(0.02);
  });

  it('centers the crop rect for the selected ratio', () => {
    expect(resolveCropRect(300, 500, '9:16')).toEqual({
      x: 9.375,
      y: 0,
      width: 281.25,
      height: 500,
    });

    expect(resolveCropRect(500, 300, '1:1')).toEqual({
      x: 100,
      y: 0,
      width: 300,
      height: 300,
    });
  });

  it('clamps crop transforms to keep the frame covered', () => {
    const cropRect = resolveCropRect(320, 568, '9:16');
    const transform = clampVideoTransform(
      {
        scale: 99,
        translateX: 2_000,
        translateY: -2_000,
      },
      {
        width: 1080,
        height: 1920,
      },
      cropRect
    );

    expect(transform.scale).toBeLessThanOrEqual(6);
    expect(transform.translateX).toBeLessThanOrEqual(1_000);
    expect(transform.translateY).toBeLessThanOrEqual(0);
    expect(transform.translateY).toBeGreaterThan(-2_000);
  });

  it('derives a stable source crop for export', () => {
    const cropRect = resolveCropRect(320, 568, '9:16');
    const crop = resolveSourceCrop(
      {
        width: 1920,
        height: 1080,
      },
      cropRect,
      {
        scale: 1.5,
        translateX: 40,
        translateY: -20,
      }
    );

    expect(crop.cropWidth).toBeGreaterThan(0);
    expect(crop.cropHeight).toBeGreaterThan(0);
    expect(crop.cropX).toBeGreaterThanOrEqual(0);
    expect(crop.cropY).toBeGreaterThanOrEqual(0);
    expect(crop.cropX + crop.cropWidth).toBeLessThanOrEqual(1920);
    expect(crop.cropY + crop.cropHeight).toBeLessThanOrEqual(1080);
  });

  it('caps moderation sampling at ten frames', () => {
    expect(resolveModerationFrameCount(1_000)).toBe(2);
    expect(resolveModerationFrameCount(12_000)).toBe(10);
    expect(resolveModerationFrameCount(60_000)).toBe(10);
  });

  it('creates the default transform state', () => {
    expect(createDefaultVideoTransform()).toEqual({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  });
});
