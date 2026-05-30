export type CreatorMenuState = 'apply' | 'settings';

export const hasCreatorSettings = (status?: string | null) =>
  status === 'approved' || status === 'pending';

export const getCreatorMenuState = (status?: string | null): CreatorMenuState =>
  hasCreatorSettings(status) ? 'settings' : 'apply';

export const getCreatorMenuLabel = (status?: string | null) =>
  getCreatorMenuState(status) === 'settings' ? 'Creator Settings' : 'Become a Creator';
