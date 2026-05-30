import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

const styles = StyleSheet.create({
  continer: {
    flex: 1,
  },
  headview2: {
    height: getHeight(7),
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'white',
    justifyContent: 'center',
    padding: 10,
    alignItems: 'center',
  },
  titletext: {
    fontSize: getFontSize(2.5),
    fontFamily: 'OpenSans-Medium',
    color: '#032F3C',
  },
  blogpostview: {
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: getHeight(22),
    borderRadius: 16,

    // width: '50%',
    flex: 1,

    margin: 8,
  },
  blogpostimage: {
    height: getHeight(10),

    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 5,

    boxShadow: '0 1px 30px rgba(14, 84, 105, 0.3)',
  },
  blogpostpara: {
    padding: 2,
    marginTop: getHeight(1),
    lineHeight: 18,
    color: '#032F3C',
    fontFamily: 'OpenSans-Medium',

    width: 150,
  },
  blogposthour: {
    padding: 8,
    color: '#757575',
    alignSelf: 'stretch',
  },
});

export default styles;
