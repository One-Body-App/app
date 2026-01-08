import React from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Colors } from '@/src/styles';

const logoWhite = require('@/assets/images/logo_header_white.png');
const logoHeader = require('@/assets/images/logo_header.png');

interface CustomHeaderProps {
  showBackButton?: boolean;
}

export default function CustomHeader({ showBackButton = true }: CustomHeaderProps) {
  const navigation = useNavigation();
  const { dark } = useTheme();

  return (
    <View style={styles.container}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.primary.brand} />
        </TouchableOpacity>
      )}
      <View style={styles.logoContainer}>
        <FastImage
          style={styles.logo}
          resizeMode={FastImage.resizeMode.contain}
          source={dark ? logoWhite : logoHeader}
        />
      </View>
      {/* Spacer to keep logo centered when back button is present */}
      {showBackButton && <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Platform.OS === 'android' ? 56 : 44,
    paddingHorizontal: 8,
    backgroundColor: Platform.OS === 'android' ? '#f5f5f5' : 'transparent',
    borderBottomWidth: Platform.OS === 'android' ? 1 : 0,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginTop: Platform.OS === 'android' ? -8 : 0,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginTop: Platform.OS === 'android' ? -8 : 0,
  },
  logo: {
    width: 100,
    height: 28,
  },
  spacer: {
    width: 44,
  },
});
