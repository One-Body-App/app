import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  blogpostview: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 8,
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

    fontFamily: 'OpenSans-Medium',

    width: 150,
  },
  blogposthour: {
    padding: 8,
    color: '#757575',
    alignSelf: 'stretch',
  },

  mainButtonWrapper: { flex: 1, marginVertical: spacing.x16 },

  filterButton: {
    paddingHorizontal: spacing.x24,
    paddingVertical: spacing.x10,

    marginRight: spacing.x24,
    borderRadius: borderRadius.xs,
  },
});
