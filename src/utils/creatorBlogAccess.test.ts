import isCreatorBlogEligible from './creatorBlogAccess';

describe('isCreatorBlogEligible', () => {
  it('allows explicit creator roles', () => {
    expect(isCreatorBlogEligible({ role: 'creator', influencerProfile: undefined } as any)).toBe(
      true
    );
  });

  it('allows approved influencer profiles', () => {
    expect(
      isCreatorBlogEligible({
        role: 'user',
        influencerProfile: { influencerStatus: 'approved' },
      } as any)
    ).toBe(true);
  });

  it('denies non-creators', () => {
    expect(
      isCreatorBlogEligible({
        role: 'user',
        influencerProfile: { influencerStatus: 'pending' },
      } as any)
    ).toBe(false);
  });
});
