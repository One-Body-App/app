import { poppins } from '@/src/styles/typography';
import { ReactElement, forwardRef } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
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
  showCharCounter?: boolean;
  counterContainerStyle?: ViewStyle;
  counterTextStyleStyle?: TextStyle;
}

export const StyledTextInput = forwardRef<TextInput, Props>((props, ref) => {
  const {
    label,
    inputStyle,
    rightIcon,
    leftIcon,
    wrapperStyle,
    backgroundColor,
    showCharCounter,
    counterContainerStyle,
    counterTextStyleStyle,
    ...textInputProps
  } = props;
  let backgroundColorWrapper = backgroundColor;

  if (!backgroundColor) {
    backgroundColorWrapper = Colors.neutral[700];
  }
  return (
    <View style={wrapperStyle}>
      {label && label != '' ? (
        <StyledText style={{ marginBottom: 15, color: Colors.neutral.brand }}>{label}</StyledText>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: backgroundColorWrapper,
          paddingHorizontal: 14,

          borderRadius: borderRadius.small,
          borderWidth: 1,
          borderColor: Colors.neutral[700],
        }}
      >
        {leftIcon ? leftIcon : null}
        <TextInput
          ref={ref}
          style={[{ paddingVertical: 12 }, styles.input, inputStyle, poppins.base]}
          {...textInputProps}
        />
        {rightIcon ? rightIcon : null}
      </View>
      {showCharCounter && textInputProps.maxLength ? (
        <View style={counterContainerStyle}>
          <StyledText style={counterTextStyleStyle}>
            {textInputProps.value?.length || '0'}/{textInputProps.maxLength}
          </StyledText>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  input: {
    flex: 1,
  },
});
