import { StyleSheet, Platform, StatusBar } from 'react-native';
import DeviceInfo from 'react-native-device-info';
// console.log('device info', DeviceInfo.hasNotch());
// console.log('Platform', Platform.OS);
// console.log('height', StatusBar.currentHeight);

const STATUSBAR_HEIGHT =
  Platform.OS === 'ios'
    ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
      ? 45
      : 25
    : StatusBar.currentHeight;
export default StyleSheet.create({
  statusBar: {
    height: STATUSBAR_HEIGHT,
  },
});
