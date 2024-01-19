import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  socialpostfooter: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialpostview: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    borderRadius: 20,
    padding: 8,
  },
  socialpostimage: {
    height: getHeight(35),
    width: getWidth(85),
    borderRadius: 20,
    marginBottom: 5,
  },
});
