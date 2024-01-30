type Spacing =
  | 'x5'
  | 'x8'
  | 'x10'
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

export const spacing: Record<Spacing, number> = {
  x5: 5,
  x8: 8,
  x10: 10,
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
