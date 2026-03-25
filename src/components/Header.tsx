import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { getFontSize } from '@/utils/ResponsiveFun';
import {
  APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
} from '@/src/styles/headerLayout';
import StyledText from './styled/Text';

type Props = {
  title: string;
  leftView: ReactNode;
  RightView: ReactNode;
  hideBorder?: boolean;
};

function Header({ title, leftView, RightView, hideBorder = false }: Props) {
  const { dark } = useTheme();
  const brandColors = {
    primaryBase: '#41899f',
    primaryDark: '#126b87',
    accentBase: '#41dbe1',
    accentDark: '#12d2d9',
    scale100: '#e6eaec',
    black: '#032f3c',
  };
  let borderBottomColor = dark ? 'rgba(255,255,255,0.08)' : brandColors.scale100;
  let headerBackgroundColor = dark ? '#0D0D0D' : '#f6f6f7';
  if (Platform.OS === 'android' && !dark) {
    headerBackgroundColor = 'white';
  }
  if (hideBorder) {
    borderBottomColor = 'transparent';
  }

  return (
    <View
      style={[
        styles.headview,
        {
          backgroundColor: headerBackgroundColor,
          borderBottomColor,
          borderBottomWidth: hideBorder ? 0 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.sideSlot}>{leftView}</View>

        <View style={Platform.OS === 'android' ? styles.titleWrapAndroid : styles.titleWrapIOS}>
          <StyledText
            style={[
              styles.titletext,
              {
                color: dark ? brandColors.scale100 : brandColors.black,
              },
            ]}
          >
            {title}
          </StyledText>
        </View>

        <View style={styles.sideSlot}>{RightView}</View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  headview: {
    minHeight: APP_HEADER_ROW_HEIGHT,
    paddingHorizontal: 16,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: APP_HEADER_ROW_HEIGHT,
    transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
  },
  sideSlot: {
    width: APP_HEADER_SIDE_WIDTH,
    minHeight: APP_HEADER_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapIOS: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapAndroid: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  titletext: {
    fontSize: getFontSize(2.5),
    lineHeight: getFontSize(4),
    fontFamily: 'OpenSans-Medium',
    textAlign: Platform.OS === 'android' ? 'left' : 'center',
  },
});
export default Header;
