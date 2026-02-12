/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import { name as appName } from './app.json';

if (typeof process !== 'undefined') {
  process.env = process.env || {};
  if (typeof process.env.EXPO_OS === 'undefined') {
    process.env.EXPO_OS = Platform.OS;
  }
}

const App = require('./App').default;

AppRegistry.registerComponent(appName, () => App);
