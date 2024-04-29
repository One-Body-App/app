import { useTheme } from '@react-navigation/native';

import { Text, TextProps } from 'react-native';
import { openSans } from '@/src/styles/typography';

export default function StyledText({ children, ...props }: TextProps) {
  const { colors } = useTheme();

  return (
    <Text {...props} style={[openSans.base, { color: colors.text }, props?.style]}>
      {children}
    </Text>
  );
}
