import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const GoBackIcon = ({ color, goBack }: { color: string; goBack?: () => void }) => {
  const navigation = useNavigation();
  if (!navigation.canGoBack) {
    return null;
  }
  return (
    <TouchableOpacity onPress={() => goBack ?? navigation.goBack()}>
      <Icon name="chevron-back" size={20} color={color} />
    </TouchableOpacity>
  );
};

export default GoBackIcon;
