import { getRootTabTransitionDirection, isAnimatedRootTabName } from '../rootTabTransition';

describe('rootTabTransition', () => {
  it('resolves leftward destination motion when moving to a tab on the right', () => {
    expect(getRootTabTransitionDirection('HomeTab', 'ExploreTab')).toBe('left');
    expect(getRootTabTransitionDirection('ExploreTab', 'ConnectTab')).toBe('left');
  });

  it('resolves rightward destination motion when moving to a tab on the left', () => {
    expect(getRootTabTransitionDirection('Messages', 'HomeTab')).toBe('right');
    expect(getRootTabTransitionDirection('ConnectTab', 'ExploreTab')).toBe('right');
  });

  it('returns no transition for the same tab or excluded tabs', () => {
    expect(getRootTabTransitionDirection('HomeTab', 'HomeTab')).toBe('none');
    expect(getRootTabTransitionDirection('PostTab', 'HomeTab')).toBe('none');
    expect(getRootTabTransitionDirection('HomeTab', 'MyProfileTab')).toBe('none');
    expect(isAnimatedRootTabName('PostTab')).toBe(false);
  });
});
