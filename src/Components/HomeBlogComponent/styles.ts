import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  continer: {
    flex: 1,
  },

  blogpostview: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  blogpostimage: {
    height: getHeight(12),
    width: getWidth(38),
    borderRadius: 16,
    marginBottom: 5,
    shadowColor: '#0e5469',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 0,
  },
  blogpostpara: {
    padding: 5,
    marginTop: getHeight(1),
    lineHeight: 18,
    color: '#032F3C',
    fontFamily: 'Rubik-Medium',

    width: 150,
  },
  blogposthour: {
    padding: 8,
    color: '#757575',
    width: getWidth(40),
    alignSelf: 'stretch',
  },
});
