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
import { Avatar, Provider } from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';

const orgStepOne = ({ navigation }) => {
  const countries = ['option 1', 'option 2', 'option 3', 'option 4'];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Image source={require('@/assets/images/LogoMain.png')} />
        <Text style={styles.text}>Step 1 of 5</Text>
        <Text style={styles.heading}>Identify your Organization</Text>
        <Text style={styles.text}>What type of Organization are you?</Text>

        <View>
          <SelectDropdown
            data={countries}
            defaultButtonText="Select one"
            buttonStyle={{
              backgroundColor: '#EBF3F5',
              width: getWidth(80),
              margin: 5,
              height: getHeight(6),
            }}
            onSelect={() => console.log('done')}
          />
          <Button
            text={'Church'}
            btnStyle={styles.btn}
            btnTextStyle={styles.btnTitle}
            onPress={() => navigation.navigate('orgStepTwo')}
          />
        </View>
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.bgimg}
          source={require('@/assets/images/waveBG.png')}
        >
          <View style={{ width: getWidth(10) }} />
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('orgStepTwo')}>
            <Text style={styles.footerText}>
              Next <Ionicons name="chevron-forward" size={getFontSize(3)} />
            </Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};
export default orgStepOne;
