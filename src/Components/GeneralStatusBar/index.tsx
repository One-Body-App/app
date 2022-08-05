import React from 'react';
import {View, StatusBar, Platform} from 'react-native';
import styles from './styles';
const GeneralStatusBar = ({backgroundColor, ...props}) => (
  <View
    style={[
      Platform.OS === 'ios' ? styles.statusBar : styles.statusBar,
      {backgroundColor},
    ]}>
    <StatusBar translucent backgroundColor={backgroundColor} {...props} />
  </View>
);
export default GeneralStatusBar;
