import React, { useRef, useState } from 'react';
import { Text, View, Image, ImageBackground, TouchableOpacity, SafeAreaView } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';

const BordingStepThree = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.logomainimg}>
          <Image source={require('@/assets/images/LogoMain.png')} />
          <Text style={{ fontFamily: 'Rubik-Regular' }}>Step 3 of 4</Text>
          <Text style={styles.heading}>Allow notifications</Text>
        </View>
        <Text style={{ marginTop: getHeight(5), fontFamily: 'Rubik-Regular' }}>
          Reminders help you break your tenced routine and get your body back where it really needs
          to be. Amen!
        </Text>
        <View style={styles.box}>
          <View>
            <Text style={{ fontFamily: 'Rubik-Regular' }}>Notifications</Text>
            <Text style={{ fontFamily: 'Rubik-Regular' }}>Off</Text>
          </View>
          <Ionicons name="exit-outline" style={{ transform: [{ rotate: '-90deg' }] }} size={20} />
        </View>
        <View />
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.waveimg}
          source={require('@/assets/images/waveBG.png')}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerText}>
              <Ionicons name="chevron-back" size={getFontSize(3)} /> Back
            </Text>
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('BordingStepFour')}>
            <Text style={styles.footerText}>
              Next <Ionicons name="chevron-forward" size={getFontSize(3)} />
            </Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};
export default BordingStepThree;
