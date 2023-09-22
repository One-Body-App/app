import { poppins } from '@/src/styles/typography';
import { FC } from 'react';
import { Text, TextProps } from 'react-native';

export const StyledText: FC<TextProps> = (props) => {
  return (
    <Text {...props} style={[poppins.base, props?.style]}>
      {props.children}
    </Text>
  );
};
