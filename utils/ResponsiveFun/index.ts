import {StatusBar, PixelRatio, Dimensions, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
const {height, width} = Dimensions.get('window');
export function isIphoneX() {
  return Platform.OS === 'ios' && DeviceInfo.hasNotch();
}

export function getHeight(h) {
  const elemHeight = parseFloat(h);
  return PixelRatio.roundToNearestPixel((height * elemHeight) / 100);
}
export function getWidth(w) {
  const elemWidth = parseFloat(w);
  return PixelRatio.roundToNearestPixel((width * elemWidth) / 100);
}
export function getFontSize(font) {
  const deviceHeight = isIphoneX()
    ? height * 0.9
    : Platform.OS === 'android'
    ? height - StatusBar.currentHeight
    : height;
  const deviceHeightPercent = (font * deviceHeight) / 100;
  return Math.round(deviceHeightPercent);
}
export function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + ' years';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes';
  }
  return Math.floor(seconds) + ' seconds';
}
