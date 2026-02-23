import { formatAspectRatioLabel, getVideoFitSize, isSuccessfulStatus } from '../videoPostUtils';

describe('videoPostUtils', () => {
  describe('isSuccessfulStatus', () => {
    it('returns true for 2xx status codes', () => {
      expect(isSuccessfulStatus(200)).toBe(true);
      expect(isSuccessfulStatus(204)).toBe(true);
      expect(isSuccessfulStatus(299)).toBe(true);
    });

    it('returns false for non-2xx status codes', () => {
      expect(isSuccessfulStatus(199)).toBe(false);
      expect(isSuccessfulStatus(300)).toBe(false);
      expect(isSuccessfulStatus(undefined)).toBe(false);
    });
  });

  describe('getVideoFitSize', () => {
    it('fits a portrait video within the preview box', () => {
      const fitted = getVideoFitSize(360, 640, 9 / 16);
      expect(fitted.height).toBeLessThanOrEqual(640);
      expect(fitted.width).toBeLessThanOrEqual(360);
      expect(Number((fitted.width / fitted.height).toFixed(4))).toBe(Number((9 / 16).toFixed(4)));
    });

    it('falls back to a safe ratio when ratio is invalid', () => {
      const fitted = getVideoFitSize(300, 300, 0);
      expect(fitted.width).toBe(300);
      expect(Number(fitted.ratio.toFixed(4))).toBe(Number((16 / 9).toFixed(4)));
    });
  });

  describe('formatAspectRatioLabel', () => {
    it('prefers simplified natural-size labels', () => {
      expect(formatAspectRatioLabel(1080, 1920, 1080 / 1920)).toBe('9:16');
      expect(formatAspectRatioLabel(1920, 1080, 1920 / 1080)).toBe('16:9');
    });

    it('falls back to decimal ratio format when dimensions are unavailable', () => {
      expect(formatAspectRatioLabel(undefined, undefined, 1.25)).toBe('1.25:1');
      expect(formatAspectRatioLabel(undefined, undefined, 9 / 16)).toBe('1:1.78');
    });
  });
});
