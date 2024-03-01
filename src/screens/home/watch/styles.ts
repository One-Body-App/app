import { StyleSheet } from 'react-native';
import { spacing } from '@/src/styles/spacing';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';

const styles = StyleSheet.create({
  container: {
    height: getHeight(74.2),
    flex: 1,
  },
  videoContainer: {

    // width: '100%',
    // height: '100%',
    // width: getWidth(100),
    // height: getHeight(100),
    // backgroundColor: '#E6EAEC',

    //flex: 1,
    //overflow: 'hidden',
    //height: getHeight(74.2),
    //width: getWidth(100),

  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: 'rgba(0,0,0,0.9)',
    // color: '#FFF',

    //backgroundColor: 'transparent',
    //paddingTop: 230,
    //color: '#FFF',

    fontSize: 16,
  },
  video: {
    flexGrow: 1,
  },
  userName: {
    color: 'white',
    fontSize: spacing.x16,
    marginBottom: spacing.x5,
    marginLeft: spacing.x10,
    marginVertical: spacing.x10,
    flexDirection: 'row',
  },
  usertime: {
    flexDirection: 'row',
    color: 'white',
    fontSize: spacing.x16,
  },
  profilePhoto: {
    width: spacing.x32,
    height: spacing.x32,
    borderRadius: spacing.x16,
    marginRight: spacing.x10,
    marginLeft: spacing.x5,
  },
  ellipsisIcon: {
    marginLeft: 275,
  },
  videoDescription: {
    fontSize: spacing.x16,
    left: spacing.x5,
    marginTop: spacing.x5,
    marginLeft: spacing.x5,
    marginBottom: spacing.x5,
  },
  icons: {
    bottom: spacing.x5,
    left: spacing.x5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.x48,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.x20,
    marginLeft: spacing.x10,
  },
  sendIconContainer: {
    bottom: spacing.x5,
    right: spacing.x5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionsContainer: {
    bottom: spacing.x5,
    left: spacing.x5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.x48,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: spacing.x5,
    borderRadius: spacing.x5,
    elevation: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    marginBottom: spacing.x5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default styles;
