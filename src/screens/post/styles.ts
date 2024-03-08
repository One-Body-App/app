import { StyleSheet } from 'react-native';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  subContainer: {
    flex: 0.9,
    borderWidth: 1,
    marginTop: 44,
  },
  button: {
    backgroundColor: 'gray',
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.0)',
    position: 'absolute',
    justifyContent: 'center',
    width: '100%',
    top: 0,
    padding: 20,
  },
  cameraView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.x17,
  },
  buttonContainer: {
    backgroundColor: 'pink',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    bottom: 0,
    padding: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  camButton: {
    height: 80,
    width: 80,
    borderRadius: 40,
    // ADD backgroundColor COLOR GREY
    backgroundColor: '#B2BEB5',

    alignSelf: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  image: {
    width: '100%',
    height: '100%',
    aspectRatio: 9 / 16,
  },
  closeImg: { width: 15, height: 15 },
  cameraBtncontainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  btnSubContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.x16,
  },
  galleryPreview: {
    height: 40,
    width: 40,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
  },
  recordButton: {
    height: spacing.x60,
    width: spacing.x60,
    borderWidth: 4,
    borderColor: 'white',
    borderRadius: spacing.x30,
    marginVertical: spacing.x13,
  },
  recordBtnView: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.primarySapphire.brand,
    borderRadius: spacing.x30,
    margin: spacing.x5,
  },
  flipCameraImg: {
    width: 32,
    height: 32,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.x17,
    position: 'absolute',
    width: '100%',
  },
  imgPreview: { flex: 1, borderRadius: 8 },
  bottomContainer: {
    flex: 0.4,
    marginHorizontal: spacing.x16,
    marginTop: 20,
  },
  noCam: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default styles;
