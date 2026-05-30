import React from 'react';
import { useTheme } from '@react-navigation/native';
import FastImage from '@/components/primitives/FastImage';

const logoWhite = require('@/assets/images/logo_header_white.png');
const logoHeader = require('@/assets/images/logo_header.png');

export default function HeaderLogo() {
  const { dark } = useTheme();

  return (
    <FastImage
      style={{ width: 100, height: 28 }}
      resizeMode={FastImage.resizeMode.contain}
      source={dark ? logoWhite : logoHeader}
    />
  );
}
