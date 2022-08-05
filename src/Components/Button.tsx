import React from 'react';
import {Text, TouchableOpacity} from 'react-native';

const Button = ({
  text,
  leftIcon,
  RightIcon,
  btnTextStyle,
  btnStyle,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => (onPress ? onPress() : console.log('null'))}
      style={btnStyle}>
      {leftIcon}
      <Text style={[btnTextStyle]}>{text}</Text>
      {RightIcon}
    </TouchableOpacity>
  );
};
export default Button;
