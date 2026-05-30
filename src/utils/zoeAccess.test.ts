import { isAdminTierRole, isZoeAiEligibleUser } from './zoeAccess';

describe('zoeAccess', () => {
  it('allows admin users', () => {
    expect(isAdminTierRole('admin')).toBe(true);
    expect(isZoeAiEligibleUser({ role: 'admin', influencerProfile: undefined })).toBe(true);
  });

  it('allows super admins', () => {
    expect(isAdminTierRole('superAdmin')).toBe(true);
    expect(isZoeAiEligibleUser({ role: 'superAdmin', influencerProfile: undefined })).toBe(true);
  });

  it('allows approved creators with a regular user role', () => {
    expect(
      isZoeAiEligibleUser({
        role: 'user',
        influencerProfile: {
          influencerStatus: 'approved',
        } as any,
      })
    ).toBe(true);
  });

  it('denies pending creators', () => {
    expect(
      isZoeAiEligibleUser({
        role: 'user',
        influencerProfile: {
          influencerStatus: 'pending',
        } as any,
      })
    ).toBe(false);
  });

  it('denies rejected and coaching creators', () => {
    expect(
      isZoeAiEligibleUser({
        role: 'user',
        influencerProfile: {
          influencerStatus: 'rejected',
        } as any,
      })
    ).toBe(false);
    expect(
      isZoeAiEligibleUser({
        role: 'user',
        influencerProfile: {
          influencerStatus: 'coaching',
        } as any,
      })
    ).toBe(false);
  });

  it('denies regular users with no approved creator status', () => {
    expect(isZoeAiEligibleUser({ role: 'user', influencerProfile: undefined })).toBe(false);
    expect(isZoeAiEligibleUser(undefined)).toBe(false);
  });
});
