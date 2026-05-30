import { StyleSheet } from 'react-native';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { appColor } from '../../constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: getHeight(6),
    overflow: 'hidden',
    boxShadow: '0 20px 20px rgba(18, 107, 183, 0.1)',
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
    fontFamily: 'OpenSans-Medium',
    fontSize: getFontSize(2.3),
  },
  TabTex: { color: appColor.SecoundryColor, fontSize: getFontSize(2.3) },
  headview: {
    height: getHeight(8),

    flexDirection: 'row',

    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    boxShadow: '0 25px 20px rgba(18, 107, 183, 0.1)',
  },
});

export default styles;
