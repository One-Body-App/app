import { StyleSheet } from 'react-native';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { appColor } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: getHeight(6),
    overflow: 'hidden',
    shadowColor: '#126BB7',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    // padding: 16,
  },
  animatedview: {
    height: getHeight(0.4),
    marginTop: getHeight(1),
    width: '40%',
    borderRadius: 5,
    backgroundColor: '#12D2D9',
  },
  animatedview2: {
    height: getHeight(0.4),
    marginTop: getHeight(1),
  },
  selectedTabText: {
    color: 'white',
    fontFamily: 'Rubik-Medium',
    fontSize: getFontSize(2.3),
  },
  TabTex: { color: appColor.SecoundryColor, fontSize: getFontSize(2.3) },
  headview: {
    height: getHeight(8),

    flexDirection: 'row',

    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    shadowColor: '#126BB7',
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
});
