import React, { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
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
  disabledBtnStyle,
  disabledBtnTextStyle,
  wrapperBtnStyle,
}: {
  text: string;
  leftIcon?: ReactNode;
  RightIcon?: ReactNode;
  btnTextStyle?: StyleProp<TextStyle>;
  btnStyle?: StyleProp<ViewStyle>;
  disabledBtnStyle?: StyleProp<ViewStyle>;
  wrapperBtnStyle?: StyleProp<ViewStyle>;
  disabledBtnTextStyle?: StyleProp<TextStyle>;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={(event) => (onPress ? onPress(event) : console.log('null'))}
      style={disabled ? disabledBtnStyle : btnStyle}
      disabled={disabled}
    >
      <View
        style={[
          { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
          wrapperBtnStyle,
        ]}
      >
        {leftIcon}
        <Text style={disabled ? [disabledBtnTextStyle] : [btnTextStyle]}>{text}</Text>
        {RightIcon}
      </View>
    </TouchableOpacity>
  );
};
export default Button;
