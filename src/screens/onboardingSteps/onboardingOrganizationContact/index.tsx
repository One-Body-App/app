import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { Avatar, Checkbox, Provider } from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/src/components/Header';
import Button from '@/src/components/Button';
import { styles } from './styles';

const BordingStepFour = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View
          style={{
            justifyContent: 'space-around',
            alignItems: 'center',
            height: getHeight(30),
          }}
        >
          <Image source={require('@/assets/images/LogoMain.png')} />
          <Text style={styles.text}>Step 4 of 4</Text>
          <Text style={styles.heading}>Use location</Text>
        </View>
        <Text style={{ marginTop: 20, fontFamily: 'Rubik-Regular' }}>
          Allow OneBody to use your location for the best possible experience while your Body finds
          peace. Amen!
        </Text>

        <View />
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={{
            flex: 1,
            justifyContent: 'space-around',
            alignItems: 'center',
            flexDirection: 'row',
          }}
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
          <TouchableOpacity onPress={() => navigation.navigate('AccountType')}>
            <Text style={styles.footerText}>
              Next <Ionicons name="chevron-forward" size={getFontSize(3)} />
            </Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};
export default BordingStepFour;
