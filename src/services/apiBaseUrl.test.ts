import { normalizeApiBaseUrl } from './apiBaseUrl';

describe('normalizeApiBaseUrl', () => {
  it('adds the API prefix when the configured value is only an origin', () => {
    expect(normalizeApiBaseUrl('https://stagingapi.onebodyapp.com')).toBe(
      'https://stagingapi.onebodyapp.com/api'
    );
    expect(normalizeApiBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000/api');
  });

  it('preserves configured paths that already include the API prefix', () => {
    expect(normalizeApiBaseUrl('https://stagingapi.onebodyapp.com/api')).toBe(
      'https://stagingapi.onebodyapp.com/api'
    );
    expect(normalizeApiBaseUrl('https://stagingapi.onebodyapp.com/api/')).toBe(
      'https://stagingapi.onebodyapp.com/api'
    );
  });

  it('leaves empty and custom path values alone', () => {
    expect(normalizeApiBaseUrl('')).toBe('');
    expect(normalizeApiBaseUrl('https://example.com/custom')).toBe('https://example.com/custom');
  });
});
