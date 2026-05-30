import React, { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  Text,
  TextStyle,
  Pressable,
  View,
  ViewStyle,
} from 'react-native';
import { Button as ButtonPaper } from 'react-native-paper';
import { getFontSize } from '@/utils/ResponsiveFun';
import StyledText from './styled/Text';

function Button({
  text,
  leftIcon,
  rightIcon,
  btnTextStyle,
  btnStyle,
  onPress,
  disabled,
  disabledBtnStyle,
  disabledBtnTextStyle,
  wrapperViewBtnStyle,
  wrapperBtnStyle,
  content,
}: {
  text?: string;
  content?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  btnTextStyle?: StyleProp<TextStyle>;
  btnStyle?: StyleProp<ViewStyle>;
  disabledBtnStyle?: StyleProp<ViewStyle>;
  wrapperBtnStyle?: StyleProp<ViewStyle>;
  wrapperViewBtnStyle?: StyleProp<ViewStyle>;
  disabledBtnTextStyle?: StyleProp<TextStyle>;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[{ flexDirection: 'row' }, wrapperViewBtnStyle]}>
      <Pressable
        onPress={(event) => (onPress ? onPress(event) : null)}
        style={disabled && disabledBtnStyle ? disabledBtnStyle : btnStyle}
        disabled={disabled}
      >
        <View
          style={[
            {
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            },

            wrapperBtnStyle,
          ]}
        >
          {leftIcon}
          {text ? (
            <StyledText
              style={disabled && disabledBtnTextStyle ? [disabledBtnTextStyle] : [btnTextStyle]}
            >
              {text}
            </StyledText>
          ) : null}

          {content || null}

          {rightIcon}
        </View>
      </Pressable>
    </View>
  );
}
export default Button;
