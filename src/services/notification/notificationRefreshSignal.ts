import { DeviceEventEmitter } from 'react-native';

export const NOTIFICATION_REFRESH_EVENT = 'onebody:notification:refresh';

export const emitNotificationRefresh = () => {
  DeviceEventEmitter.emit(NOTIFICATION_REFRESH_EVENT);
};

export const subscribeToNotificationRefresh = (handler: () => void) => {
  const sub = DeviceEventEmitter.addListener(NOTIFICATION_REFRESH_EVENT, handler);
  return () => sub.remove();
};
