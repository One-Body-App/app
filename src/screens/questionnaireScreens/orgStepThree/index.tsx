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
import Header from '@/src/components/Header';
import Button from '@/src/components/Button';
import { styles } from './styles';

const orgStepThree = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Image source={require('@/assets/images/LogoMain.png')} />
        <Text style={styles.text}>Step 3 of 5</Text>
        <Text style={styles.heading}>Identify your Organization</Text>
        <Text style={styles.text}>Who will be the Primary Contact for your Organization?</Text>

        <View>
          <TextInput
            style={styles.TextInput}
            mode="outlined"
            activeOutlineColor={'#5B7279'}
            label={'Full Name'}
            placeholder="Full Name"
          />
          <TextInput
            style={styles.TextInput}
            mode="outlined"
            activeOutlineColor={'#5B7279'}
            label={'Email'}
            placeholder="Email"
          />
          <TextInput
            style={styles.TextInput}
            mode="outlined"
            activeOutlineColor={'#5B7279'}
            label={'Phone number'}
            placeholder="Phone number"
          />
        </View>
        <Text style={{ ...styles.text, width: getWidth(80), textAlign: 'justify' }}>
          Note: This person will serve as the representative for your account and will be
          responsible for all account related communications.{' '}
        </Text>
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.wimg}
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
          <TouchableOpacity onPress={() => navigation.navigate('four')}>
            <Text style={styles.footerText}>
              Next <Ionicons name="chevron-forward" size={getFontSize(3)} />
            </Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};
export default orgStepThree;
