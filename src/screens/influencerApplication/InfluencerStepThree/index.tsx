import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { Avatar, Checkbox, Provider } from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/src/components/Header';
import Button from '@/src/components/Button';
import { styles } from './styles';
import { async } from 'validate.js';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from '@/redux//actions/GeneralActions';
import { ApiCall } from '@/services/api';
import LinearGradient from 'react-native-linear-gradient';
import Logo from '@/assets/svg/LogoBlue.svg';
import Icon from 'react-native-vector-icons/Ionicons';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { Interest } from '@/utils/types';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { useToast } from 'react-native-toast-notifications';
import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerStepThree'>;

const InfluencerStepThree = ({ navigation, route }: Props) => {
  const { data } = route.params;
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);

  const [interest, setInterest] = useState<Interest[]>([]);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string>('');
  const toast = useToast();

  const [checked, setChecked] = useState(false);

  const getInterest = async () => {
    try {
      const res = await ApiCall({
        route: 'tags/interest',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setInterest(res?.response);
        setSearchInterest(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    if (token) {
      getInterest();
    }
  }, [token]);

  return (
    <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />
      <ScrollView>
        <View style={styles.innerContainer} key={5}>
          <Text
            style={{
              ...styles.heading,
              fontSize: getFontSize(2.3),
              marginBottom: 10,
              lineHeight: 22,
              width: getWidth(80),
            }}
          >
            Select 1 topic <Text style={{ fontWeight: '400' }}>that you want to reach.</Text>
          </Text>

          <TextInput
            style={{ ...GeneralStyle.input, width: getWidth(80) }}
            mode="outlined"
            clearButtonMode="always"
            onChangeText={(text) => {
              const newSearchInterest = [];
              for (let i = 0; i < interest.length; i++) {
                if (interest[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                  newSearchInterest.push(interest[i]);
                }
                setSearchInterest(newSearchInterest);
              }
            }}
            left={
              <TextInput.Icon
                icon={() => (
                  <EvilIcons
                    name={'search'}
                    size={getFontSize(4)}
                    color={'#5B7279'}
                    style={{ marginTop: 5 }}
                  />
                )}
              />
            }
            theme={{ roundness: 40 }}
            activeOutlineColor={'#5B7279'}
            outlineColor="#9EA1A2"
            label={'Search by Interests'}
            placeholderTextColor={'black'}
          />

          <ScrollView contentContainerStyle={{ ...styles.flatlistview, marginTop: 35 }}>
            {searchInterest.length < 1 ? <Text>No Search Results</Text> : null}
            {searchInterest.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedInterest(item?._id)}
                style={
                  selectedInterest == item?._id
                    ? [styles.listItem, { backgroundColor: '#032F3C', borderColor: '#032f3c' }]
                    : styles.listItem
                }
              >
                <Text
                  numberOfLines={1}
                  style={selectedInterest == item?._id ? { color: 'white' } : { color: '#757575' }}
                >
                  {item?.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.imagebackgroundview}
          source={require('@/assets/images/waveBG.png')}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={getFontSize(3)} />
            <Text style={styles.footerText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>

          <TouchableOpacity
            onPress={() => {
              if (selectedInterest) {
                navigation.navigate('InfluencerStepFour', {
                  data: {
                    ...route.params.data,
                    interests: selectedInterest,
                  },
                });
              } else {
                toast.show('Please select 1 topic', {
                  type: 'danger',
                });
              }
            }}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={styles.footerText}>Next</Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.header}>
        <Icon name="chevron-back" style={{ margin: getFontSize(3) }} size={20} color={'#4F6D77'} />
      </TouchableOpacity>
    </LinearGradient>
  );
};
export default InfluencerStepThree;
