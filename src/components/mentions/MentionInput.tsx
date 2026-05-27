import React, {
  ComponentType,
  ReactNode,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  Pressable,
  View,
  ViewStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@react-navigation/native';
import StyledText from '@/components/styled/Text';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import type { TaggedMention } from '@/utils/types';
import ParsedText from './ParsedText';
import {
  ActiveMention,
  MentionSelection,
  MentionSuggestion,
  selectionFromEvent,
} from './mentionUtils';

type MentionInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'selection' | 'onSelectionChange'
> & {
  value: string;
  onChangeText: (value: string) => void;
  selection: MentionSelection;
  onSelectionChange: (selection: MentionSelection) => void;
  activeMention: ActiveMention | null;
  mentions?: TaggedMention[];
  suggestions: MentionSuggestion[];
  isLoading: boolean;
  isError: boolean;
  onSelectSuggestion: (suggestion: MentionSuggestion) => void;
  onHandleBackspace?: () => boolean;
  inputRef?: React.Ref<any>;
  inputComponent?: ComponentType<any>;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  inputRightAccessory?: ReactNode;
  suggestionsContainerStyle?: StyleProp<ViewStyle>;
  suggestionsPlacement?: 'above' | 'below';
  showCharCounter?: boolean;
  counterContainerStyle?: StyleProp<ViewStyle>;
  counterTextStyle?: StyleProp<TextStyle>;
  maxLengthErrorMessage?: string;
};

const SuggestionRow = memo(function SuggestionRow({
  item,
  onPress,
  nameColor,
  handleColor,
  isActive,
}: {
  item: MentionSuggestion;
  onPress: (value: MentionSuggestion) => void;
  nameColor: string;
  handleColor: string;
  isActive: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={() => onPress(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.x13,
        paddingVertical: spacing.x10,
        gap: spacing.x10,
        backgroundColor: isActive ? 'rgba(18, 210, 217, 0.12)' : 'transparent',
      }}
    >
      <FastImage
        source={{ uri: item.profileImage }}
        resizeMode="cover"
        style={{
          width: 36,
          height: 36,
          borderRadius: borderRadius.max,
          backgroundColor: Colors.neutral[700],
        }}
      />
      <View style={{ flex: 1 }}>
        <StyledText numberOfLines={1} style={{ color: nameColor, fontWeight: '700' }}>
          {item.name}
        </StyledText>
        <StyledText numberOfLines={1} style={{ color: handleColor, marginTop: 2 }}>
          @{item.username}
        </StyledText>
      </View>
    </Pressable>
  );
});

function MentionInput({
  value,
  onChangeText,
  selection,
  onSelectionChange,
  activeMention,
  mentions,
  suggestions,
  isLoading,
  isError,
  onSelectSuggestion,
  onHandleBackspace,
  inputRef,
  inputComponent: InputComponent = TextInput,
  containerStyle,
  inputWrapperStyle,
  inputStyle,
  inputRightAccessory,
  suggestionsContainerStyle,
  suggestionsPlacement = 'below',
  showCharCounter,
  counterContainerStyle,
  counterTextStyle,
  maxLengthErrorMessage,
  maxLength,
  onBlur,
  onFocus,
  ...inputProps
}: MentionInputProps) {
  const { colors } = useTheme();
  const suggestionNameColor = colors.text;
  const suggestionHandleColor = Colors.neutral[400];
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextNativeChangeRef = useRef(false);
  const isSelectingSuggestionRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Track the last selection reported by the native TextInput so we can
  // distinguish programmatic selection changes (e.g. after mention insertion)
  // from normal typing.  Only pass `selection` as a controlled prop when the
  // parent set it programmatically; otherwise let the native input manage its
  // own cursor to avoid the cursor-jump bug on capital letters / fast typing.
  const lastNativeSelectionRef = useRef<MentionSelection>(selection);
  const controlledSelection =
    selection.start !== lastNativeSelectionRef.current.start ||
    selection.end !== lastNativeSelectionRef.current.end
      ? selection
      : undefined;

  const suggestionPanelVisible = useMemo(() => {
    return (
      isFocused &&
      Boolean(activeMention?.query.length) &&
      (isLoading || isError || suggestions.length > 0)
    );
  }, [activeMention?.query.length, isError, isFocused, isLoading, suggestions.length]);

  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [activeMention?.replaceStart, activeMention?.replaceEnd, suggestions.length]);

  const flattenedInputStyle = StyleSheet.flatten(inputStyle) ?? {};
  const resolvedInputColor =
    typeof flattenedInputStyle.color === 'string' ? flattenedInputStyle.color : colors.text;
  const resolvedFontSize =
    typeof flattenedInputStyle.fontSize === 'number' ? flattenedInputStyle.fontSize : 16;
  const resolvedLineHeight =
    typeof flattenedInputStyle.lineHeight === 'number'
      ? flattenedInputStyle.lineHeight
      : Math.round(resolvedFontSize * 1.35);
  const resolvedPaddingTop =
    typeof flattenedInputStyle.paddingTop === 'number'
      ? flattenedInputStyle.paddingTop
      : typeof flattenedInputStyle.paddingVertical === 'number'
        ? flattenedInputStyle.paddingVertical
        : typeof flattenedInputStyle.padding === 'number'
          ? flattenedInputStyle.padding
          : 0;
  const suggestionPanelPositionStyle = useMemo(() => {
    if (suggestionsPlacement === 'above') {
      return {
        bottom: '100%' as const,
        marginBottom: spacing.x4,
      };
    }

    if (inputProps.multiline && flattenedInputStyle.textAlignVertical === 'top') {
      return {
        top: resolvedPaddingTop + resolvedLineHeight + spacing.x4,
      };
    }

    return {
      top: '100%' as const,
      marginTop: spacing.x4,
    };
  }, [
    flattenedInputStyle.textAlignVertical,
    inputProps.multiline,
    resolvedLineHeight,
    resolvedPaddingTop,
    suggestionsPlacement,
  ]);

  const handleSuggestionPress = useCallback(
    (suggestion: MentionSuggestion) => {
      isSelectingSuggestionRef.current = true;
      onSelectSuggestion(suggestion);
      setIsFocused(true);
      setActiveSuggestionIndex(0);
      requestAnimationFrame(() => {
        if (typeof inputRef === 'object' && inputRef && 'current' in inputRef) {
          inputRef.current?.focus?.();
        }
        isSelectingSuggestionRef.current = false;
      });
    },
    [inputRef, onSelectSuggestion]
  );

  const handleKeyPress = useCallback(
    (event: any) => {
      const key = event?.nativeEvent?.key;
      if (
        (key === 'Backspace' || key === 'Delete') &&
        onHandleBackspace &&
        selection.start === selection.end &&
        onHandleBackspace()
      ) {
        ignoreNextNativeChangeRef.current = true;
        return;
      }

      if (!suggestionPanelVisible || suggestions.length < 1) {
        inputProps.onKeyPress?.(event);
        return;
      }

      if (key === 'ArrowDown') {
        setActiveSuggestionIndex((current) => Math.min(current + 1, suggestions.length - 1));
        return;
      }

      if (key === 'ArrowUp') {
        setActiveSuggestionIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if ((key === 'Enter' || key === 'Tab') && suggestions[activeSuggestionIndex]) {
        ignoreNextNativeChangeRef.current = true;
        handleSuggestionPress(suggestions[activeSuggestionIndex]);
        return;
      }

      if (key === 'Escape') {
        setIsFocused(false);
        return;
      }

      inputProps.onKeyPress?.(event);
    },
    [
      activeSuggestionIndex,
      handleSuggestionPress,
      inputProps,
      onHandleBackspace,
      selection.end,
      selection.start,
      suggestionPanelVisible,
      suggestions,
    ]
  );

  return (
    <View style={containerStyle}>
      <View style={[{ position: 'relative' }, inputWrapperStyle]}>
        {value.length > 0 ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                justifyContent:
                  flattenedInputStyle.textAlignVertical === 'top' ? 'flex-start' : 'center',
                zIndex: 1,
              },
            ]}
          >
            <ParsedText
              mentionTextStyle={{
                color: Colors.primary.brand,
                fontWeight: '700',
              }}
              mentions={mentions}
              text={value}
              textStyle={[
                inputStyle,
                {
                  color: resolvedInputColor,
                },
              ]}
            />
          </View>
        ) : null}
        <InputComponent
          ref={inputRef}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...inputProps}
          maxLength={maxLength}
          value={value}
          selection={controlledSelection}
          onChangeText={(nextValue: string) => {
            if (ignoreNextNativeChangeRef.current) {
              ignoreNextNativeChangeRef.current = false;
              return;
            }

            onChangeText(nextValue);
          }}
          onSelectionChange={(event: any) => {
            const nativeSelection = selectionFromEvent(event);
            lastNativeSelectionRef.current = nativeSelection;
            onSelectionChange(nativeSelection);
          }}
          onKeyPress={handleKeyPress}
          onFocus={(event: any) => {
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = null;
            }
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event: any) => {
            blurTimeoutRef.current = setTimeout(() => {
              if (!isSelectingSuggestionRef.current) {
                setIsFocused(false);
              }
            }, 120);
            onBlur?.(event);
          }}
          cursorColor={Platform.OS === 'android' ? resolvedInputColor : undefined}
          selectionColor="rgba(18, 210, 217, 0.35)"
          style={[
            inputStyle,
            {
              color: value.length > 0 ? 'transparent' : resolvedInputColor,
              zIndex: 2,
            },
          ]}
        />
        {inputRightAccessory ? (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              right: spacing.x10,
              top: spacing.x10,
            }}
          >
            {inputRightAccessory}
          </View>
        ) : null}

        {suggestionPanelVisible ? (
          <View
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                maxHeight: 240,
                borderRadius: borderRadius.base,
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: 'rgba(3, 47, 60, 0.12)',
                zIndex: 1000,
                elevation: 16,
                overflow: 'hidden',
              },
              suggestionPanelPositionStyle,
              suggestionsContainerStyle,
            ]}
          >
            {isLoading && (
              <View style={{ paddingVertical: spacing.x16 }}>
                <ActivityIndicator color="#3c4b64" />
              </View>
            )}
            {!isLoading && isError && (
              <View style={{ paddingHorizontal: spacing.x13, paddingVertical: spacing.x16 }}>
                <StyledText style={{ color: Colors.errorFeedback[200] }}>
                  Unable to load mentions right now.
                </StyledText>
              </View>
            )}
            {!isLoading && !isError && (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {suggestions.map((item) => (
                  <SuggestionRow
                    key={`${item.id}_${item.username}`}
                    handleColor={suggestionHandleColor}
                    item={item}
                    isActive={suggestions[activeSuggestionIndex]?.id === item.id}
                    nameColor={suggestionNameColor}
                    onPress={handleSuggestionPress}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}
      </View>

      {showCharCounter && maxLength ? (
        <View style={counterContainerStyle}>
          <StyledText
            style={[
              {
                marginTop: spacing.x5,
                color: value.length >= maxLength ? Colors.errorFeedback[200] : colors.text,
              },
              counterTextStyle,
            ]}
          >
            {value.length >= maxLength - 5
              ? `${value.length}/${maxLength}${
                  maxLengthErrorMessage && value.length > maxLength
                    ? ` ${maxLengthErrorMessage}`
                    : ''
                }`
              : ''}
          </StyledText>
        </View>
      ) : null}
    </View>
  );
}

export default MentionInput;
