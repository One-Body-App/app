import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';

function GoBackIcon({
  color,
  goBack,
  style,
}: {
  color: string;
  goBack?: () => void;
  style?: ViewStyle;
}) {
  const navigation = useNavigation();
  if (!navigation.canGoBack) {
    return null;
  }
  return (
    <TouchableOpacity onPress={() => goBack ?? navigation.goBack()} style={style}>
      <Icon name="chevron-back" size={20} color={color} />
    </TouchableOpacity>
  );
}

export default GoBackIcon;
