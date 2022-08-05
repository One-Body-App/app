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
import LinearGradient from 'react-native-linear-gradient';
import Logo from '@/assets/svg/LogoBlue.svg';
import Icon from 'react-native-vector-icons/Ionicons';

const InfluencerStepOne = ({ navigation }) => {
  const countries = ['option 1', 'option 2', 'option 3', 'option 4'];
  return (
    <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.rolesview}>
          <Logo
            height={getHeight(14)}
            width={getWidth(40)}
            style={{ margin: getHeight(4), alignSelf: 'center' }}
          />

          <Text style={{ ...styles.text, color: '#4F6D77' }}>Step 1 of 3</Text>
          <Text style={{ ...styles.heading, color: '#032F3C', marginTop: 12 }}>
            Influencer rules
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontFamily: 'Rubik-Regular',
              color: '#032F3C',
              fontSize: 16,
            }}
          >
            In order for users to be an influencer they must meet ONE of the following criteria:
          </Text>
          <Text
            style={{
              fontFamily: 'Rubik-Regular',
              color: '#032F3C',
              marginTop: 20,
              fontSize: 16,
            }}
          >
            <Text style={styles.point}>a.</Text> Must have a confirmed Influencer account on IG or
            Twitter. (Blue check) All IG/Twitter accounts must be set as public figure accounts in
            order for API to aggregate their posts.
          </Text>
          <Text
            style={{
              fontFamily: 'Rubik-Regular',
              color: '#032F3C',
              marginTop: 20,
              fontSize: 16,
            }}
          >
            <Text style={styles.point}>b.</Text> User must be a Pastor or clergy member in local
            community. Confirmed through account review process. *Influencer accounts can be
            approved through cross-confirmation via organization confirmation process.
          </Text>
          <Text
            style={{
              fontFamily: 'Rubik-Regular',
              color: '#032F3C',
              marginTop: 20,
              fontSize: 16,
            }}
          >
            <Text style={styles.point}>c.</Text> User must be a non-clergy public figure with a
            platform based on Christian values as defined by One Body. This will require account
            review.
          </Text>
        </View>
        <View />
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.backgroundimagestyle}
          source={require('@/assets/images/waveBG.png')}
        >
          <View style={{ width: getWidth(10) }} />
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('InfluencerStepTwo')}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={styles.footerText}>Next</Text>
            <Ionicons name="chevron-forward" size={getFontSize(3)} />
          </TouchableOpacity>
        </ImageBackground>
      </View>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.header}>
        <Icon name="chevron-back" style={{ margin: getFontSize(3) }} size={20} color={'#4F6D77'} />
      </TouchableOpacity>
    </LinearGradient>
  );
};
export default InfluencerStepOne;
