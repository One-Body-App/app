import { poppins } from '@/src/styles/typography';
import { useTheme } from '@react-navigation/native';
import { FC } from 'react';
import { Text, TextProps } from 'react-native';

export const StyledText: FC<TextProps> = (props) => {
  const { colors } = useTheme();

  return (
    <Text {...props} style={[poppins.base, { color: colors.text }, props?.style]}>
      {props.children}
    </Text>
  );
};
