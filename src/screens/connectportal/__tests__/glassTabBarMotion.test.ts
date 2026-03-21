import { getConnectGlassTabTransition } from '../glassTabBarMotion';

describe('getConnectGlassTabTransition', () => {
  it('creates a rightward surge that stretches past the destination edge', () => {
    const transition = getConnectGlassTabTransition({
      fromLayout: { x: 0, width: 60 },
      toLayout: { x: 72, width: 52 },
      shellWidth: 140,
    });

    expect(transition.movingRight).toBe(true);
    expect(transition.initialX).toBe(0);
    expect(transition.initialWidth).toBe(60);
    expect(transition.surgeX).toBe(0);
    expect(transition.surgeWidth).toBeGreaterThan(124);
    expect(transition.surgeWidth).toBeLessThanOrEqual(140);
    expect(transition.settleX).toBe(72);
    expect(transition.settleWidth).toBe(52);
  });

  it('creates a leftward surge that pulls the leading edge leftward', () => {
    const transition = getConnectGlassTabTransition({
      fromLayout: { x: 86, width: 48 },
      toLayout: { x: 24, width: 56 },
      shellWidth: 160,
    });

    expect(transition.movingRight).toBe(false);
    expect(transition.surgeX).toBeLessThan(24);
    expect(transition.surgeWidth).toBeGreaterThan(110);
    expect(transition.settleX).toBe(24);
    expect(transition.settleWidth).toBe(56);
  });

  it('returns a no-op when the visual pill is already aligned', () => {
    const transition = getConnectGlassTabTransition({
      fromLayout: { x: 48, width: 62 },
      toLayout: { x: 48, width: 62 },
      shellWidth: 180,
    });

    expect(transition.isNoOp).toBe(true);
    expect(transition.surgeX).toBe(48);
    expect(transition.surgeWidth).toBe(62);
    expect(transition.settleX).toBe(48);
    expect(transition.settleWidth).toBe(62);
  });

  it('clamps the surge inside the shell width', () => {
    const transition = getConnectGlassTabTransition({
      fromLayout: { x: 78, width: 42 },
      toLayout: { x: 116, width: 40 },
      shellWidth: 148,
    });

    expect(transition.surgeX).toBeGreaterThanOrEqual(0);
    expect(transition.surgeX + transition.surgeWidth).toBeLessThanOrEqual(148);
  });
});
