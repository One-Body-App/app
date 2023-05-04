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

const Button = ({
  text,
  content,
  leftIcon,
  RightIcon,
  btnTextStyle,
  btnStyle,
  onPress,
  disabled,
  disabledBtnStyle,
  disabledBtnTextStyle,
  wrapperViewBtnStyle,
  wrapperBtnStyle,
  paper,
  mode,
  textColor,
}: {
  text?: string;
  content?: ReactNode;
  leftIcon?: ReactNode;
  RightIcon?: ReactNode;
  btnTextStyle?: StyleProp<TextStyle>;
  btnStyle?: StyleProp<ViewStyle>;
  disabledBtnStyle?: StyleProp<ViewStyle>;
  wrapperBtnStyle?: StyleProp<ViewStyle>;
  wrapperViewBtnStyle?: StyleProp<ViewStyle>;
  disabledBtnTextStyle?: StyleProp<TextStyle>;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  paper?: boolean;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  textColor?: string;
}) => {
  console.log('button text style', btnTextStyle);
  return paper ? (
    <>
      <ButtonPaper
        mode={mode}
        onPress={(event) => (onPress ? onPress(event) : null)}
        disabled={disabled}
        style={btnStyle ?? { marginVertical: 15, marginHorizontal: 13 }}
        textColor={textColor}
        labelStyle={
          btnTextStyle ?? {
            paddingVertical: 7,
            fontSize: getFontSize(2.1),
            // fontFamily: 'Rubik-Medium',
            letterSpacing: 1.25,
          }
        }
      >
        {text || content}
      </ButtonPaper>
    </>
  ) : (
    <View style={[{ flexDirection: 'row' }, wrapperViewBtnStyle]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={(event) => (onPress ? onPress(event) : null)}
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
    </View>
  );
};
export default Button;
