import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import StyledText from './styled/Text';

type Props = {
  title: string;
  leftView: ReactNode;
  RightView: ReactNode;
  hideBorder?: boolean;
};

function Header({ title, leftView, RightView, hideBorder = false }: Props) {
  const { colors, dark } = useTheme();
  const brandColors = {
    primaryBase: '#41899f',
    primaryDark: '#126b87',
    accentBase: '#41dbe1',
    accentDark: '#12d2d9',
    scale100: '#e6eaec',
    black: '#032f3c',
  };
  let borderBottomColor = dark ? 'rgba(255,255,255,0.08)' : brandColors.scale100;
  if (hideBorder) {
    borderBottomColor = 'transparent';
  }

  return (
    <View
      style={[
        styles.headview,
        {
          backgroundColor: dark ? '#0D0D0D' : '#f6f6f7',
          borderBottomColor,
          borderBottomWidth: hideBorder ? 0 : 1,
        },
      ]}
    >
      <View
        style={{
          // paddingTop: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: 1,
        }}
      >
        {leftView}

        <StyledText
          style={{
            ...styles.titletext,
            color: dark ? brandColors.scale100 : brandColors.black,
          }}
        >
          {title}
        </StyledText>

        {RightView}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  headview: {
    height: getHeight(4),

    flexDirection: 'row',

    justifyContent: 'space-between',
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: 'rgba(18, 107, 135, 0.25)',
    borderBottomColor: '#e6eaec',
    borderBottomWidth: 1,
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 0,
    // marginBottom: getHeight("6"),
  },
  titletext: {
    fontSize: getFontSize(2.5),
    lineHeight: getFontSize(4),
    fontFamily: 'OpenSans-Medium',
  },
});
export default Header;
