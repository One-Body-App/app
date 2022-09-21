import React from 'react';
import { View, StatusBar, StatusBarStyle } from 'react-native';
import styles from './styles';
const GeneralStatusBar = ({
  backgroundColor,
  translucent,
  barStyle,
  hidden,
}: {
  backgroundColor: string;
  translucent: boolean;
  barStyle: StatusBarStyle | undefined;
  hidden: boolean;
}) => (
  <View style={[styles.statusBar, { backgroundColor }]}>
    <StatusBar
      translucent={translucent}
      backgroundColor={backgroundColor}
      barStyle={barStyle}
      hidden={hidden}
    />
  </View>
);
export default GeneralStatusBar;
