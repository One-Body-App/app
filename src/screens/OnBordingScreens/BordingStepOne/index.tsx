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
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';

const BordingStepOne = ({ navigation }) => {
  const countries = ['option 1', 'option 2', 'option 3', 'option 4'];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.logoimg}>
          <Image source={require('@/assets/images/LogoMain.png')} />
          <Text style={styles.text}>Step 1 of 4</Text>
          <Text style={styles.heading}>Privacy policy</Text>
        </View>

        <Text style={{ fontFamily: 'Rubik-Regular' }}>
          In order for users to be an influencer they must meet ONE of the following criteria:
        </Text>
        <Text style={{ fontFamily: 'Rubik-Regular' }}>
          <Text style={styles.point}>a.</Text>
          Must have a confirmed Influencer account on IG or Twitter. (Blue check) All IG/Twitter
          accounts must be set as public figure accounts in order for API to aggregate their posts.
        </Text>
        <Text style={{ fontFamily: 'Rubik-Regular' }}>
          <Text style={styles.point}>b.</Text>
          User must be a Pastor or clergy member in local community. Confirmed through account
          review process. *Influencer accounts can be approved through cross-confirmation via
          organization confirmation process.
        </Text>
        <Text style={{ fontFamily: 'Rubik-Regular' }}>
          <Text style={styles.point}>c.</Text>
          User must be a non-clergy public figure with a platform based on Christian values as
          defined by One Body. This will require account review.
        </Text>

        <View style={{ flexDirection: 'row' }}>
          <Checkbox status={'checked'} />
          <Text style={{ fontFamily: 'Rubik-Regular' }}>
            I have gone through the document and accept the Privacy Policy.
          </Text>
        </View>
        <View />
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.wavebgview}
          source={require('@/assets/images/waveBG.png')}
        >
          <View style={{ width: getWidth(10) }} />
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('BordingStepTwo')}>
            <Text style={styles.footerText}>
              Next <Ionicons name="chevron-forward" size={getFontSize(3)} />
            </Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};
export default BordingStepOne;
