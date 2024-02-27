import { ReactElement, forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { poppins } from '@/src/styles/typography';
import StyledText from './Text';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

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
  inputWrapperStyle?: ViewStyle;
  maxLengthErrorMessage?: string;
  enforceMaxLength?: boolean;
}

export default forwardRef<TextInput, Props>((props, ref) => {
  const {
    label,
    inputStyle,
    rightIcon,
    leftIcon,
    wrapperStyle,
    inputWrapperStyle,
    backgroundColor,
    showCharCounter,
    counterContainerStyle,
    counterTextStyleStyle,
    maxLengthErrorMessage,
    maxLength,
    enforceMaxLength,
    ...textInputProps
  } = props;
  let backgroundColorWrapper = backgroundColor;
  const {
    neutral: { 700: color700 },
  } = Colors;

  if (!backgroundColor) {
    backgroundColorWrapper = color700;
  }
  const { colors } = useTheme();

  return (
    <View style={wrapperStyle}>
      {label && label !== '' ? (
        <StyledText style={{ marginBottom: 15, color: Colors.neutral.brand }}>{label}</StyledText>
      ) : null}
      <View
        style={[
          {
            flexDirection: 'row',
            backgroundColor: backgroundColorWrapper,
            paddingHorizontal: spacing.x16,

            borderRadius: borderRadius.xs,
            borderWidth: 1,
            borderColor: Colors.neutral[700],
          },
          inputWrapperStyle,
        ]}
      >
        {leftIcon || null}

        <TextInput
          ref={ref}
          {...textInputProps}
          maxLength={enforceMaxLength && maxLength ? maxLength : undefined}
          style={[
            { paddingVertical: spacing.x10, color: colors.text },
            styles.input,
            inputStyle,
            poppins.base,
          ]}
        />

        {rightIcon || null}
      </View>
      {showCharCounter && maxLength ? (
        <View style={counterContainerStyle}>
          <StyledText
            style={[
              counterTextStyleStyle,
              {
                marginTop: spacing.x5,

                color:
                  (textInputProps.value?.length ?? 0) >= maxLength
                    ? Colors.errorFeedback[200]
                    : colors.text,
              },
            ]}
          >
            {(textInputProps.value?.length ?? 0) >= maxLength - 5 ? (
              <StyledText
                style={[
                  counterTextStyleStyle,
                  {
                    marginLeft: spacing.x10,
                    color:
                      (textInputProps.value?.length ?? 0) > maxLength
                        ? Colors.errorFeedback[200]
                        : colors.text,
                  },
                ]}
              >
                {textInputProps.value?.length || '0'}/{maxLength}{' '}
                {maxLengthErrorMessage && (textInputProps.value?.length ?? 0) > maxLength
                  ? maxLengthErrorMessage
                  : ''}
              </StyledText>
            ) : null}
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
