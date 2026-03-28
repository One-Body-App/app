import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  continer: {
    flex: 1,
    paddingHorizontal: getWidth(3),
  },
  contentContainer: {
    paddingBottom: getHeight(2),
  },
  headingView: {
    justifyContent: 'space-between',
    marginTop: getHeight(1.5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getWidth(2),
  },
  heading: {
    fontSize: getFontSize(2),
    fontFamily: 'OpenSans-Regular',
    fontWeight: '500',
    letterSpacing: 0.1,
    color: '#032F3C',
  },
  text: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    fontWeight: '400',
    color: '#70747D',
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 5,
    marginVertical: 5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'gray',
    flex: 1,
  },
  topicRow: {
    flexDirection: 'row',
    marginTop: getHeight(1.2),
  },
  topicRowItem: {
    flex: 1,
  },
  articleSection: {
    marginTop: getHeight(2.5),
  },
  articleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleContent: {
    flexDirection: 'row',
    width: '70%',
    alignItems: 'center',
  },
  articleCopy: {
    marginLeft: getWidth(2),
  },
  articleSource: {
    letterSpacing: 1.5,
    marginBottom: getHeight(0.8),
  },
  rowSeparator: {
    height: getHeight(2),
  },
  sectionFooter: {
    height: getHeight(2),
  },
  image: {
    height: getHeight(8),
    width: getWidth(18),
    borderRadius: 10,
  },
});
