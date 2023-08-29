import { RootStackParamList } from '@/src/Navigation/types';
import { ACTIONS } from '../action-types';
import { SettingsStackParamsList } from '@/src/navigator/types';

export const comback = (data: Record<string, any>) => ({
  type: ACTIONS.COMEBACK,
  data,
});

export const setLoader = (data: boolean) => ({
  type: ACTIONS.SET_LOADER,
  data,
});

export const getPrayers = (data: string) => ({
  type: ACTIONS.GET_PRAYERS,
  data,
});

export const setPrayers = (data: Record<string, any>) => ({
  type: ACTIONS.SET_PRAYERS,
  data,
});
export const setPrayersLive = (data: Record<string, any>) => ({
  type: ACTIONS.SET_PRAYERS_Live,
  data,
});
export const setUserPrayers = (data: Record<string, any>) => ({
  type: ACTIONS.SET_USERPRAYERS,
  data,
});
export const setAccountType = (data: string) => ({
  type: ACTIONS.SET_ACCOUNTTYPE,
  data,
});
export const setAllSms = (data: Record<string, any>) => ({
  type: ACTIONS.SET_ALLSMS,
  data,
});
export const getChats = (data: Record<string, any>) => ({
  type: ACTIONS.GET_CHATS,
  data,
});
export const setChats = (data: Record<string, any>) => ({
  type: ACTIONS.SET_CHATS,
  data,
});
export const setFaqs = (data: Record<string, any>) => ({
  type: ACTIONS.SET_FAQS,
  data,
});

export const setLoginVerificationBackPage = (
  screen: keyof SettingsStackParamsList,
  params?: Record<string, string>
) => ({
  type: ACTIONS.SET_LOGIN_VERIFICATION_BACK_PAGE,
  data: {
    screen,
    params,
  },
});
