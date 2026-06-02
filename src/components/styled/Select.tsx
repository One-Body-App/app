import { useMemo, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import {
  ScrollView,
  Pressable,
  View,
  ViewStyle,
  TextStyle,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import StyledText from './Text';
import { Colors, Typography } from '@/src/styles';
import Button from '../Button';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import StyledTextInput from './TextInput';
import SearchIcon from '@/assets/icons/search.svg';
import { spacing } from '@/src/styles/spacing';
import CustomModal from '../CustomModal';

type SelectedItem = {
  text: string;
  value: string;
  // Optional richer presentation (used by sheets like "Select prayer type").
  description?: string;
  iconName?: string;
};

interface Props {
  items: SelectedItem[];
  btnText: string;
  modalTitle: string;
  modalSubtitle?: string;
  onChange: (item: any) => void;
  selectedItem?: string;
  label?: string;
  wrapperStyle?: ViewStyle;
  hideSearch?: boolean;
  showAllWithoutSearch?: boolean;
  btnStyle?: ViewStyle;
  btnTextStyle?: TextStyle;
  wrapperBtnStyle?: ViewStyle;
  wrapperViewBtnStyle?: ViewStyle;
  rightIcon?: ReactNode;
  leftIcon?: ReactNode;
}

export default function StyledSelect({
  btnText,
  items,
  onChange,
  modalTitle,
  modalSubtitle,
  selectedItem,
  label,
  wrapperStyle,
  hideSearch,
  showAllWithoutSearch,
  btnStyle,
  btnTextStyle,
  wrapperBtnStyle,
  wrapperViewBtnStyle,
  rightIcon,
  leftIcon,
}: Props) {
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchedItems = useMemo(() => {
    if (hideSearch || showAllWithoutSearch) {
      return items;
    }

    const normalizedSearchText = searchText.trim().toLowerCase();
    if (!normalizedSearchText) {
      return [];
    }

    return items.filter((item) => item.text.toLowerCase().includes(normalizedSearchText));
  }, [hideSearch, items, searchText, showAllWithoutSearch]);

  // A short option list with no search reads best as a compact, content-hugging
  // sheet; a searchable list keeps the taller layout so results have room.
  const compact = !!hideSearch;

  // Theme-aware tile palette tuned to stay legible in both light and dark mode.
  const grabberColor = dark ? 'rgba(255,255,255,0.20)' : Colors.neutral[600];
  const tileBg = dark ? 'rgba(255,255,255,0.04)' : Colors.neutral[700];
  const tileBorder = dark ? 'rgba(255,255,255,0.08)' : Colors.neutral[800];
  const selectedTileBg = dark ? 'rgba(18,107,135,0.24)' : Colors.primarySapphire[900];
  const medallionBg = dark ? 'rgba(18,107,135,0.20)' : 'rgba(18,107,135,0.10)';
  const mutedColor = Colors.neutral[300];

  const renderItem = (item: SelectedItem, index: number) => {
    const isSelected = selectedItem === item.value;

    return (
      <Animated.View key={item.value} entering={FadeInDown.duration(260).delay(40 + index * 55)}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          onPress={() => {
            onChange(item.value);
            setModalVisible(false);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: spacing.x12,
            paddingVertical: spacing.x12,
            paddingHorizontal: spacing.x12,
            borderRadius: borderRadius.base,
            borderWidth: borderWidth.thin,
            borderColor: isSelected ? Colors.primarySapphire.brand : tileBorder,
            backgroundColor: isSelected ? selectedTileBg : tileBg,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {item.iconName ? (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: borderRadius.max,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? Colors.primarySapphire.brand : medallionBg,
              }}
            >
              <MaterialCommunityIcons
                name={item.iconName as ComponentProps<typeof MaterialCommunityIcons>['name']}
                size={20}
                color={isSelected ? '#FFFFFF' : Colors.primarySapphire.brand}
              />
            </View>
          ) : null}

          <View style={{ flex: 1 }}>
            <StyledText
              style={[
                Typography.body.x3M,
                { color: Colors.neutral[200], textTransform: 'capitalize' },
              ]}
              numberOfLines={1}
            >
              {item.text}
            </StyledText>
            {item.description ? (
              <StyledText
                style={[Typography.body.x1, { color: mutedColor, marginTop: spacing.x2 }]}
                numberOfLines={2}
              >
                {item.description}
              </StyledText>
            ) : null}
          </View>

          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: borderRadius.max,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: isSelected ? 0 : borderWidth.thin,
              borderColor: tileBorder,
              backgroundColor: isSelected ? Colors.primarySapphire.brand : 'transparent',
            }}
          >
            {isSelected ? <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" /> : null}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={wrapperStyle}>
      {label ? <StyledText style={{ marginBottom: spacing.x10 }}>{label}</StyledText> : null}
      <Button
        text={btnText}
        leftIcon={leftIcon}
        btnStyle={[
          {
            flex: 1,
            backgroundColor: Colors.neutral[700],
            borderColor: Colors.neutral[800],
            borderRadius: borderRadius.xs,
          },
          btnStyle,
        ]}
        wrapperBtnStyle={[
          {
            justifyContent: 'space-between',
            paddingHorizontal: spacing.x10,
            paddingVertical: spacing.x16,
          },
          wrapperBtnStyle,
        ]}
        wrapperViewBtnStyle={wrapperViewBtnStyle}
        btnTextStyle={[
          {
            textTransform: 'capitalize',
            color: selectedItem ? Colors.neutral[200] : Colors.neutral[300],
          },
          btnTextStyle,
        ]}
        rightIcon={rightIcon ?? <Ionicons name="chevron-down" color={Colors.neutral[200]} />}
        onPress={() => {
          setSearchText('');
          setModalVisible(true);
        }}
      />

      <CustomModal
        modalVisible={modalVisible}
        onclose={() => setModalVisible(false)}
        style={{
          margin: 0,
          borderTopLeftRadius: borderRadius.large,
          borderTopRightRadius: borderRadius.large,
          backgroundColor: colors.background,
          // Let a short, search-less list hug its content instead of filling half the screen.
          ...(compact ? { minHeight: 0 } : {}),
        }}
      >
        <View
          style={{
            paddingTop: spacing.x8,
            paddingBottom: insets.bottom + spacing.x16,
            ...(compact ? {} : { flex: 1, marginTop: spacing.x48 }),
          }}
        >
          {/* Grabber */}
          <View
            style={{
              alignSelf: 'center',
              width: 44,
              height: 5,
              borderRadius: borderRadius.max,
              backgroundColor: grabberColor,
              marginBottom: spacing.x16,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingHorizontal: spacing.x24,
              marginBottom: spacing.x16,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.x12 }}>
              <StyledText style={[Typography.header.h3, { color: colors.text }]}>
                {modalTitle}
              </StyledText>
              {modalSubtitle ? (
                <StyledText
                  style={[Typography.body.x2, { color: mutedColor, marginTop: spacing.x4 }]}
                >
                  {modalSubtitle}
                </StyledText>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: borderRadius.max,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dark ? 'rgba(255,255,255,0.06)' : Colors.neutral[700],
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={dark ? colors.text : Colors.primary.brand}
              />
            </Pressable>
          </View>

          {/* Search (only when enabled) */}
          {!hideSearch ? (
            <View style={{ paddingHorizontal: spacing.x24, marginBottom: spacing.x12 }}>
              <StyledTextInput
                clearButtonMode="always"
                value={searchText}
                returnKeyType="search"
                placeholder="Search"
                leftIcon={
                  <View style={{ justifyContent: 'center' }}>
                    <SearchIcon
                      style={{ height: 15, width: 15, marginRight: spacing.x10 }}
                      stroke={Colors.neutral[200]}
                    />
                  </View>
                }
                onChangeText={(text) => setSearchText(text)}
              />
            </View>
          ) : null}

          {/* Options. Keyed on visibility so the staggered entrance replays each open. */}
          <ScrollView
            key={modalVisible ? 'sheet-open' : 'sheet-closed'}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            style={compact ? { maxHeight: screenHeight * 0.62 } : { flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: spacing.x16,
              paddingTop: spacing.x4,
              rowGap: spacing.x10,
            }}
          >
            {searchedItems.length === 0 && searchText !== '' ? (
              <StyledText style={[Typography.body.x2M, { padding: spacing.x16 }]}>
                No results found
              </StyledText>
            ) : null}
            {searchedItems.map((item, index) => renderItem(item, index))}
          </ScrollView>
        </View>
      </CustomModal>
    </View>
  );
}
