import { useTheme } from '@react-navigation/native';
import { FC } from 'react';
import { Text, TextProps } from 'react-native';
import { poppins } from '@/src/styles/typography';

export default function StyledText({ children, ...props }: TextProps) {
  const { colors } = useTheme();

  return (
    <Text {...props} style={[poppins.base, { color: colors.text }, props?.style]}>
      {children}
    </Text>
  );
}
