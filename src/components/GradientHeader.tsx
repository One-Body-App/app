import { Text, View } from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Logo from '@/assets/svg/Logo.svg';
import StyledText from './styled/Text';

type Props = {
  title?: string;
  left?: React.ReactNode;
};

function GradientHeader({ title, left }: Props) {
  return (
    <View
      style={{
        backgroundColor: 'red',
        shadowColor: '#126BB7',
        shadowOffset: {
          width: 0,
          height: 20,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 0,
      }}
    >
      <LinearGradient
        colors={['#126B87', '#032F3C']}
        style={{
          width: getWidth(100),
          height: getHeight(30),
          justifyContent: 'space-around',
          alignItems: 'center',

          shadowColor: '#126BB7',
          shadowOffset: {
            width: 0,
            height: 20,
          },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 0,
        }}
      >
        {left}

        <Logo
          height={getHeight(16)}
          style={{
            shadowColor: 'black',
            shadowOffset: {
              width: 0,
              height: 20,
            },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 0,
          }}
        />
        <StyledText
          style={{
            color: 'white',
            fontSize: getFontSize(3),
            fontWeight: 'bold',
          }}
        >
          {title ?? 'Welcome'}
        </StyledText>
      </LinearGradient>
    </View>
  );
}

export default GradientHeader;
