import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_LOGIN_MFA_KEY = '@onebody:pendingLoginMfa';

export async function markPendingLoginMfa(): Promise<void> {
  await AsyncStorage.setItem(PENDING_LOGIN_MFA_KEY, String(Date.now()));
}

export async function hasPendingLoginMfa(): Promise<boolean> {
  const value = await AsyncStorage.getItem(PENDING_LOGIN_MFA_KEY);
  return Boolean(value);
}

export async function clearPendingLoginMfa(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_LOGIN_MFA_KEY);
}
