import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearPendingLoginMfa, hasPendingLoginMfa, markPendingLoginMfa } from './pendingLoginMfa';

describe('pendingLoginMfa', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists and clears a pending login MFA marker', async () => {
    await expect(hasPendingLoginMfa()).resolves.toBe(false);

    await markPendingLoginMfa();

    await expect(hasPendingLoginMfa()).resolves.toBe(true);

    await clearPendingLoginMfa();

    await expect(hasPendingLoginMfa()).resolves.toBe(false);
  });
});
