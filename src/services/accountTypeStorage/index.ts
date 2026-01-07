import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNT_TYPE_KEY = '@onebody:pendingAccountType';

export const savePendingAccountType = async (type?: string | null) => {
  try {
    if (!type) {
      await AsyncStorage.removeItem(ACCOUNT_TYPE_KEY);
      return;
    }
    await AsyncStorage.setItem(ACCOUNT_TYPE_KEY, type);
  } catch (error) {
    console.warn('[AccountTypeStorage] failed to save account type', error);
  }
};

export const loadPendingAccountType = async () => {
  try {
    return await AsyncStorage.getItem(ACCOUNT_TYPE_KEY);
  } catch (error) {
    console.warn('[AccountTypeStorage] failed to load account type', error);
    return null;
  }
};

export const clearPendingAccountType = async () => {
  try {
    await AsyncStorage.removeItem(ACCOUNT_TYPE_KEY);
  } catch (error) {
    console.warn('[AccountTypeStorage] failed to clear account type', error);
  }
};
