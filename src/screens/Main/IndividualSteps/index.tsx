import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  PermissionsAndroid,
  ScrollView,
  Platform,
  useColorScheme,
  StatusBar,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import Modal from 'react-native-modal';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/src/components/Button';
import { styles } from './styles';
import { Divider, Switch, TextInput, Text } from 'react-native-paper';
import ProgressBar from 'react-native-animated-progress';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';
import MapBox, { MapBoxTypes, MapSuggestion } from '@/src/components/MapBox';
import { ApiCall } from '@/services/api';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { format, parse } from 'date-fns';

// import * as permissions from 'react-native-permissions';
// import MonthPicker from 'react-native-month-year-picker';
import { useDispatch, useSelector } from 'react-redux';
import { profileUpdate, logout } from '@/redux/actions/AuthActions';
import { setLoader } from '@/redux/actions/GeneralActions';
import LinearGradient from 'react-native-linear-gradient';

import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '@/constants/GeneralStyle';
import Group134 from '@/assets/svg/Group134.svg';
import GradientButton from '@/src/components/GradientButton';
import auth from '@react-native-firebase/auth';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Geolocation from 'react-native-geolocation-service';
import { LoginManager } from 'react-native-fbsdk-next';
import messaging from '@react-native-firebase/messaging';
import { useToast } from 'react-native-toast-notifications';
import { RootStackParamList } from '@/src/_Navigation/types';
import { ChurchType, Interest, User } from '@/utils/types';
import { useTheme } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons/faCircle';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'IndividualSteps'>;

