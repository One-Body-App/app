import React, { ReactNode } from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';

type Props = {
  title: string;
  leftView: ReactNode;
  RightView: ReactNode;
};

const Header = ({ title, leftView, RightView }: Props) => {
  return (
    <View style={styles.headview}>
      <View
        style={{
          paddingTop: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: 1,
        }}
      >
        {leftView}

        <Text style={styles.titletext}>{title}</Text>

        {RightView}
      </View>
    </View>
  );
};
const styles = StyleSheet.create<{ headview: ViewStyle; titletext: TextStyle }>({
  headview: {
    height: getHeight(10),

    flexDirection: 'row',

    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    shadowColor: 'rgba(18, 107, 135, 0.25)',
    borderBottomColor: 'rgba(18, 107, 135, 0.05)',
    borderBottomWidth: 1,
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 0,
    // marginBottom: getHeight(6),
  },
  titletext: {
    fontSize: getFontSize(2.5),
    fontFamily: 'Rubik-Medium',
    color: '#032F3C',
  },
});
export default Header;
