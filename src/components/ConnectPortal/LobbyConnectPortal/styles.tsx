import { StyleSheet } from 'react-native';
import { spacing } from '@/src/styles/spacing';

const lobbyConnectPortalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    height: '85%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 30,
    zIndex: 1000,
    justifyContent: 'flex-start',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '42.5%',
    marginBottom: 10,
    borderRadius: 10,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    textAlign: 'center',
    paddingVertical: spacing.x5,
    flexWrap: 'wrap',
    color: '#5A5C5B',
    fontSize: 16,
    paddingHorizontal: 5,
  },
  button: {
    backgroundColor: '#126B87',
    borderRadius: 25,
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 'auto',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  textTab: {
    color: '#032F3C',
    textAlign: 'center',
    fontSize: 22,
    height: 40,
    paddingVertical: 2,
  },
  indicatorActive: {
    backgroundColor: '#032F3C',
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
    marginTop: 5,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'gray',
    marginHorizontal: 5,
  },
});

export default lobbyConnectPortalStyles;
