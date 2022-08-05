import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground } from 'react-native';
import React, { useState } from 'react';
import { COLORS, THEME } from '../../constants';

const StepOne = (props) => {
  const [color, setColor] = useState(false);
  return (
    <ImageBackground
      resizeMode="cover"
      style={styles.container}
      source={require('@/assets/images/gradient.png')}
    >
      <View style={styles.header}>
        <View style={styles.topView}>
          <Image style={styles.iconContainer} source={require('@/assets/icons/Bluelogo.png')} />
        </View>
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
          Step 1 of 5
        </Text>
        <Text style={styles.title}> What type of church do you attend?</Text>
        <TouchableOpacity
          style={{
            height: 60,
            borderRadius: 10,
            backgroundColor: '#EBF3F6',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
            marginHorizontal: 30,
            flexDirection: 'row',
          }}
        >
          <Text style={{ color: '#5B7279' }}>Select One</Text>

          <Image
            style={{ marginLeft: 20, height: 10 }}
            source={require('@/assets/icons/arrowDown.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setColor(!color);
          }}
          style={
            color == true
              ? {
                  height: 60,
                  borderRadius: 10,
                  backgroundColor: '#032F3C',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginHorizontal: 30,
                  marginTop: 10,
                }
              : {
                  height: 60,
                  borderRadius: 10,
                  backgroundColor: '#F6F6F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginHorizontal: 30,
                  marginTop: 10,
                }
          }
        >
          <Text style={color == true ? { color: 'white' } : { color: '#757575' }}>
            Non-Denomination
          </Text>
          {color == true && (
            <View
              style={{
                backgroundColor: '#126B87',
                width: 25,
                height: 25,
                borderRadius: 15,
                position: 'absolute',
                top: 18,
                left: 60,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                style={{ width: 15, height: 15 }}
                source={require('@/assets/icons/arrowRight.png')}
              />
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <ImageBackground
          resizeMode="contain"
          style={{ width: '100%', height: 120 }}
          source={require('@/assets/images/footer.png')}
        >
          <TouchableOpacity
            onPress={() => props.navigation.navigate('two')}
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
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>
        </ImageBackground>
      </View>
    </ImageBackground>
  );
};

export default StepOne;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flex: 0.7,
    justifyContent: 'center',
  },
  topView: {
    // justifyContent: 'flex-end',
    alignItems: 'center',
    // flex: 0.8,
  },
  iconContainer: {
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
    // fontWeight: THEME.fontWeight.bold,
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
    flex: 1,
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
    // borderWidth: 1,
    height: 50,
    borderRadius: 10,
    // borderColor: COLORS.grey,
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
    left: '35%',
  },
  progressBarStatus: {
    position: 'absolute',
    backgroundColor: '#12D2D9',
    width: 20,
    height: 7,
    borderRadius: 5,
  },
});
