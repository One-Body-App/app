import React, { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

const Button = ({
  text,
  leftIcon,
  RightIcon,
  btnTextStyle,
  btnStyle,
  onPress,
  disabled,
}: {
  text: string;
  leftIcon?: ReactNode;
  RightIcon?: ReactNode;
  btnTextStyle?: StyleProp<TextStyle>;
  btnStyle?: StyleProp<ViewStyle>;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={(event) => (onPress ? onPress(event) : console.log('null'))}
      style={btnStyle}
      disabled={disabled}
    >
      {leftIcon}
      <Text style={[btnTextStyle]}>{text}</Text>
      {RightIcon}
    </TouchableOpacity>
  );
};
export default Button;
