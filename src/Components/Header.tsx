import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';

const Header = ({ title, leftView, RightView, leftPress, rightPress }) => {
  return (
    <View style={styles.headview}>
      {leftView}

      <Text style={styles.titletext}>{title}</Text>

      {RightView}
    </View>
  );
};
const styles = StyleSheet.create({
  headview: {
    height: getHeight(8),

    flexDirection: 'row',
    backgroundColor: 'white',
    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    shadowColor: '#126BB7',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
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
