import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,
    backgroundColor: '#EAEAEA',
    marginBottom: 5,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: getHeight(1),
    backgroundColor: '#fff',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  propview: {
    height: getHeight(0.4),
    marginTop: 4,
    width: '80%',
    borderRadius: 5,
    backgroundColor: '#12D2D9',
  },
  propview2: {
    height: getHeight(0.4),
    marginTop: 4,
    width: '80%',
    borderRadius: 5,
    backgroundColor: '#F6F6F6',
  },
});
