import React, { ComponentType, ReactNode, memo, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@react-navigation/native';
import StyledText from '@/components/styled/Text';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
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
  suggestions: MentionSuggestion[];
  isLoading: boolean;
  isError: boolean;
  onSelectSuggestion: (suggestion: MentionSuggestion) => void;
  inputRef?: React.Ref<any>;
  inputComponent?: ComponentType<any>;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  inputRightAccessory?: ReactNode;
  suggestionsContainerStyle?: StyleProp<ViewStyle>;
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
}: {
  item: MentionSuggestion;
  onPress: (value: MentionSuggestion) => void;
  nameColor: string;
  handleColor: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.x13,
        paddingVertical: spacing.x10,
        gap: spacing.x10,
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
    </TouchableOpacity>
  );
});

function MentionInput({
  value,
  onChangeText,
  selection,
  onSelectionChange,
  activeMention,
  suggestions,
  isLoading,
  isError,
  onSelectSuggestion,
  inputRef,
  inputComponent: InputComponent = TextInput,
  containerStyle,
  inputWrapperStyle,
  inputStyle,
  inputRightAccessory,
  suggestionsContainerStyle,
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
  const isSelectingSuggestionRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

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

  const renderSuggestionItem = ({ item }: ListRenderItemInfo<MentionSuggestion>) => (
    <SuggestionRow
      handleColor={suggestionHandleColor}
      item={item}
      nameColor={suggestionNameColor}
      onPress={(suggestion) => {
        isSelectingSuggestionRef.current = true;
        onSelectSuggestion(suggestion);
        setIsFocused(true);
        requestAnimationFrame(() => {
          if (typeof inputRef === 'object' && inputRef && 'current' in inputRef) {
            inputRef.current?.focus?.();
          }
          isSelectingSuggestionRef.current = false;
        });
      }}
    />
  );

  return (
    <View style={containerStyle}>
      <View style={[{ position: 'relative' }, inputWrapperStyle]}>
        <InputComponent
          ref={inputRef}
          {...inputProps}
          maxLength={maxLength}
          value={value}
          selection={controlledSelection}
          onChangeText={onChangeText}
          onSelectionChange={(event: any) => {
            const nativeSelection = selectionFromEvent(event);
            lastNativeSelectionRef.current = nativeSelection;
            onSelectionChange(nativeSelection);
          }}
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
          style={inputStyle}
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
                top: '100%',
                marginTop: spacing.x8,
                maxHeight: 240,
                borderRadius: borderRadius.base,
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: 'rgba(3, 47, 60, 0.12)',
                zIndex: 1000,
                elevation: 16,
                overflow: 'hidden',
              },
              suggestionsContainerStyle,
            ]}
          >
            {isLoading ? (
              <View style={{ paddingVertical: spacing.x16 }}>
                <ActivityIndicator color={Colors.primary.brand} />
              </View>
            ) : isError ? (
              <View style={{ paddingHorizontal: spacing.x13, paddingVertical: spacing.x16 }}>
                <StyledText style={{ color: Colors.errorFeedback[200] }}>
                  Unable to load mentions right now.
                </StyledText>
              </View>
            ) : (
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={suggestions}
                renderItem={renderSuggestionItem}
                keyExtractor={(item) => `${item.id}_${item.username}`}
              />
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
