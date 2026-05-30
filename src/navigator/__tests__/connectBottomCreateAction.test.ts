import { resolveBottomTabCreateTarget } from '../connectBottomCreateAction';

describe('resolveBottomTabCreateTarget', () => {
  it('defaults to post when the focused root tab is not Connect', () => {
    expect(
      resolveBottomTabCreateTarget({
        index: 0,
        routes: [{ name: 'HomeTab' }],
      })
    ).toBe('post');
  });

  it('routes to Go creation when ConnectPortal is focused on Go', () => {
    expect(
      resolveBottomTabCreateTarget({
        index: 0,
        routes: [
          {
            name: 'ConnectTab',
            state: {
              index: 0,
              routes: [{ name: 'ConnectPortal', params: { initialTab: 'Go!' } }],
            },
          },
        ],
      })
    ).toBe('go');
  });

  it('routes to Serve creation when ConnectMap is focused on Serve', () => {
    expect(
      resolveBottomTabCreateTarget({
        index: 0,
        routes: [
          {
            name: 'ConnectTab',
            state: {
              index: 0,
              routes: [{ name: 'ConnectMap', params: { initialTab: 'Serve' } }],
            },
          },
        ],
      })
    ).toBe('serve');
  });

  it('keeps post creation for Places or missing tab params', () => {
    expect(
      resolveBottomTabCreateTarget({
        index: 0,
        routes: [
          {
            name: 'ConnectTab',
            state: {
              index: 0,
              routes: [{ name: 'ConnectPortal', params: { initialTab: 'Places' } }],
            },
          },
        ],
      })
    ).toBe('post');

    expect(
      resolveBottomTabCreateTarget({
        index: 0,
        routes: [
          {
            name: 'ConnectTab',
            state: {
              index: 0,
              routes: [{ name: 'ConnectMap' }],
            },
          },
        ],
      })
    ).toBe('post');
  });

  it('does not extend beyond the main Connect portal screens', () => {
    expect(
      resolveBottomTabCreateTarget({
        index: 0,
        routes: [
          {
            name: 'ConnectTab',
            state: {
              index: 0,
              routes: [{ name: 'ConnectGoEventDash' }],
            },
          },
        ],
      })
    ).toBe('post');
  });

  it('routes the dedicated Serve hub to serve creation', () => {
    expect(
      resolveBottomTabCreateTarget({
        index: 0,
        routes: [
          {
            name: 'ConnectTab',
            state: {
              index: 0,
              routes: [{ name: 'ConnectServeHome' }],
            },
          },
        ],
      })
    ).toBe('serve');
  });
});
