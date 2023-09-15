import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ScrollView,
  useColorScheme,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/src/components/Button';
import { styles } from './styles';
import Toast from 'react-native-toast-message';
import { TextInput as NativeTextInput } from 'react-native';
import { Divider, Switch, TextInput, Text } from 'react-native-paper';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import ProgressBar from 'react-native-animated-progress';
import { ApiCall } from '@/services/api';
import { useDispatch, useSelector } from 'react-redux';
import MapBox, { MapBoxTypes, MapSuggestion } from '@/src/components/MapBox';
import { orgprofileUpdate, logout } from '@/redux/actions/AuthActions';
import { setLoader } from '@/redux/actions/GeneralActions';
import Modal from 'react-native-modal';
import validator from '@/utils/validation/validator';
import { validateFields } from '@/utils/validation/validate-fields';
import LinearGradient from 'react-native-linear-gradient';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '@/constants/GeneralStyle';
import Group134 from '@/assets/svg/Group134.svg';
import GradientButton from '@/src/components/GradientButton';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import auth from '@react-native-firebase/auth';
import { LoginManager } from 'react-native-fbsdk-next';
import Geolocation from 'react-native-geolocation-service';

import messaging from '@react-native-firebase/messaging';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { Interest, Tag, User } from '@/utils/types';
import { useToast } from 'react-native-toast-notifications';
import { profile } from 'console';
import { useTheme } from '@react-navigation/native';
import { NO_PROFILE_IMAGE } from '@/src/Services/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<any, 'OrgnizationSteps'>;

