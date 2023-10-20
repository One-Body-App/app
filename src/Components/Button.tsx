import { getFontSize } from '@/utils/ResponsiveFun';
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
import { Button as ButtonPaper } from 'react-native-paper';
import { StyledText } from './styled/Text';

const Button = ({
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
}) => {
  return (
    <View style={[{ flexDirection: 'row' }, wrapperViewBtnStyle]}>
      <TouchableOpacity
        activeOpacity={0.7}
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

          {content ? content : null}

          {rightIcon}
        </View>
      </TouchableOpacity>
    </View>
  );
};
export default Button;
