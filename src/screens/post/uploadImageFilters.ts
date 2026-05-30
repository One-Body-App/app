import {
  brightness,
  concatColorMatrices,
  contrast,
  cool,
  kodachrome,
  normal,
  polaroid,
  saturate,
  technicolor,
  type Matrix,
  vintage,
  warm,
} from 'react-native-color-matrix-image-filters';

export type UploadImageFilterId =
  | 'original'
  | 'clarendon'
  | 'gingham'
  | 'moon'
  | 'lark'
  | 'reyes'
  | 'juno'
  | 'slumber'
  | 'crema'
  | 'toaster'
  | 'brooklyn'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'polaroid'
  | 'kodachrome'
  | 'technicolor';

export type UploadImageAdjustPresetId = 'none' | 'lift' | 'depth' | 'vivid';

type FilterPreset = {
  id: UploadImageFilterId;
  label: string;
  matrix: Matrix;
};

type AdjustPreset = {
  id: UploadImageAdjustPresetId;
  label: string;
};

const asMatrix = (values: number[]): Matrix => values as Matrix;

export const IDENTITY_COLOR_MATRIX = normal();

const SOCIAL_FILTER_MATRICES: Record<
  Exclude<
    UploadImageFilterId,
    'original' | 'warm' | 'cool' | 'vintage' | 'polaroid' | 'kodachrome' | 'technicolor'
  >,
  Matrix
> = {
  clarendon: asMatrix([
    1.27, -0.11, -0.11, 0, 15.3, -0.11, 1.27, -0.11, 0, 15.3, -0.11, -0.11, 1.27, 0, 15.3, 0, 0, 0,
    1, 0,
  ]),
  gingham: asMatrix([
    0.8, 0.1, 0.1, 0, 20.4, 0.1, 0.8, 0.1, 0, 20.4, 0.1, 0.1, 0.8, 0, 20.4, 0, 0, 0, 1, 0,
  ]),
  moon: asMatrix([
    0.28, 0.85, 0.12, 0, 0, 0.28, 0.85, 0.12, 0, 0, 0.28, 0.85, 0.12, 0, 0, 0, 0, 0, 1, 0,
  ]),
  lark: asMatrix([
    0.9, 0.1, 0.1, 0, 15.3, 0.1, 1.1, 0.1, 0, 15.3, 0.1, 0.1, 1.1, 0, 15.3, 0, 0, 0, 1, 0,
  ]),
  reyes: asMatrix([
    1.1, 0.1, -0.1, 0, 15.3, 0.1, 1, 0.1, 0, 10.2, -0.1, 0.1, 0.9, 0, 5.1, 0, 0, 0, 1, 0,
  ]),
  juno: asMatrix([
    1.2, 0.1, 0.1, 0, 10.2, 0.1, 1.1, 0.1, 0, 10.2, 0.1, 0.1, 0.9, 0, 0, 0, 0, 0, 1, 0,
  ]),
  slumber: asMatrix([
    0.9, 0.1, 0.1, 0, 10.2, 0.1, 0.8, 0.1, 0, 5.1, 0.1, 0.1, 0.7, 0, 0, 0, 0, 0, 1, 0,
  ]),
  crema: asMatrix([
    1.05, 0.05, -0.1, 0, 15.3, 0.05, 1.05, 0.05, 0, 15.3, -0.1, 0.05, 1.05, 0, 15.3, 0, 0, 0, 1, 0,
  ]),
  toaster: asMatrix([1.2, 0.2, 0, 0, 25.5, 0.2, 1, 0, 0, 10.2, 0, 0, 0.8, 0, -10.2, 0, 0, 0, 1, 0]),
  brooklyn: asMatrix([1, 0.1, 0.1, 0, 0, 0.1, 1.1, 0.1, 0, 0, 0.1, 0.1, 1, 0, 0, 0, 0, 0, 1, 0]),
};

