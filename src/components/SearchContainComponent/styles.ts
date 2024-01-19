import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  continer: {
    flex: 1,
    paddingHorizontal: getWidth(3),
  },
  headingView: {
    justifyContent: 'space-between',
    marginTop: getHeight(1.5),
    flexDirection: 'row',
  },
  heading: {
    fontSize: getFontSize(2),
    fontFamily: 'Rubik-Regular',
    fontWeight: '500',
    letterSpacing: 0.1,
    color: '#032F3C',
  },
  text: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: '#70747D',
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 5,
    marginVertical: 5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'gray',
  },
  image: {
    height: getHeight(8),
    width: getWidth(18),
    borderRadius: 10,
  },
});
