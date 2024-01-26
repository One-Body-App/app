import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

function ActivityIndicatorContent({
  animating,
  size,
  style,
}: {
  animating?: boolean;
  size?: 'small' | 'large' | number;
  style?: StyleProp<ViewStyle>;
}) {
  const { dark } = useTheme();
  return (
    <ActivityIndicator
      animating={animating}
      size={size}
      color={dark ? '#12D2D9' : 'rgba(18, 107, 135, 1)'}
      style={style}
    />
  );
}
export default ActivityIndicatorContent;
