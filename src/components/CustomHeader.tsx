import React, { ReactNode } from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FastImage from '@/components/primitives/FastImage';
import { Colors } from '@/src/styles';
import {
  APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  APP_HEADER_CONTROL_SIZE,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
} from '@/src/styles/headerLayout';

const logoWhite = require('@/assets/images/logo_header_white.png');
const logoHeader = require('@/assets/images/logo_header.png');

interface CustomHeaderProps {
  showBackButton?: boolean;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  contentHeight?: number;
}

export default function CustomHeader({
  showBackButton = true,
  leftSlot,
  rightSlot,
  contentHeight,
}: CustomHeaderProps) {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const { dark } = useTheme();
  const resolvedContentHeight = contentHeight ?? APP_HEADER_ROW_HEIGHT;
  const iconSize = 30;
  const sideSlotStyle = {
    width: APP_HEADER_SIDE_WIDTH,
    height: resolvedContentHeight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const headerRowStyle = Platform.OS === 'android' ? styles.headerRowAndroid : styles.headerRow;

  const androidBackgroundColor = dark ? Colors.neutral[900] : '#f5f5f5';
  const androidBorderColor = dark ? Colors.neutral[800] : '#e0e0e0';
  const leftElement =
    leftSlot ??
    (showBackButton && canGoBack ? (
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="chevron-left" size={iconSize} color={Colors.primary.brand} />
      </Pressable>
    ) : null);
  const rightElement = rightSlot ?? null;

  return (
    <View
      testID="custom-header"
      style={[
        styles.container,
        {
          backgroundColor: Platform.OS === 'android' ? androidBackgroundColor : 'transparent',
          borderBottomColor: Platform.OS === 'android' ? androidBorderColor : 'transparent',
          height: resolvedContentHeight,
        },
      ]}
    >
      <View style={[styles.headerRow, headerRowStyle]}>
        <View testID="custom-header-left-slot" style={sideSlotStyle}>
          {leftElement}
        </View>
        <FastImage
          testID="custom-header-logo"
          style={[styles.logo, Platform.OS === 'android' ? styles.logoAndroid : null]}
          resizeMode={FastImage.resizeMode.contain}
          source={dark ? logoWhite : logoHeader}
        />
      </View>
      {/* Spacer/right slot to keep logo centered */}
      <View testID="custom-header-right-slot" style={sideSlotStyle}>
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    borderBottomWidth: Platform.OS === 'android' ? 1 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: APP_HEADER_ROW_HEIGHT,
    transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
  },
  headerRowAndroid: {
    justifyContent: 'flex-start',
  },
  backButton: {
    width: APP_HEADER_CONTROL_SIZE,
    height: APP_HEADER_CONTROL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 40,
  },
  logoAndroid: {
    marginLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
});
