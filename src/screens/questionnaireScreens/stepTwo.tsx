import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground } from 'react-native';
import React, { useState } from 'react';
import { COLORS, THEME } from '../../constants';

const StepTwo = (props) => {
  const [color1, setColor1] = useState(false);
  const [color2, setColor2] = useState(false);
  const [color3, setColor3] = useState(false);
  const [color4, setColor4] = useState(false);
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
        <View>
          <Text
            style={{
              textAlign: 'center',
              marginVertical: 20,
              color: '#595959',
              fontSize: 14,
              marginTop: 40,
            }}
          >
            Step 2 of 5
          </Text>
          <Text style={styles.title}>How often do you attend church?</Text>
          <TouchableOpacity
            onPress={() => {
              setColor1(!color1);
            }}
            style={
              color1 == true
                ? {
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: '#032F3C',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 30,
                    marginTop: 20,
                  }
                : {
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: '#F6F6F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 30,
                    marginTop: 20,
                  }
            }
          >
            <Text style={color1 == true ? { color: 'white' } : { color: '#757575' }}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setColor2(!color2);
            }}
            style={
              color2 == true
                ? {
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: '#032F3C',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 30,
                    marginTop: 20,
                  }
                : {
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: '#F6F6F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 30,
                    marginTop: 20,
                  }
            }
          >
            <Text style={color2 == true ? { color: 'white' } : { color: '#757575' }}>
              Bi-Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setColor3(!color3);
            }}
            style={
              color3 == true
                ? {
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: '#032F3C',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 30,
                    marginTop: 20,
                  }
                : {
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: '#F6F6F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 30,
                    marginTop: 20,
                  }
            }
          >
            <Text style={color3 == true ? { color: 'white' } : { color: '#757575' }}>
              Once a month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setColor4(!color4);
            }}
            style={
              color4 == true
                ? {
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: '#032F3C',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 30,
                    marginTop: 20,
                  }
                : {
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: '#F6F6F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 30,
                    marginTop: 20,
                  }
            }
          >
            <Text style={color4 == true ? { color: 'white' } : { color: '#757575' }}>
              I only watch at home
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <ImageBackground
          resizeMode="contain"
          style={{ width: '100%', height: 120 }}
          source={require('@/assets/images/footer.png')}
        >
          <TouchableOpacity
            onPress={() => props.navigation.navigate('three')}
            style={{
              flexDirection: 'row',
              position: 'absolute',
              top: 50,
              right: 50,
            }}
          >
            <Text style={styles.footerText}>NEXT</Text>
            <Image style={{ height: 20 }} source={require('@/assets/icons/arrowRight.png')} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => props.navigation.goBack()}
            style={{
              flexDirection: 'row',
              position: 'absolute',
              top: 50,
              left: 40,
            }}
          >
            <Image style={{ height: 20 }} source={require('@/assets/icons/backBlack.png')} />
            <Text style={[styles.footerText, { marginLeft: 20 }]}>BACK</Text>
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>
        </ImageBackground>
      </View>
    </ImageBackground>
  );
};

export default StepTwo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: COLORS.lightWhite,
    // backgroundColor:'gray'
  },
  header: {
    flex: 1.6,
    justifyContent: 'center',
  },
  topView: {
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 10,
    // width: 130,
    // height: 120,
    // height:140,
  },
  title: {
    color: COLORS.darkblue,
    fontSize: 20,
    fontWeight: THEME.fontWeight.bold,
    marginHorizontal: 70,
    textAlign: 'center',
  },
  subTitle: {
    color: COLORS.darkblue,
    fontSize: 15,
    marginTop: 10,
  },
  options: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
    justifyContent: 'center',
    flex: 0.5,
    marginTop: 30,
  },
  footerText: {
    textAlign: 'center',
    color: '#032F3C',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 20,
  },
  footer: {
    height: 120,
    margin: -10,
    justifyContent: 'flex-end',
    flex: 0.6,
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
    paddingHorizontal: 120,
    height: 50,
    textAlignVertical: 'center',
    justifyContent: 'center',
    color: COLORS.lightWhite,
  },
  inputContainer: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 100,
    marginHorizontal: 30,
  },
  inputContainerPassword: {
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginTop: 20,
    borderColor: COLORS.grey,
    justifyContent: 'center',
    flexDirection: 'row',
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
  progressBar: {
    width: 100,
    height: 7,
    backgroundColor: '#032F3C',
    borderRadius: 5,
    position: 'absolute',
    top: 55,
    left: '36%',
  },
  progressBarStatus: {
    position: 'absolute',
    backgroundColor: '#12D2D9',
    width: 40,
    height: 7,
    borderRadius: 5,
  },
});
