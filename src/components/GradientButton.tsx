import React, { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  Pressable,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import StyledText from './styled/Text';

function GradientButton({
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
  btnTextStyle: StyleProp<TextStyle>;
  btnStyle: StyleProp<ViewStyle>;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}) {
  let gradientcolors = ['#126b87', '#032f3c'];
  if (disabled) {
    gradientcolors = ['#4f6d77', '#4f6d77'];
  }
  return (
    <View style={{ flexDirection: 'row' }}>
      <LinearGradient colors={gradientcolors} style={btnStyle}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            width: '100%',
          }}
        >
          {leftIcon}
          <StyledText style={btnTextStyle}>{text}</StyledText>
          {RightIcon}
        </Pressable>
      </LinearGradient>
    </View>
  );
}
export default GradientButton;
