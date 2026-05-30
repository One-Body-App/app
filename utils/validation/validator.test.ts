import validator from './validator';

describe('validator', () => {
  it('returns the configured presence message for empty values', async () => {
    await expect(validator('email', '')).resolves.toBe('Please enter an email address');
  });

  it('validates matching fields for equality rules', async () => {
    await expect(
      validator('cPassword', 'different', {
        password: 'secret123',
      })
    ).resolves.toBe('The Confirmation must match the Password');
  });

  it('accepts valid URL values for optional website fields', async () => {
    await expect(validator('website', 'https://onebody.example')).resolves.toBeNull();
  });
});
