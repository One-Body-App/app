import { getCreatorMenuLabel, getCreatorMenuState, hasCreatorSettings } from './creatorApplication';

describe('creatorApplication', () => {
  it('returns apply state when there is no creator profile', () => {
    expect(hasCreatorSettings(undefined)).toBe(false);
    expect(getCreatorMenuState(undefined)).toBe('apply');
    expect(getCreatorMenuLabel(undefined)).toBe('Become a Creator');
  });

  it('returns apply state for rejected creator profiles', () => {
    expect(hasCreatorSettings('rejected')).toBe(false);
    expect(getCreatorMenuState('rejected')).toBe('apply');
    expect(getCreatorMenuLabel('rejected')).toBe('Become a Creator');
  });

  it('returns apply state for coaching creator profiles', () => {
    expect(hasCreatorSettings('coaching')).toBe(false);
    expect(getCreatorMenuState('coaching')).toBe('apply');
    expect(getCreatorMenuLabel('coaching')).toBe('Become a Creator');
  });

  it('returns settings state for pending creator profiles', () => {
    expect(hasCreatorSettings('pending')).toBe(true);
    expect(getCreatorMenuState('pending')).toBe('settings');
    expect(getCreatorMenuLabel('pending')).toBe('Creator Settings');
  });

  it('returns settings state for approved creator profiles', () => {
    expect(hasCreatorSettings('approved')).toBe(true);
    expect(getCreatorMenuState('approved')).toBe('settings');
    expect(getCreatorMenuLabel('approved')).toBe('Creator Settings');
  });
});
