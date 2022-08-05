import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground } from 'react-native';
import React, { useState } from 'react';
import { COLORS, THEME } from '../../constants';
import LinearGradient from 'react-native-linear-gradient';
import { TextInput } from 'react-native-paper';

const StepThree = (props) => {
  const [code, setCode] = useState('');
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
            Step 3 of 5
          </Text>
          <Text style={[styles.title, { marginHorizontal: 80 }]}>What is your date of birth?</Text>
          <View
            style={{
              marginVertical: 20,
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              marginHorizontal: 30,
            }}
          >
            {/* <View style={{ height: 50, width: 75, borderRadius: 10, borderWidth: 1, padding: 5, justifyContent: 'center', borderColor: '#757575' }}> */}
            <TextInput
              style={{ height: 50, width: 140, fontWeight: '700' }}
              maxLength={2}
              mode="outlined"
              theme={{ roundness: 10 }}
              activeOutlineColor={'#5B7279'}
              label={'Month'}
              placeholderTextColor={'black'}
              placeholder="Month"
            />
            {/* </View> */}
            {/* <View style={{ height: 50, width: 75, borderRadius: 10, borderWidth: 1, padding: 5, justifyContent: 'center', borderColor: '#757575' }}> */}
            {/* <TextInput style={{ height: 50, width: 75 }} maxLength={2} mode='outlined' theme={{ roundness: 10 }} activeOutlineColor={'#5B7279'} label={'Day'} placeholderTextColor={'black'} placeholder='Day' /> */}
            {/* </View> */}
            {/* <View style={{ height: 50, width: 75, borderRadius: 10, borderWidth: 1, padding: 5, justifyContent: 'center', borderColor: '#757575' }}> */}
            <TextInput
              style={{ height: 50, width: 140, fontWeight: '700' }}
              maxLength={4}
              mode="outlined"
              theme={{ roundness: 10 }}
              activeOutlineColor={'#5B7279'}
              label={'Year'}
              placeholderTextColor={'black'}
              placeholder="Year"
            />
            {/* </View> */}
          </View>
          <Text style={[styles.title, { marginVertical: 20 }]}>Where are you located?</Text>
          <View style={{ marginHorizontal: 40 }}>
            {/* <TextInput placeholderTextColor={'black'} style={{ paddingHorizontal: 20 }} placeholder='City, State' /> */}
            <TextInput
              style={{ height: 50, fontWeight: '700' }}
              mode="outlined"
              theme={{ roundness: 10 }}
              activeOutlineColor={'#5B7279'}
              label={'City, State'}
              placeholderTextColor={'black'}
              placeholder="City, State"
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ImageBackground
          resizeMode="contain"
          style={{ width: '100%', height: 120 }}
          source={require('@/assets/images/footer.png')}
        >
          <TouchableOpacity
            onPress={() => props.navigation.navigate('four')}
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

export default StepThree;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flex: 1.4,
    justifyContent: 'flex-start',
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
    marginTop: 70,
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
    width: 60,
    height: 7,
    borderRadius: 5,
  },
});