export const UPLOAD_IMAGE_FILTERS: readonly FilterPreset[] = [
  { id: 'original', label: 'Original', matrix: IDENTITY_COLOR_MATRIX },
  { id: 'clarendon', label: 'Clarendon', matrix: SOCIAL_FILTER_MATRICES.clarendon },
  { id: 'gingham', label: 'Gingham', matrix: SOCIAL_FILTER_MATRICES.gingham },
  { id: 'moon', label: 'Moon', matrix: SOCIAL_FILTER_MATRICES.moon },
  { id: 'lark', label: 'Lark', matrix: SOCIAL_FILTER_MATRICES.lark },
  { id: 'reyes', label: 'Reyes', matrix: SOCIAL_FILTER_MATRICES.reyes },
  { id: 'juno', label: 'Juno', matrix: SOCIAL_FILTER_MATRICES.juno },
  { id: 'slumber', label: 'Slumber', matrix: SOCIAL_FILTER_MATRICES.slumber },
  { id: 'crema', label: 'Crema', matrix: SOCIAL_FILTER_MATRICES.crema },
  { id: 'toaster', label: 'Toaster', matrix: SOCIAL_FILTER_MATRICES.toaster },
  { id: 'brooklyn', label: 'Brooklyn', matrix: SOCIAL_FILTER_MATRICES.brooklyn },
  { id: 'warm', label: 'Warm', matrix: warm() },
  { id: 'cool', label: 'Cool', matrix: cool() },
  { id: 'vintage', label: 'Vintage', matrix: vintage() },
  { id: 'polaroid', label: 'Polaroid', matrix: polaroid() },
  { id: 'kodachrome', label: 'Kodachrome', matrix: kodachrome() },
  { id: 'technicolor', label: 'Technicolor', matrix: technicolor() },
] as const;

export const UPLOAD_IMAGE_ADJUST_OPTIONS: readonly AdjustPreset[] = [
  { id: 'none', label: 'Reset' },
  { id: 'lift', label: 'Lift' },
  { id: 'depth', label: 'Depth' },
  { id: 'vivid', label: 'Vivid' },
] as const;

const FILTER_MATRIX_BY_ID: Readonly<Record<UploadImageFilterId, Matrix>> = Object.freeze(
  Object.fromEntries(UPLOAD_IMAGE_FILTERS.map((filter) => [filter.id, filter.matrix])) as Record<
    UploadImageFilterId,
    Matrix
  >
);

const ADJUST_MATRIX_BY_ID: Readonly<Record<UploadImageAdjustPresetId, Matrix>> = Object.freeze({
  none: IDENTITY_COLOR_MATRIX,
  lift: concatColorMatrices(brightness(1.06), contrast(1.02)),
  depth: concatColorMatrices(contrast(1.14), saturate(0.95)),
  vivid: concatColorMatrices(saturate(1.2), contrast(1.06)),
});

const COMPOSED_MATRIX_BY_FILTER_AND_ADJUST: Readonly<
  Record<UploadImageFilterId, Readonly<Record<UploadImageAdjustPresetId, Matrix>>>
> = Object.freeze(
  Object.fromEntries(
    UPLOAD_IMAGE_FILTERS.map(({ id }) => [
      id,
      Object.freeze(
        Object.fromEntries(
          UPLOAD_IMAGE_ADJUST_OPTIONS.map(({ id: adjustId }) => {
            if (adjustId === 'none') {
              return [adjustId, FILTER_MATRIX_BY_ID[id]];
            }
            if (id === 'original') {
              return [adjustId, ADJUST_MATRIX_BY_ID[adjustId]];
            }
            return [
              adjustId,
              concatColorMatrices(FILTER_MATRIX_BY_ID[id], ADJUST_MATRIX_BY_ID[adjustId]),
            ];
          })
        ) as Record<UploadImageAdjustPresetId, Matrix>
      ),
    ])
  ) as Record<UploadImageFilterId, Record<UploadImageAdjustPresetId, Matrix>>
);

export const resolveUploadImageFilterMatrix = (filterId: UploadImageFilterId): Matrix =>
  FILTER_MATRIX_BY_ID[filterId] ?? IDENTITY_COLOR_MATRIX;

export const resolveUploadImageAdjustMatrix = (adjustId: UploadImageAdjustPresetId): Matrix => {
  return ADJUST_MATRIX_BY_ID[adjustId] ?? IDENTITY_COLOR_MATRIX;
};

export const buildUploadImageColorMatrix = (
  filterId: UploadImageFilterId,
  adjustId: UploadImageAdjustPresetId
): Matrix => COMPOSED_MATRIX_BY_FILTER_AND_ADJUST[filterId]?.[adjustId] ?? IDENTITY_COLOR_MATRIX;
