import { poppings } from '@/src/styles/typography';
import { FC } from 'react';
import { Text, TextProps } from 'react-native';

export const StyledText: FC<TextProps> = (props) => {
  return (
    <Text style={[props.style, poppings.base]} {...props}>
      {props.children}
    </Text>
  );
};
