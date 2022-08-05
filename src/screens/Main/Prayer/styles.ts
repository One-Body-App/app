import { StyleSheet } from 'react-native';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
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
    fontFamily: 'Rubik-Medium',
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
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    paddingBottom: 5,
  },
});
