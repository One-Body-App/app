/* eslint no-restricted-imports: off, no-restricted-properties: off, react-hooks/exhaustive-deps: off */

import { type DependencyList, type EffectCallback, useEffect } from 'react';

export default function useObservedEffect(effect: EffectCallback, deps?: DependencyList): void {
  useEffect(effect, deps);
}
