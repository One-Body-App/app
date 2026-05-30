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
        backgroundColor: '#032F3C',
        boxShadow: '0 20px 20px rgba(18, 107, 183, 0.1)',
      }}
    >
      <LinearGradient
        colors={['#126B87', '#032F3C']}
        style={{
          width: getWidth(100),
          height: getHeight(30),
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {left}

        <View
          style={{
            boxShadow: '0 20px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Logo height={getHeight(16)} />
        </View>
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
