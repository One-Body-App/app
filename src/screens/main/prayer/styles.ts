import { Platform, StyleSheet } from 'react-native';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';

const isAndroid = Platform.OS === 'android';

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
  liquidIndicatorContainer: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(18, 107, 135, 0.45)',
  },
  liquidCanvasLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liquidCore: {
    width: '78%',
    height: '78%',
    borderRadius: 999,
    backgroundColor: 'rgba(18, 210, 217, 0.28)',
    shadowColor: '#12D2D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isAndroid ? 0 : 0.2,
    shadowRadius: isAndroid ? 0 : 8,
    elevation: isAndroid ? 0 : 2,
  },
  liquidBlob: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(18, 210, 217, 0.22)',
  },
  liquidBlobLeft: {
    left: '20%',
  },
  liquidBlobRight: {
    right: '20%',
  },
});

export default styles;
