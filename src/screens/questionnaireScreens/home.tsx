import { StyleSheet, Text, View, Image, ImageBackground, TouchableOpacity } from 'react-native';
import React from 'react';
import { COLORS, THEME } from '../../constants';

const LandingScreen = (props) => {
  return (
    // <View style={styles.container}>
    <ImageBackground
      resizeMode="cover"
      style={styles.container}
      source={require('@/assets/images/gradient.png')}
    >
      <View style={styles.header}>
        <View style={styles.topView}>
          <Image style={styles.iconContainer} source={require('@/assets/icons/Bluelogo.png')} />
        </View>
        <View style={styles.options}>
          <Text style={styles.title}>Let’s Get To Know You.</Text>
          <Text style={styles.subTitle}>
            Share with us a little it about your faith journey so that we can curate your stream to
            your needs. This should only take about 2-3 minutes to complete.
          </Text>
        </View>
      </View>
      <View style={styles.buttonListLogin}>
        <View style={styles.buttonContainerLogin}>
          <TouchableOpacity
            onPress={() => props.navigation.navigate('one')}
            style={styles.btnTitleLogin}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Let’s go</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

export default LandingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
  },
  header: {
    flex: 0.5,
    justifyContent: 'center',
  },
  topView: {
    marginTop: 20,
    alignItems: 'center',
  },
  iconContainer: {
    //   width: 120,
    //   height: 120,
  },
  title: {
    color: COLORS.darkblue,
    fontSize: 24,
    fontWeight: THEME.fontWeight.bold,
    marginTop: 30,
    textAlign: 'justify',
  },
  subTitle: {
    color: COLORS.darkblue,
    fontSize: 16,
    marginHorizontal: 40,
    // alignSelf:'center',
    // justifyContent:'center',
    textAlign: 'center',
    marginTop: 10,
  },
  options: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    textAlign: 'center',
  },
  optionsText: {
    fontSize: 20,
    color: COLORS.lightWhite,
    fontWeight: '500',
    paddingBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginTop: 20,
    borderColor: COLORS.purple,
  },
  btnIcon: {
    width: 24,
    height: 24,
    marginHorizontal: 10,
  },
  btnTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  buttonList: {
    marginHorizontal: 30,
    justifyContent: 'center',
    flex: 0.5,
  },
  buttonListLogin: {
    marginHorizontal: 30,
    justifyContent: 'flex-start',
    flex: 0.4,
    justifyContent: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: COLORS.purple,
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    height: 120,
  },

  buttonContainerLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginTop: 20,
    borderColor: COLORS.purple,
    backgroundColor: COLORS.btnBackground,
  },

  btnTitleLogin: {
    fontSize: 18,
    fontWeight: '500',
    paddingHorizontal: 100,
    height: 50,
    textAlignVertical: 'center',
    justifyContent: 'center',
    color: COLORS.lightWhite,
  },
  inputContainer: {
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    borderColor: COLORS.grey,
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 30,
  },
  inputContainerPassword: {
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginTop: 30,
    borderColor: COLORS.grey,
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 30,
  },
  input: {
    height: 30,
    margin: 10,
    width: '90%',
  },
  inputPassword: {
    height: 30,
    margin: 10,
    width: '85%',
  },
  alreadyAccountContainer: {
    alignSelf: 'center',
    marginTop: 30,
    flexDirection: 'row',
  },
  socialContainer: {
    height: 45,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: COLORS.lightWhite,
    borderColor: COLORS.lightWhite,
    borderRadius: 10,
    width: '28%',
  },
});
