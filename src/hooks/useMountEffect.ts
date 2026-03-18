/* eslint react-hooks/exhaustive-deps: off */

import { useEffect, type EffectCallback } from 'react';

export default function useMountEffect(effect: EffectCallback): void {
  useEffect(effect, []);
}