const OrgnizationSteps = ({ navigation }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const dispatch = useDispatch();
  const flatListRef = useRef<FlatList>(null);

  const [Organization, setOrganization] = useState<string[]>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [interest, setInterest] = useState<Interest[]>([]);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);

  const [selectedInterest, setSelectedInterest] = useState<string[]>([]);
  const [curentIndex, setCurrentIndex] = useState<number>(0);

  const [CheckIn, setCheckIn] = useState<boolean>(false);

  const [location_label, setLocation_label] = useState<MapSuggestion | null>(null);
  const [longitude, setLongitude] = useState<number>();
  const [latitude, setLatitude] = useState<number>();
  const [organizationTypes, setOrganizationTypes] = useState<Tag[]>([]);
  const [organizationType, setOrganizationType] = useState<Tag | null>();
  const [organizationTypeError, setOrganizationTypeError] = useState<string>('');
  const toast = useToast();
  const [showErrors, setShowErrors] = useState<boolean>(false);

  const [state, setState] = useState({
    companyName: '',
    contactName: user?.name ?? '',
    contactEmail: user?.email ?? '',
    contactPhoneNumber: '',
  });

  const [stateError, setStateError] = useState({
    companyNameError: '',
    contactNameError: '',
    contactEmailError: '',
    contactPhoneNumberError: '',
    location_labelError: '',
  });

  //Navigation bar height
  const insets = useSafeAreaInsets();
  const navigationBarHeight = insets.top;

  const requestNotificationPermission = async () => {
    await messaging().requestPermission();
  };

  useEffect(() => {
    if (!organizationType) {
      setOrganizationTypeError('Organization Type is required.');
    } else {
      setOrganizationTypeError('');
    }
  }, [organizationType]);

  useEffect(() => {
    validateFields(state.contactName, 'contactName', (error) =>
      setStateError({ ...stateError, contactNameError: error })
    );

    validateFields(state.contactEmail, 'contactEmail', (error) =>
      setStateError({ ...stateError, contactEmailError: error })
    );

    validateFields(state.contactPhoneNumber, 'contactPhoneNumber', (error) =>
      setStateError({ ...stateError, contactPhoneNumberError: error })
    );

    validateFields(state.companyName, 'companyName', (error) => {
      setStateError({ ...stateError, companyNameError: error });
    });
  }, [state]);

  useEffect(() => {
    validateFields(location_label?.place_name ?? '', 'location_label', (error) =>
      setStateError({ ...stateError, location_labelError: error })
    );
  }, [location_label]);

  const requestlocationPermison = async () => {
    try {
      if (Platform.OS === 'ios') {
        const permissions = await Geolocation.requestAuthorization('whenInUse');

        if (permissions == 'granted') {
          Geolocation.getCurrentPosition((info) => {
            setLongitude(info.coords?.longitude);
            setLatitude(info.coords?.latitude);
          });
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message: 'This App needs to Access your location',
            buttonPositive: '',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          //To Check, If Permission is granted
          Geolocation.getCurrentPosition((info) => {
            setLongitude(info.coords?.longitude);
            setLatitude(info.coords?.latitude);
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

  const inputRefs = {
    companyName: useRef<NativeTextInput>(null),
    contactName: useRef<NativeTextInput>(null),
    contactEmail: useRef<NativeTextInput>(null),
    contactPhoneNumber: useRef<NativeTextInput>(null),
    location_label: useRef<NativeTextInput>(null),
  };

  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const go = () => {
    // navigation.navigate('loading');
  };

  const [influencer, setInfluencer] = useState<User[]>([]);
  const [searchInfluencer, setSearchInfluencer] = useState<User[]>([]);
  const scheme = useColorScheme();
  const { colors } = useTheme();

  useEffect(() => {
    getIntrest();
    getOrg();
    getOrganizationTypes();
  }, [token]);

  const getOrganizationTypes = async () => {
    try {
      const res = await ApiCall({
        route: 'tags/organization-types',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setOrganizationTypes(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getOrg = async () => {
    try {
      const res = await ApiCall({
        route: 'user/get-users-to-subscribe',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        // setorg(res?.response?.data);
        setInfluencer(res.response?.data);

        setSearchInfluencer(res.response?.data);
      } else {
        console.log('error', res);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getIntrest = async () => {
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
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: 'user/add-interests',
        token: token,
        params: { interests: selectedInterest },
        verb: 'patch',
      });
      if (res.status == 200) {
        getOrg();
        dispatch(setLoader(false));
        next();
      } else {
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

      if (res?.status == 200) {
        // getInfluencers();
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
  // const getlocationPermison = async () => {
  //   try {
  //     const granted = await PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //       {
  //         title: 'Location Access Required',
  //         message: 'This App needs to Access your location',
  //       }
  //     );
  //     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
  //       //To Check, If Permission is granted
  //       console.log('Permission acess');

  //       //  getOneTimeLocation();
  //       //  subscribeLocationLocation();
  //     } else {
  //       console.log('Permission Denied');
  //     }
  //   } catch (err) {
  //     console.warn(err);
  //   }
  // };

  const data = [
    {
      id: 1,
      component: (
        // <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
        //   <GeneralStatusBar
        //     backgroundColor="white"
        //     barStyle="dark-content"
        //     hidden={false}
        //     translucent={true}
        //   />
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
                height: getHeight(7),
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
            onPress={() => {
              auth().signOut();
              LoginManager.logOut();
              dispatch(logout());
            }}
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
          <Text style={{ ...styles.text, color: '#888C93' }}>Step 1 of 7</Text>
          <Text
            style={{
              ...styles.heading,
              color: scheme == 'dark' ? colors.text : '#032F3C',
              width: getWidth(80),
            }}
          >
            Identify your Organization
          </Text>
          <Text style={{ ...styles.heading, color: scheme == 'dark' ? colors.text : '#032F3C' }}>
            What type of Organization are you?
          </Text>
          <View>
            {/* <SelectDropdown
              data={countries}
              defaultButtonText="Select one"
              buttonTextStyle={{color: '#4F6D77'}}
              buttonStyle={{...styles.btn, backgroundColor: '#E7F0F3'}}
              onSelect={type => setORGType(type)}
            /> */}
            <Button
              text={organizationType == null ? 'Select One' : organizationType.name}
              btnStyle={{
                ...styles.btn3,
                backgroundColor: scheme == 'dark' ? colors.text : '#E7F0F3',
              }}
              leftIcon={<View />}
              rightIcon={<Ionicons name="chevron-down" color={'#4F6D77'} size={getFontSize(2.4)} />}
              btnTextStyle={styles.btnText3}
              onPress={() => setVisible(true)}
            />

            <Text style={{ ...GeneralStyle.InputError, marginLeft: 10 }}>
              {showErrors ? organizationTypeError : null}
            </Text>
          </View>
        </View>
      ),
    },
    {
      id: 3,
      component: (
        <View style={styles.innerContainer} key={4}>
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

          <Text style={{ ...styles.text, color: '#888C93' }}>Step 2 of 7</Text>
          <Text
            style={{
              ...styles.heading,
              color: scheme == 'dark' ? colors.text : '#032F3C',
              width: getWidth(80),
            }}
          >
            Identify your Organization
          </Text>
          <Text style={styles.text}>Where is your Organization located?</Text>
          <View>
            <TextInput
              style={{ ...GeneralStyle.input, width: getWidth(80) }}
              theme={{ roundness: 10 }}
              ref={inputRefs.companyName}
              value={state.companyName}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              label={'Company Name'}
              onFocus={() => setStateError({ ...stateError, companyNameError: '' })}
              // onBlur={() =>
              //   validateFields(state.companyName, 'companyName', (error) =>
              //     setState({ ...state, companyNameError: error })
              //   )
              // }
              onSubmitEditing={() => {
                inputRefs.location_label.current?.focus();
                setCheckIn(true);
              }}
              onChangeText={(companyName) => changeHandler('companyName', companyName)}
              blurOnSubmit={false}
            />

            <Text
              style={{
                ...GeneralStyle.InputError,
              }}
              numberOfLines={2}
            >
              {showErrors ? stateError.companyNameError : null}
            </Text>

            <TextInput
              style={{ ...GeneralStyle.input, width: getWidth(80) }}
              theme={{ roundness: 10 }}
              ref={inputRefs.location_label}
              returnKeyType={'done'}
              mode="outlined"
              value={location_label?.place_name}
              activeOutlineColor={'#5B7279'}
              showSoftInputOnFocus={false}
              onPressIn={() => setCheckIn(true)}
              label={'Company Address'}
              placeholderTextColor={'black'}
              onSubmitEditing={() => gonext()}
            />

            <Text style={{ ...GeneralStyle.InputError }} numberOfLines={2}>
              {showErrors ? stateError.location_labelError : null}
            </Text>

            {CheckIn == true ? (
              <MapBox
                types={[MapBoxTypes.address]}
                location={location_label}
                setLongitude={setLongitude}
                setLatitude={setLatitude}
                CheckIn={CheckIn}
                setCheckIn={setCheckIn}
                setLocation={setLocation_label}
              />
            ) : null}
          </View>
        </View>
      ),
    },
    {
      id: 4,
      component: (
        <View style={styles.innerContainer} key={5}>
          <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
            <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

            <Text style={{ ...styles.text, color: '#888C93', alignSelf: 'center' }}>
              Step 3 of 7
            </Text>
            <Text
              style={{
                ...styles.heading,
                color: scheme == 'dark' ? colors.text : '#032F3C',
                width: getWidth(80),
              }}
            >
              Identify your Organization
            </Text>
            <Text style={{ ...styles.text, alignSelf: 'center' }}>
              Who will be the primary contact for your Organization?
            </Text>

            <View>
              <TextInput
                style={{ ...GeneralStyle.input, width: getWidth(80) }}
                theme={{ roundness: 10 }}
                ref={inputRefs.contactName}
                value={state.contactName}
                returnKeyType={'next'}
                mode="outlined"
                activeOutlineColor={'#5B7279'}
                label={'Full Name'}
                onFocus={() => setStateError({ ...stateError, contactNameError: '' })}
                // onBlur={() => {
                //   validateFields(state.contactName, 'contactName', (error) =>
                //     setState({ ...state, contactNameError: error })
                //   );
                // }}
                onSubmitEditing={() => inputRefs.contactEmail.current?.focus()}
                onChangeText={(contactName) => changeHandler('contactName', contactName)}
                blurOnSubmit={false}
              />
              <Text style={{ ...GeneralStyle.InputError }} numberOfLines={2}>
                {showErrors ? stateError.contactNameError : null}
              </Text>

              <TextInput
                style={{ ...GeneralStyle.input, width: getWidth(80) }}
                theme={{ roundness: 10 }}
                mode="outlined"
                ref={inputRefs.contactEmail}
                value={state.contactEmail}
                returnKeyType={'next'}
                activeOutlineColor={'#5B7279'}
                label={'Email'}
                onFocus={() => setStateError({ ...stateError, contactEmailError: '' })}
                // onBlur={() =>
                //   validateFields(state.contactEmail, 'contactEmail', (error) =>
                //     setState({ ...state, contactEmailError: error })
                //   )
                // }
                onSubmitEditing={() => inputRefs.contactPhoneNumber.current?.focus()}
                onChangeText={(contactEmail) => changeHandler('contactEmail', contactEmail.trim())}
                blurOnSubmit={false}
              />
              <Text style={{ ...GeneralStyle.InputError }} numberOfLines={2}>
                {showErrors ? stateError.contactEmailError : null}
              </Text>

              <TextInput
                style={{ ...GeneralStyle.input, width: getWidth(80) }}
                theme={{ roundness: 10 }}
                ref={inputRefs.contactPhoneNumber}
                value={state.contactPhoneNumber}
                returnKeyType={'done'}
                mode="outlined"
                keyboardType="number-pad"
                activeOutlineColor={'#5B7279'}
                label={'Phone number'}
                onFocus={() => setStateError({ ...stateError, contactPhoneNumberError: '' })}
                // onBlur={() =>
                //   validateFields(state.contactPhoneNumber, 'contactPhoneNumber', (error) =>
                //     setState({ ...state, contactPhoneNumberError: error })
                //   )
                // }

                onChangeText={(contactPhoneNumber) =>
                  changeHandler('contactPhoneNumber', contactPhoneNumber)
                }
                blurOnSubmit={false}
              />
              <Text style={{ ...GeneralStyle.InputError }} numberOfLines={2}>
                {showErrors ? stateError.contactPhoneNumberError : null}
              </Text>
            </View>
            <Text
              style={{
                ...styles.text,
                width: getWidth(85),
                alignSelf: 'center',
                color: '#888C93',
                marginTop: 12,
                marginBottom: 50,
              }}
            >
              Note: This person will serve as the representative for your account and will be
              responsible for all account related communications.{' '}
            </Text>
          </KeyboardAwareScrollView>
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
            onChangeText={(text) => {
              const newSearchInterest = [];
              for (let i = 0; i < interest.length; i++) {
                if (interest[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                  newSearchInterest.push(interest[i]);
                }
                setSearchInterest(newSearchInterest);
              }
            }}
          />

          <ScrollView contentContainerStyle={styles.flatlistview}>
            {searchInterest.length < 1 ? <Text>No Search Results</Text> : null}
            {searchInterest.map((item, index) => (
              <TouchableOpacity
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
                key={index}
              >
                <Text
                  numberOfLines={1}
                  style={
                    selectedInterest.includes(item?._id)
                      ? { color: 'white', maxWidth: getWidth(17) }
                      : { color: '#757575', maxWidth: getWidth(17) }
                  }
                >
                  {item?.name}
                </Text>
              </TouchableOpacity>
            ))}
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
                    color={'#5B7279'}
                    style={{ marginTop: 5 }}
                  />
                )}
              />
            }
            theme={{ roundness: 40 }}
            activeOutlineColor={'#5B7279'}
            outlineColor="#9EA1A2"
            label={'Search by Name'}
            placeholderTextColor={'black'}
          />

          <View style={{ ...styles.largeview, marginTop: 25 }}>
            <ScrollView contentContainerStyle={[styles.flatlistview, { justifyContent: 'center' }]}>
              {searchInfluencer.length < 1 ? <Text>No Search Results</Text> : null}
              {searchInfluencer.map((item, index) => {
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
                            : NO_PROFILE_IMAGE,
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
                        {item?.profile?.whatIDo?.name ??
                          item?.profile?.typeOfOrganization?.name ??
                          item?.whatIDo?.name}
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
    setShowErrors(false);
    if (curentIndex < 5) {
      flatListRef.current?.scrollToIndex({ index: curentIndex + 1 });
      setCurrentIndex(curentIndex + 1);
    }
  };

  const gonext = async () => {
    switch (curentIndex) {
      case 0:
        next();

        break;
      case 1:
        if (organizationType != null) {
          next();
        } else {
          setShowErrors(true);
        }
        break;
      case 2:
        const companyNameError = await validator('companyName', state.companyName);

        if (
          !stateError.companyNameError &&
          !stateError.location_labelError &&
          state.companyName &&
          location_label
        ) {
          next();
        } else {
          setStateError({
            ...stateError,
            companyNameError,
          });
          setShowErrors(true);
        }

        break;
      case 3:
        const contactNameError = await validator('contactName', state.contactName);
        const contactPhoneNumberError = await validator('contactPhoneNumber', state.contactName);
        const contactEmailError = await validator('contactEmail', state.contactName);

        if (
          !stateError.contactNameError &&
          !stateError.contactEmailError &&
          !stateError.contactPhoneNumberError &&
          state.contactName &&
          state.contactEmail &&
          state.contactPhoneNumber
        ) {
          next();
        } else {
          setStateError({
            ...stateError,
            contactNameError,
            contactPhoneNumberError,
            contactEmailError,
          });
          setShowErrors(true);
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
      //   // getlocationPermison();
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
                style={styles.bgimage}
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
                    progress={curentIndex * 17}
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
                        const { contactName, contactEmail, contactPhoneNumber, companyName } =
                          state;

                        const data = {
                          typeOfOrganization: organizationType?._id,
                          contactEmail: contactEmail,
                          companyName: companyName,
                          contactName: contactName,
                          contactPhoneNumber: contactPhoneNumber,
                          location: {
                            longitude: longitude,
                            latitude: latitude,
                            address: location_label,
                          },
                        };

                        dispatch(
                          orgprofileUpdate({ data, token, go, accountType: user?.accountType })
                        );
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
            isVisible={visible}
            onBackdropPress={() => setVisible(false)}
            onSwipeComplete={() => setVisible(false)}
            style={styles.bottomView}
            propagateSwipe={true}
            swipeDirection="down"
          >
            <View style={{ ...styles.content2, backgroundColor: colors.card }}>
              <View style={styles.headLine} />

              <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>
                {organizationTypes.map((item, index) => {
                  return (
                    <TouchableOpacity
                      key={item._id}
                      onPress={() => {
                        // setWhatIDo(item);
                        setOrganizationType(item);

                        setVisible(false);
                      }}
                      style={styles.listItem2}
                    >
                      <Text
                        style={{
                          color: '#81979E',
                          fontSize: getFontSize(2.2),
                          fontFamily: 'Rubik-Regular',
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
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
export default OrgnizationSteps;
