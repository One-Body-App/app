import React, { ReactNode } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet, StatusBar } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Colors } from '@/src/styles';

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
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const resolvedContentHeight = contentHeight ?? (Platform.OS === 'android' ? 44 : 44);
  const iconSize = 45;
  const sideSlotStyle = {
    width: 50,
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
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="chevron-left" size={iconSize} color={Colors.primary.brand} />
      </TouchableOpacity>
    ) : null);
  const rightElement = rightSlot ?? null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Platform.OS === 'android' ? androidBackgroundColor : 'transparent',
          borderBottomColor: Platform.OS === 'android' ? androidBorderColor : 'transparent',
          height: resolvedContentHeight + statusBarHeight,
          paddingTop: statusBarHeight,
        },
      ]}
    >
      <View style={[styles.headerRow, headerRowStyle]}>
        {leftElement ? <View style={sideSlotStyle}>{leftElement}</View> : null}
        <FastImage
          style={[styles.logo, Platform.OS === 'android' ? styles.logoAndroid : null]}
          resizeMode={FastImage.resizeMode.contain}
          source={dark ? logoWhite : logoHeader}
        />
      </View>
      {/* Spacer/right slot to keep logo centered */}
      <View style={sideSlotStyle}>{rightElement}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 36,
    borderBottomWidth: Platform.OS === 'android' ? 1 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRowAndroid: {
    justifyContent: 'flex-start',
  },
  backButton: {
    padding: 1,
  },
  logo: {
    width: 120,
    height: 40,
  },
  logoAndroid: {
    marginLeft: 7,
  },
});
