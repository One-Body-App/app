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
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';

const OnboardingChurchType = () => {
  return (
    <OnboardingStepsLayout buttonText="Continue" onPress={() => {}}>
      <View style={{ flex: 1 }}></View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingChurchType;
