export type ConnectGlassTabLayout = {
  x: number;
  width: number;
};

export type ConnectGlassTabTransition = {
  isNoOp: boolean;
  movingRight: boolean;
  initialX: number;
  initialWidth: number;
  surgeX: number;
  surgeWidth: number;
  settleX: number;
  settleWidth: number;
};

type ConnectGlassTabTransitionParams = {
  fromLayout: ConnectGlassTabLayout;
  toLayout: ConnectGlassTabLayout;
  shellWidth?: number;
  maxSurgeExtra?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const sanitizeLayout = (layout: ConnectGlassTabLayout): ConnectGlassTabLayout => ({
  x: Math.max(0, layout.x),
  width: Math.max(0, layout.width),
});

export const getConnectGlassTabTransition = ({
  fromLayout,
  toLayout,
  shellWidth,
  maxSurgeExtra = 30,
}: ConnectGlassTabTransitionParams): ConnectGlassTabTransition => {
  const safeFrom = sanitizeLayout(fromLayout);
  const safeTo = sanitizeLayout(toLayout);
  const movingRight = safeTo.x > safeFrom.x;
  const isNoOp = safeFrom.x === safeTo.x && safeFrom.width === safeTo.width;

  if (isNoOp) {
    return {
      isNoOp: true,
      movingRight,
      initialX: safeFrom.x,
      initialWidth: safeFrom.width,
      surgeX: safeTo.x,
      surgeWidth: safeTo.width,
      settleX: safeTo.x,
      settleWidth: safeTo.width,
    };
  }

  const fromRight = safeFrom.x + safeFrom.width;
  const toRight = safeTo.x + safeTo.width;
  const spanLeft = Math.min(safeFrom.x, safeTo.x);
  const spanRight = Math.max(fromRight, toRight);
  const centerDistance = Math.abs(safeTo.x + safeTo.width / 2 - (safeFrom.x + safeFrom.width / 2));
  const surgeExtra = clamp(centerDistance * 0.22, 10, maxSurgeExtra);

  let surgeLeft = movingRight ? spanLeft : spanLeft - surgeExtra;
  let surgeRight = movingRight ? spanRight + surgeExtra : spanRight;

  if (typeof shellWidth === 'number' && shellWidth > 0) {
    surgeLeft = clamp(surgeLeft, 0, shellWidth);
    surgeRight = clamp(surgeRight, 0, shellWidth);
  } else {
    surgeLeft = Math.max(0, surgeLeft);
  }

  const surgeWidth = Math.max(safeFrom.width, safeTo.width, Math.max(0, surgeRight - surgeLeft));

  return {
    isNoOp: false,
    movingRight,
    initialX: safeFrom.x,
    initialWidth: safeFrom.width,
    surgeX: surgeLeft,
    surgeWidth,
    settleX: safeTo.x,
    settleWidth: safeTo.width,
  };
};
