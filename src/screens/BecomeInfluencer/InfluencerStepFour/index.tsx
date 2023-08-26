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
  Alert,
} from 'react-native';
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

type Props = StackScreenProps<RootStackParamList, 'InfluencerStepFour'>;

const InfluencerStepFour = ({ navigation, route }: Props) => {
  const { data } = route.params;
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);

  const [checked, setChecked] = useState(false);

  const BecomeInfluencer = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: data,
        token: token,
        route: 'influencer/apply-for-influencer',
        verb: 'post',
      });

      if (res?.status == 200) {
        dispatch(setLoader(false));
        Alert.alert(res?.response.message);
        navigation.navigate('Home', {});
      } else {
        console.log('error', res?.response.data);
      }
    } catch (e) {
      console.log('saga become infulancer err --- ', e);
    }
  };

  return (
    <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />
      <ScrollView>
        <View style={styles.innerContainer}>
          <View style={styles.privecystepview}>
            <Logo
              height={getHeight(14)}
              width={getWidth(40)}
              style={{ margin: getHeight(1), alignSelf: 'center' }}
            />

            <Text style={{ ...styles.text, color: '#4F6D77' }}>Step 3 of 3</Text>
            <Text
              style={{
                ...styles.heading,
                color: '#032F3C',
                marginTop: 12,
                fontFamily: 'Rubik-Medium',
              }}
            >
              Influencer Agreement
            </Text>
          </View>

          <View>
            <Text style={styles.headingt}>Overview</Text>
            <Text style={styles.paragraph}>
              If approved, we will begin immediately aggregating your social content from the
              sources you provided. Post normally on your social or RSS feeds and you should see
              content begin to be displayed shortly (usually in less than 1 hour).
            </Text>
            <Text style={styles.paragraph}>
              From time to time we will ask you to re-certify your authentication to Instagram and
              Twitter. This will help us ensure that your account is secure.
            </Text>
            <Text style={styles.paragraph}>
              Any posted content that goes against the One Body Ethos will be filtered and either
              suppressed or entirely removed. Please make yourself familiar with the One Body Ethos.
              You will be notified of any content moderation actions.
            </Text>

            <Text style={styles.headingt}>Your Consent</Text>
            <Text style={styles.paragraph}>
              By completing this application, you acknowledge that you are asking One Body Inc. To
              aggregate and display your original posts and content from 3rd party platforms into
              the One Body app.
            </Text>

            <View style={{ width: getWidth(70), height: getHeight(20) }} />
          </View>
          <View />
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
            onPress={() => BecomeInfluencer()}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={styles.footerText}>Done</Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.header}>
        <Icon name="chevron-back" style={{ margin: getFontSize(3) }} size={20} color={'#4F6D77'} />
      </TouchableOpacity>
    </LinearGradient>
  );
};
export default InfluencerStepFour;
