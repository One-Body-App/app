import React, { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const GradientButton = ({
  text,
  leftIcon,
  RightIcon,
  btnTextStyle,
  btnStyle,
  onPress,
}: {
  text: string;
  leftIcon?: ReactNode;
  RightIcon?: ReactNode;
  btnTextStyle: StyleProp<TextStyle>;
  btnStyle: StyleProp<ViewStyle>;
  onPress: (event: GestureResponderEvent) => void;
}) => {
  return (
    <LinearGradient colors={['#126b87', '#032f3c']} style={btnStyle}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={(event) => (onPress ? onPress(event) : console.log('null'))}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          width: '100%',
        }}
      >
        {leftIcon}
        <Text style={[btnTextStyle]}>{text}</Text>
        {RightIcon}
      </TouchableOpacity>
    </LinearGradient>
  );
};
export default GradientButton;
