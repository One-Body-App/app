import { StatusBar, PixelRatio, Dimensions, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
const { height, width } = Dimensions.get('window');
export function isIphoneX() {
  return (Platform.OS === 'ios' && DeviceInfo.hasNotch()) || DeviceInfo.hasDynamicIsland();
}

export function getHeight(elemHeight: number) {
  return PixelRatio.roundToNearestPixel((height * elemHeight) / 100);
}
export function getWidth(elemWidth: number) {
  return PixelRatio.roundToNearestPixel((width * elemWidth) / 100);
}
export function getFontSize(font: number) {
  const deviceHeight = isIphoneX()
    ? height * 0.9
    : Platform.OS === 'android'
    ? height - (StatusBar.currentHeight ?? 0)
    : height;
  const deviceHeightPercent = (font * deviceHeight) / 100;
  return Math.round(deviceHeightPercent);
}
export function timeSince(date: Date) {
  var seconds = Math.floor((new Date().valueOf() - new Date(date).valueOf()) / 1000);

  var interval = seconds / 31536000;

  const addPlural = (interval: number) => {
    return interval >= 2 ? 's' : '';
  };

  if (interval > 1) {
    return Math.floor(interval) + ' years';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' month' + addPlural(interval);
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' day' + addPlural(interval);
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hour' + addPlural(interval);
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minute' + addPlural(interval);
  }
  return Math.floor(seconds) + ' second' + addPlural(interval);
}
