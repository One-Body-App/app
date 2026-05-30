/* eslint react-hooks/exhaustive-deps: off */

import { useLayoutEffect, type EffectCallback } from 'react';

export default function useMountEffect(effect: EffectCallback): void {
  useLayoutEffect(effect, []);
}
