import { poppings } from '@/src/styles/typography';
import { ReactElement, forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { StyledText } from './Text';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';

interface Props extends TextInputProps {
  label?: string;
  inputStyle?: TextStyle;
  wrapperStyle?: ViewStyle;
  rightIcon?: ReactElement;
  leftIcon?: ReactElement;
  backgroundColor?: string;
}

export const StyledTextInput = forwardRef<TextInput, Props>((props, ref) => {
  const {
    label,
    inputStyle,
    rightIcon,
    leftIcon,
    wrapperStyle,
    backgroundColor,
    ...textInputProps
  } = props;
  let backgroundColorWrapper = backgroundColor;

  if (!backgroundColor) {
    backgroundColorWrapper = Colors.neutral[600];
  }
  return (
    <View style={wrapperStyle}>
      {label && label != '' ? (
        <StyledText style={{ marginBottom: 15, color: Colors.neutral.brand }}>{label}</StyledText>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
          backgroundColor: backgroundColorWrapper,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: borderRadius.small,
          borderWidth: 1,
          borderColor: Colors.neutral[700],
        }}
      >
        {leftIcon ? leftIcon : null}
        <TextInput
          ref={ref}
          style={[styles.input, inputStyle, poppings.base]}
          {...textInputProps}
        />
        {rightIcon ? rightIcon : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  input: {
    flex: 1,
  },
});
