import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View, StatusBar, StatusBarStyle } from 'react-native';
import styles from './styles';
const GeneralStatusBar = ({
  backgroundColor,
  translucent,
  barStyle,
  hidden,
}: {
  backgroundColor?: string;
  translucent?: boolean;
  barStyle?: StatusBarStyle;
  hidden: boolean;
}) => {
  const { dark } = useTheme();

  return (
    <View style={[styles.statusBar, { backgroundColor }]}>
      <StatusBar
        translucent={translucent}
        backgroundColor={backgroundColor}
        barStyle={barStyle ?? dark ? 'light-content' : 'dark-content'}
        hidden={hidden}
      />
    </View>
  );
};

export default GeneralStatusBar;