const IndividualSteps = ({ navigation }: Props) => {
  const flatListRef = useRef<FlatList>(null);
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const dispatch = useDispatch();
  const [churchAttend, setChurchAttend] = useState<string | null>(null);
  const [location, setLocation] = useState<MapSuggestion | null>(null);
  const [countrySelector, setCountrySelector] = useState<boolean>(false);
  const [location_country, setLocation_country] = useState<MapSuggestion | null>(null);
  const [longitude, setLongitude] = useState<number>();
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number }>();
  const [latitude, setLatitude] = useState<number>();
  const [churchTypeModalVisible, setChurchTypeModalVisible] = useState(false);
  const [churchSubTypeModalVisible, setChurchSubTypeModalVisible] = useState(false);
  const [Organization, setOrganization] = useState<string[]>([]);
  const [curentIndex, setCurrentIndex] = useState(0);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [interest, setInterest] = useState<Interest[]>([]);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string[]>([]);
  const [churchType, setChurchType] = useState<ChurchType | null>(null);
  const [churchSubType, setSubChurchType] = useState<ChurchType | null>(null);
  const [date, setDate] = useState<string>();
  const [open, setOpen] = useState(false);
  const [influencer, setInfluencer] = useState<User[]>([]);
  const [searchInfluencer, setSearchInfluencer] = useState<User[]>([]);
  const [churchTypes, setChurchTypes] = useState<ChurchType[]>([]);
  const toast = useToast();
  const scheme = useColorScheme();
  const { colors } = useTheme();

  //Navigation bar height
  const insets = useSafeAreaInsets();
  const navigationBarHeight = insets.top;

  const requestNotificationPermission = async () => {
    await messaging().requestPermission();
  };

  const requestlocationPermison = async () => {
    try {
      if (Platform.OS === 'ios') {
        const permissions = await Geolocation.requestAuthorization('whenInUse');

        if (permissions == 'granted') {
          Geolocation.getCurrentPosition((info) => {
            getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
          });
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          //To Check, If Permission is granted
          Geolocation.getCurrentPosition((info) => {
            getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
          });
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    requestlocationPermison();
  }, []);

  useEffect(() => {
    if (token) {
      getInterest();
      getChurchTypes();
      getInfluencers();
    }
  }, [token]);

  const logoutAction = async () => {
    await auth().signOut();
    LoginManager.logOut();
    dispatch(logout());
  };

  const getInfluencers = async () => {
    try {
      const res = await ApiCall({
        route: 'user/get-users-to-subscribe',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setInfluencer(res.response?.data);

        setSearchInfluencer(res.response?.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getChurchTypes = async () => {
    try {
      const res = await ApiCall({
        route: 'global/church-type',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setChurchTypes(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

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
  const addInterests = async () => {
    // dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: 'user/add-interests',
        token: token,
        params: { interests: selectedInterest },
        verb: 'patch',
      });

      if (res?.status == 200) {
        getInfluencers();
        // dispatch(setLoader(false));

        next();
      } else {
        dispatch(setLoader(false));
        console.log('error', res);
      }
    } catch (e: any) {
      showToast('An error acoured pls try again!');
      console.log('saga error -- ', e.toString());
    }
  };

  const addFollowing = async () => {
    try {
      const res = await ApiCall({
        route: 'user/add-following',
        token: token,
        params: { following: Organization },
        verb: 'patch',
      });

      if (res?.status != 200) {
        // getInfluencers();
        // dispatch(setLoader(false));

        // next();
        // } else {
        dispatch(setLoader(false));
        console.log('error', res);
      }
    } catch (e: any) {
      showToast('An error acoured pls try again!');
      console.log('saga error -- ', e.toString());
    }
  };

  const getcurrentLocation = (longitude: number, latitude: number) => {
    setLocationData({ longitude, latitude });
  };

  // const handelSubscribe = async (id : string) => {
  //   try {
  //     const res = await ApiCall({
  //       route: `individual/subscribe/${id}`,
  //       token: token,
  //       verb: 'patch',
  //     });
  //     if (res.status == 200) {
  //       console.log('res==200', res);
  //     } else {
  //       console.log('res==400', res);
  //     }
  //   } catch (e) {
  //     console.log('saga sign up err --- ', e);
  //   }
  // };
  // const onValueChange = useCallback(
  //   (event, newDate) => {
  //     const selectedDate = newDate || date;

  //     setOpen(false);
  //     setDate(selectedDate);
  //   },
  //   [date, open]
  // );

  const data = [
    {
      id: 1,
      component: (
        <View style={styles.innerContainer}>
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

          <Text
            style={{
              ...styles.heading,
              width: getWidth(80),
              margin: getHeight(0.5),
              color: scheme == 'dark' ? colors.text : '#032F3C',
            }}
          >
            Let’s Get To Know You.
          </Text>
          <Text style={{ ...styles.text, width: '80%' }}>
            This should only take about 2-3 minutes to complete.
          </Text>
          <Group134 style={{ margin: getHeight(5) }} />
          <View style={{ flexDirection: 'row' }}>
            <GradientButton
              text={'LET’S GET STARTED'}
              btnStyle={{
                ...GeneralStyle.btn,
                marginTop: getHeight(4),
                height: getHeight(9),
                width: getWidth(80),
                flex: 0,
              }}
              btnTextStyle={{ ...GeneralStyle.btnText, color: '#FFF' }}
              onPress={() => {
                gonext();
              }}
            />
          </View>

          <TouchableOpacity
            onPress={() => logoutAction()}
            style={{ marginVertical: 10, borderBottomWidth: 0 }}
          >
            <Text
              style={{ ...styles.logouttext, color: scheme == 'dark' ? colors.text : '#032F3C' }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      id: 2,
      component: (
        <View style={styles.innerContainer} key={2}>
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />
          <Text style={styles.text}>Step 1 of 7</Text>
          <Text style={{ ...styles.heading, color: scheme == 'dark' ? colors.text : '#032F3C' }}>
            What type of church do you attend?
          </Text>

          <View>
            <Button
              text={
                churchType == null || churchType.churchType == 'Non-Denomination'
                  ? 'Select One'
                  : churchType.churchType
              }
              btnStyle={{
                ...styles.btn3,
                backgroundColor: scheme == 'dark' ? colors.text : '#E7F0F3',
              }}
              leftIcon={<View />}
              rightIcon={<Ionicons name="chevron-down" color={'#4F6D77'} size={getFontSize(2.4)} />}
              btnTextStyle={styles.btnText3}
              onPress={() => setChurchTypeModalVisible(true)}
            />

            {churchType && churchType?.children?.length > 0 ? (
              <Button
                text={churchSubType == null ? 'Select One' : churchSubType.churchType}
                btnStyle={styles.btn3}
                leftIcon={<View />}
                btnTextStyle={styles.btnText3}
                onPress={() => setChurchSubTypeModalVisible(true)}
              />
            ) : null}
          </View>
        </View>
      ),
    },
    {
      id: 3,
      component: (
        <View style={styles.innerContainer} key={4}>
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

          <Text style={styles.text}>Step 2 of 7</Text>
          <Text style={{ ...styles.heading, color: scheme == 'dark' ? colors.text : '#032F3C' }}>
            How often do you attend church?
          </Text>

          <View>
            {churchAttend == 'Weekly' ? (
              <Button
                text={'Weekly'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchAttend(null)}
              />
            ) : (
              <Button
                text={'Weekly'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchAttend('Weekly')}
              />
            )}
            {churchAttend == 'Bi-Weekly' ? (
              <Button
                text={'Bi-Weekly'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchAttend(null)}
              />
            ) : (
              <Button
                text={'Bi-Weekly'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchAttend('Bi-Weekly')}
              />
            )}
            {churchAttend == 'Once a month' ? (
              <Button
                text={'Once a month'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchAttend(null)}
              />
            ) : (
              <Button
                text={'Once a month'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchAttend('Once a month')}
              />
            )}
            {churchAttend == 'I only watch at home' ? (
              <Button
                text={'I only watch at home'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchAttend(null)}
              />
            ) : (
              <Button
                text={'I only watch at home'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchAttend('I only watch at home')}
              />
            )}
          </View>
        </View>
      ),
    },
    {
      id: 4,
      component: (
        <View style={styles.innerContainer} key={4}>
          {/* {open && (
            <MonthPicker
              onChange={onValueChange}
              value={date}
              maximumDate={new Date()}
            />
          )} */}
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />
          <Text style={styles.text}>Step 3 of 7</Text>
          <Text
            style={{
              ...styles.heading,
              color: scheme == 'dark' ? colors.text : '#032F3C',
              width: getWidth(80),
            }}
          >
            What is your date of birth?
          </Text>
          <View>
            <TextInput
              mode="outlined"
              label="Date"
              style={{ ...GeneralStyle.input, width: getWidth(80) }}
              activeOutlinecolor={Colors.primarySapphire[500]}
              theme={{ roundness: 10 }}
              showSoftInputOnFocus={false}
              onFocus={() => setOpen(true)}
              onChangeText={(value) => setDate(value)}
              onPressIn={() => setOpen(true)}
              value={date}
              right={
                <TextInput.Icon
                  icon="calendar"
                  onPress={() => setOpen(true)}
                  style={{ paddingTop: 6 }}
                  color={'#032f3c'}
                />
              }
            />

            <DatePicker
              modal
              minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 90))}
              maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 16))}
              mode="date"
              androidVariant="nativeAndroid"
              open={open}
              date={
                date
                  ? parse(date, 'MM/dd/yyyy', new Date())
                  : new Date(new Date().setFullYear(2000))
              }
              onConfirm={(date) => {
                setOpen(false);
                setDate(format(date, 'MM/dd/yyyy'));
              }}
              onCancel={() => {
                setOpen(false);
              }}
              textColor={Platform.OS === 'android' ? 'black' : ''}
            />
          </View>
          <Text
            style={{
              ...styles.heading,
              color: scheme == 'dark' ? colors.text : '#032F3C',
              width: '100%',
            }}
          >
            What City are you in?
          </Text>
          <TextInput
            style={{ ...GeneralStyle.input, width: getWidth(80) }}
            mode="outlined"
            value={location?.place_name ?? ''}
            theme={{ roundness: 10 }}
            activeOutlinecolor={Colors.primarySapphire[500]}
            showSoftInputOnFocus={false}
            onPressIn={(e) => {
              Keyboard.dismiss();
              setCountrySelector(true);
            }}
            label={'City/State'}
            placeholderTextColor={'black'}
          />

          <MapBox
            location={location}
            setLongitude={setLongitude}
            setLatitude={setLatitude}
            CheckIn={countrySelector}
            setCheckIn={setCountrySelector}
            setLocation={setLocation}
          />

          {/* <TextInput
            style={{ ...GeneralStyle.input, width: getWidth(80), marginTop: 20 }}
            mode="outlined"
            value={
              location?.place_name.replace(`, ${location_country?.place_name ?? ''}`, '') ?? ''
            }
            theme={{ roundness: 10 }}
            activeOutlinecolor={Colors.primarySapphire[500]}
            showSoftInputOnFocus={false}
            onPressIn={() => {
              if (location_country) setCheckIn(true);
            }}
            label={'City, State'}
            placeholderTextColor={'black'}
            disabled={!location_country}
          />

          <MapBox
            location={location}
            setLongitude={setLongitude}
            setLatitude={setLatitude}
            CheckIn={CheckIn}
            setCheckIn={setCheckIn}
            setLocation={setLocation}
            countries={location_country ? [location_country.properties.short_code] : []}
            hideSearchMyLocation={true}
            types={[
              MapBoxTypes.region,
              MapBoxTypes.district,
              MapBoxTypes.place,
              MapBoxTypes.postcode,
            ]}
          /> */}
        </View>
      ),
    },
    {
      id: 5,
      component: (
        <View style={styles.innerContainer} key={5}>
          <Text
            style={{
              ...styles.heading,
              fontSize: getFontSize(2.3),
              marginBottom: 10,
              marginTop: 40,
              lineHeight: 22,
              width: getWidth(80),
            }}
          >
            Select a minimum of 3 topics{' '}
            <Text style={{ fontWeight: '400' }}>to personalize your experience.</Text>
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
                    color={Colors.primarySapphire[500]}
                    style={{ marginTop: 5 }}
                  />
                )}
              />
            }
            theme={{ roundness: 40 }}
            activeOutlinecolor={Colors.primarySapphire[500]}
            outlineColor="#9EA1A2"
            label={'Search by Interests'}
            placeholderTextColor={'black'}
          />

          <ScrollView contentContainerStyle={{ ...styles.flatlistview, marginTop: 35 }}>
            {searchInterest.length < 1 ? <Text>No Search Results</Text> : null}
            {searchInterest.map((item, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() =>
                    selectedInterest.includes(item?._id)
                      ? setSelectedInterest(
                          selectedInterest.filter(function (item2) {
                            return item2 !== item?._id;
                          })
                        )
                      : setSelectedInterest([...selectedInterest, item?._id])
                  }
                  style={
                    selectedInterest.includes(item?._id)
                      ? [styles.listItem, { backgroundColor: '#032F3C', borderColor: '#032f3c' }]
                      : styles.listItem
                  }
                >
                  <Text
                    numberOfLines={1}
                    style={
                      selectedInterest.includes(item?._id)
                        ? { color: 'white' }
                        : { color: '#757575' }
                    }
                  >
                    {item?.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ),
    },
    {
      id: 6,
      component: (
        <View style={styles.innerContainer} key={6}>
          <Text
            style={{
              ...styles.heading,
              fontSize: getFontSize(2.2),
              marginBottom: 10,
              marginTop: 40,
              lineHeight: 22,
              width: getWidth(80),
            }}
          >
            Select Influencers & Organizations{' '}
            <Text style={{ fontWeight: '400' }}>to personalize your Social Feed.</Text>
          </Text>

          <TextInput
            style={{ ...GeneralStyle.input, width: getWidth(80) }}
            mode="outlined"
            clearButtonMode="always"
            onChangeText={(text) => {
              const newSearchInfluencer = [];
              for (let i = 0; i < influencer.length; i++) {
                if (influencer[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                  newSearchInfluencer.push(influencer[i]);
                }
                setSearchInfluencer(newSearchInfluencer);
              }
            }}
            left={
              <TextInput.Icon
                icon={() => (
                  <EvilIcons
                    name={'search'}
                    size={getFontSize(4)}
                    color={Colors.primarySapphire[500]}
                    style={{ marginTop: 5 }}
                  />
                )}
              />
            }
            theme={{ roundness: 40 }}
            activeOutlinecolor={Colors.primarySapphire[500]}
            outlineColor="#9EA1A2"
            label={'Search by Name'}
            placeholderTextColor={'black'}
          />

          <View style={{ ...styles.largeview, marginTop: 25 }}>
            <ScrollView contentContainerStyle={[styles.flatlistview, { justifyContent: 'center' }]}>
              {searchInfluencer?.length < 1 ? <Text>No Search Results</Text> : null}
              {searchInfluencer?.map((item, index) => {
                return (
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => {
                      if (Organization.includes(item._id)) {
                        setOrganization(
                          Organization.filter((organizationId) => {
                            return organizationId !== item._id;
                          })
                        );
                      } else {
                        setOrganization([...Organization, item._id]);
                      }
                    }}
                    style={styles.box}
                    key={index}
                  >
                    <Image
                      style={
                        Organization.includes(item._id)
                          ? {
                              ...styles.img,
                              borderWidth: 2.5,
                              borderColor:
                                item?.profileImage && item?.profileImage != ''
                                  ? '#032F3C'
                                  : '#09aadb',
                            }
                          : styles.img
                      }
                      resizeMode="contain"
                      source={{
                        uri:
                          item?.profileImage && item?.profileImage != ''
                            ? item?.profileImage
                            : 'https://cdn.onebodyapp.com/user/no-image.png',
                      }}
                    />

                    <View>
                      <Text style={{ ...styles.textname, textAlign: 'center' }} numberOfLines={2}>
                        {item?.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: '#757575',
                          alignSelf: 'center',
                        }}
                      >
                        {item?.whatIDo?.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ),
    },
  ];

  const showToast = (sms: string) => {
    toast.show(sms, {
      type: 'danger',
    });
  };
  const next = () => {
    flatListRef?.current?.scrollToIndex({ index: curentIndex + 1 });

    setCurrentIndex(curentIndex + 1);
  };
  const gonext = () => {
    switch (curentIndex) {
      case 0:
        next();

        break;
      case 1:
        if (churchType != null) {
          next();
        } else {
          showToast('Church Type required!');
        }
        break;
      case 2:
        if (churchAttend != null) {
          next();
        } else {
          showToast('Church Atend days required!');
        }
        break;
      case 3:
        if (location != null && date != null) {
          next();
        } else {
          showToast(!date ? 'Date of birth is required' : 'Location is required');
        }
        break;
      case 4:
        if (selectedInterest.length > 2) {
          addInterests();
        } else {
          showToast('Select at least 3 topics to continue');
        }

        break;
      case 5:
        if (Organization.length > 0) {
          addFollowing();
        } else {
          showToast('Select at least 1 influencer/organization to continue');
        }
        break;
      // case 6:
      //   next();
      //   break;
      // case 7:
      //   next();
      //   break;
      default:
        console.log('Its defult');
    }
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { marginTop: navigationBarHeight }]}>
        <View>
          <StatusBar
            translucent={true}
            backgroundColor={colors.background}
            barStyle={scheme == 'dark' ? 'light-content' : 'dark-content'}
            hidden={false}
          />
          <FlatList
            data={data}
            horizontal={true}
            scrollEnabled={false}
            ref={flatListRef}
            keyExtractor={(item, index) => {
              return item.id;
            }}
            pagingEnabled
            renderItem={({ item }) => {
              return (
                <View key={item.id} style={styles.componentview}>
                  {item?.component}
                </View>
              );
            }}
          />
          {curentIndex == 0 ? null : (
            <View style={styles.footer}>
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
                {curentIndex == 0 ? (
                  <View style={{ width: getWidth(10) }} />
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      flatListRef.current?.scrollToIndex({ index: curentIndex - 1 });
                      setCurrentIndex(curentIndex - 1);
                    }}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="chevron-back" size={getFontSize(3)} />
                    <Text style={styles.footerText}>Back</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.progressBar}>
                  <ProgressBar
                    progress={curentIndex * 15}
                    height={7}
                    backgroundColor="#12D2D9"
                    trackColor="#032F3c"
                  />
                </View>

                {curentIndex == 5 ? (
                  <TouchableOpacity
                    onPress={async () => {
                      if (Organization.length > 0) {
                        await addFollowing();
                        const data = {
                          churchType: churchType?.churchType,
                          churchSubType: churchSubType?.churchType,
                          oftenChurch: churchAttend,
                          dateOfBirth: date,
                          location: {
                            longitude: longitude,
                            latitude: latitude,
                            address: location?.place_name,
                          },
                        };
                        dispatch(profileUpdate({ data, token, accountType: user?.accountType }));
                      } else {
                        showToast('Select at least 1 influencer/organization to continue');
                      }
                    }}
                  >
                    <Text style={styles.footerText}>Done</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      gonext();
                    }}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={styles.footerText}>Next</Text>
                    <Ionicons name="chevron-forward" size={getFontSize(3)} />
                  </TouchableOpacity>
                )}
              </ImageBackground>
            </View>
          )}
          <Modal
            backdropOpacity={0.3}
            isVisible={churchTypeModalVisible}
            onBackdropPress={() => setChurchTypeModalVisible(false)}
            onSwipeComplete={() => setChurchTypeModalVisible(false)}
            swipeDirection={['down']}
            style={styles.bottomView}
            propagateSwipe={true}
          >
            <View style={{ ...styles.content2, backgroundColor: colors.background }}>
              <View style={styles.headLine} />

              <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>
                {churchTypes.map((item, index) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        // setWhatIDo(item);
                        setChurchType(item);
                        setSubChurchType(null);

                        setChurchTypeModalVisible(false);
                      }}
                      style={styles.listItem2}
                      key={index}
                    >
                      <Text
                        style={{
                          color: '#81979E',
                          fontSize: getFontSize(2.2),
                          fontFamily: 'Rubik-Regular',
                        }}
                        numberOfLines={1}
                      >
                        {item.churchType}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Modal>

          <Modal
            backdropOpacity={0.3}
            isVisible={churchSubTypeModalVisible}
            onBackdropPress={() => setChurchSubTypeModalVisible(false)}
            onSwipeComplete={() => setChurchSubTypeModalVisible(false)}
            swipeDirection={['down']}
            style={styles.bottomView}
            propagateSwipe={true}
          >
            <View style={styles.content2}>
              <View style={styles.headLine} />

              <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>
                {churchType?.children.map((item, index) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        // setWhatIDo(item);
                        setSubChurchType(item);
                        setChurchSubTypeModalVisible(false);
                      }}
                      style={styles.listItem2}
                      key={index}
                    >
                      <Text
                        style={{
                          color: '#81979E',
                          fontSize: getFontSize(2.2),
                          fontFamily: 'Rubik-Regular',
                        }}
                        numberOfLines={1}
                      >
                        {item.churchType}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
      <SafeAreaView
        style={{
          flex: 0,
          backgroundColor: curentIndex > 0 ? 'rgba(255,255,255,0.95)' : colors.background,
        }}
      />
    </>
  );
};

export default IndividualSteps;
