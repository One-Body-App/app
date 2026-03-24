import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';

function GoBackIcon({
  color,
  goBack,
  style,
  size = 20,
  accessibilityLabel = 'Back',
}: {
  color: string;
  goBack?: () => void;
  style?: ViewStyle;
  size?: number;
  accessibilityLabel?: string;
}) {
  const navigation = useNavigation();
  if (!goBack && !navigation.canGoBack()) {
    return null;
  }
  return (
    <TouchableOpacity
      onPress={() => {
        if (goBack) {
          goBack();
          return;
        }

        navigation.goBack();
      }}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Icon name="chevron-back" size={size} color={color} />
    </TouchableOpacity>
  );
}

export default GoBackIcon;
