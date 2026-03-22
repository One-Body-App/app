import { StyleSheet } from 'react-native';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    justifyContent: 'center',

    minHeight: getHeight(14),
    maxHeight: getHeight(14),
  },
  viewun: {
    height: getHeight(0.4),
    marginTop: 10,
    width: '100%',
    borderRadius: 5,
    backgroundColor: '#12D2D9',
  },
  loyalsty: { width: getWidth(100), backgroundColor: 'red' },
  walltext: {
    // fontSize: getFontSize(2.5),
    fontFamily: 'OpenSans-Medium',
    color: 'white',
    alignSelf: 'center',
    marginTop: getHeight(1.5),
  },
  logview: {
    flexDirection: 'row',

    alignItems: 'center',
    paddingHorizontal: getWidth(5),
    justifyContent: 'space-between',
  },
  btn: {
    backgroundColor: 'blue',
    height: 40,
    width: 40,
    borderRadius: 5,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  TextInput: {
    borderWidth: 1,
    height: getHeight(6),
    width: getWidth(75),
    borderRadius: 5,
  },
  tabBar: {
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 1,
    paddingVertical: 0,
    minHeight: 36,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    padding: 0,
    height: 36,
  },
  liquidCanvasLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default styles;
