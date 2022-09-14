import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';

const GoBackIcon = ({ color }: { color: string }) => {
  const navigation = useNavigation();
  if (!navigation.canGoBack) {
    return null;
  }
  return (
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.header}>
      <Icon name="chevron-back" style={{ margin: getFontSize(3) }} size={20} color={color} />
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: getHeight(4),
  },
});

export default GoBackIcon;
