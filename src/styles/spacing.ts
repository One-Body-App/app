type Spacing =
  | 'x2'
  | 'x4'
  | 'x5'
  | 'x6'
  | 'x8'
  | 'x10'
  | 'x12'
  | 'x13'
  | 'x16'
  | 'x17'
  | 'x20'
  | 'x24'
  | 'x30'
  | 'x32'
  | 'x48'
  | 'x60'
  | 'x64'
  | 'x72'
  | 'x88'
  | 'x104';

// eslint-disable-next-line import/prefer-default-export
export const spacing: Record<Spacing, number> = {
  x2: 2,
  x4: 4,
  x5: 5,
  x6: 6,
  x8: 8,
  x10: 10,
  x12: 12,
  x13: 13,
  x16: 16,
  x17: 17,
  x20: 20,
  x24: 24,
  x30: 30,
  x32: 32,
  x48: 48,
  x60: 60,
  x64: 64,
  x72: 72,
  x88: 88,
  x104: 104,
};
