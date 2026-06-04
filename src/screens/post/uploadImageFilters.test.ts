import {
  buildUploadImageColorMatrix,
  IDENTITY_COLOR_MATRIX,
  resolveUploadImageAdjustMatrix,
  resolveUploadImageFilterMatrix,
  UPLOAD_IMAGE_FILTERS,
} from './uploadImageFilters';

jest.mock('react-native-color-matrix-image-filters', () => {
  const filters = jest.requireActual('rn-color-matrices').default;
  const { concatColorMatrices: actualConcatColorMatrices } =
    jest.requireActual('concat-color-matrices');

  return {
    concatColorMatrices: (...matrices: number[][]) => actualConcatColorMatrices(matrices),
    brightness: filters.brightness,
    contrast: filters.contrast,
    cool: filters.cool,
    kodachrome: filters.kodachrome,
    normal: filters.normal,
    polaroid: filters.polaroid,
    saturate: filters.saturate,
    technicolor: filters.technicolor,
    vintage: filters.vintage,
    warm: filters.warm,
  };
});

describe('uploadImageFilters', () => {
  it('ships the expected filter tray order', () => {
    expect(UPLOAD_IMAGE_FILTERS.map((filter) => filter.label)).toEqual([
      'Original',
      'Clarendon',
      'Gingham',
      'Moon',
      'Lark',
      'Reyes',
      'Juno',
      'Slumber',
      'Crema',
      'Toaster',
      'Brooklyn',
      'Warm',
      'Cool',
      'Vintage',
      'Polaroid',
      'Kodachrome',
      'Technicolor',
    ]);
  });

  it('exposes 20-value matrices for every filter', () => {
    UPLOAD_IMAGE_FILTERS.forEach((filter) => {
      expect(filter.matrix).toHaveLength(20);
      expect(filter.matrix.every((value) => Number.isFinite(value))).toBe(true);
    });
  });

  it('keeps Original as the identity matrix', () => {
    expect(resolveUploadImageFilterMatrix('original')).toEqual([
      1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
    ]);
    expect(buildUploadImageColorMatrix('original', 'none')).toEqual(IDENTITY_COLOR_MATRIX);
  });

  it('maps package-backed built-ins to stable matrices', () => {
    expect(resolveUploadImageFilterMatrix('warm')).toEqual([
      1.06, 0, 0, 0, 0, 0, 1.01, 0, 0, 0, 0, 0, 0.93, 0, 0, 0, 0, 0, 1, 0,
    ]);
    expect(resolveUploadImageFilterMatrix('polaroid')).toEqual([
      1.438, -0.062, -0.062, 0, 0, -0.122, 1.378, -0.122, 0, 0, -0.016, -0.016, 1.483, 0, 0, 0, 0,
      0, 1, 0,
    ]);
  });

  it('builds 20-value adjust matrices and composed matrices', () => {
    expect(resolveUploadImageAdjustMatrix('lift')).toHaveLength(20);
    expect(resolveUploadImageAdjustMatrix('depth')).toHaveLength(20);
    expect(resolveUploadImageAdjustMatrix('vivid')).toHaveLength(20);

    const composed = buildUploadImageColorMatrix('clarendon', 'vivid');
    expect(composed).toHaveLength(20);
    expect(composed.every((value) => Number.isFinite(value))).toBe(true);
    expect(composed).not.toEqual(resolveUploadImageFilterMatrix('clarendon'));
  });
});
