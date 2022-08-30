import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  PermissionsAndroid,
  ScrollView,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/components/Button';
import { styles } from './styles';
import { Divider, Switch, TextInput } from 'react-native-paper';
import ProgressBar from 'react-native-animated-progress';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';
import MapBox, { MapBoxTypes, MapSuggestion } from '@/components/MapBox';
import { ApiCall } from '@/services/api';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { format, parse } from 'date-fns';

// import * as permissions from 'react-native-permissions';
// import MonthPicker from 'react-native-month-year-picker';
import { useDispatch, useSelector } from 'react-redux';
import { profileUpdate, logout } from '@/redux/actions/AuthActions';
import { setLoader } from '@/redux/actions/GeneralActions';
import LinearGradient from 'react-native-linear-gradient';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '@/constants/GeneralStyle';
import Group134 from '@/assets/svg/Group134.svg';
import GradientButton from '@/components/GradientButton';
import { requestUserPermission } from '@/services/Notification/notificationServices';
import auth from '@react-native-firebase/auth';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Geolocation from 'react-native-geolocation-service';
import { LoginManager } from 'react-native-fbsdk-next';

type ChurchType = {
  churchType: string;
  children: ChurchType[];
  _id: string;
};
type Interest = {
  name: string;
  deleteFlag: boolean;
  _id: string;
};

type User = {
  OTP: { status: boolean };
  badges: string[];
  createdAt: string;
  deactivated: { isDeactivated: boolean };
  email: string;
  interests: string[];
  isInfluencer: boolean;
  isProfileCompleted: boolean;
  name: string;
  profileImage: string;
  role: string;
  updatedAt: string;
  userName: string;
  website: string;
  whatIDo: whatIDo;
  _id: string;
};

type whatIDo = {
  _id: string;
  deleteFlag: boolean;
  whatIDo: string;
  createdAt: string;
  updatedAt: string;
};

type Props = NativeStackScreenProps<any, 'IndividualSteps'>;

const IndividualSteps = ({ navigation }: Props) => {
  const flatListRef = useRef<FlatList>(null);
  const user = useSelector((state: RootState) => state.auth.userData);

  const dispatch = useDispatch();
  const [churchAttend, setChurchAttend] = useState<string | null>(null);
  const [CheckIn, setCheckIn] = useState<boolean>(false);
  const [location, setLocation] = useState<MapSuggestion | null>(null);
  const [countrySelector, setCountrySelector] = useState<boolean>(false);
  const [location_country, setLocation_country] = useState<MapSuggestion | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number }>();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [churchTypeModalVisible, setChurchTypeModalVisible] = useState(false);
  const [churchSubTypeModalVisible, setChurchSubTypeModalVisible] = useState(false);
  const [Organization, setOrganization] = useState<string[]>([]);
  const [curentIndex, setCurrentIndex] = useState(0);
  const [notificationSwitchOn, setNotificationSwitch] = React.useState(false);
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

  const go = () => {
    navigation.navigate('loading');
  };
  const getInterest = async () => {
    try {
      const res = await ApiCall({
        route: 'interests',
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
        route: 'individual/add-interests',
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
        route: 'individual/add-following',
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
  const getlocationPermison = async () => {
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
            getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
          });
        }
      }
    } catch (err) {
      console.warn(err);
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
        <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
          <GeneralStatusBar
            backgroundColor="white"
            barStyle="dark-content"
            hidden={false}
            translucent={true}
          />

          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

          <Text
            style={{
              ...styles.heading,
              width: getWidth(80),
              margin: getHeight(0.5),
            }}
          >
            Let’s Get To Know You.
          </Text>
          <Text style={{ ...styles.text, width: '80%' }}>
            This should only take about 2-3 minutes to complete.
          </Text>
          <Group134 style={{ margin: getHeight(5) }} />
          <GradientButton
            text={'LET’S GET STARTED'}
            btnStyle={{
              ...GeneralStyle.btn,
              marginTop: getHeight(4),
              height: getHeight(7),
              width: getWidth(80),
            }}
            btnTextStyle={GeneralStyle.btnText}
            onPress={() => {
              gonext();
            }}
          />
          <TouchableOpacity
            onPress={() => logoutAction()}
            style={{ marginVertical: 10, borderBottomWidth: 0 }}
          >
            <Text style={styles.logouttext}>Cancel</Text>
          </TouchableOpacity>
        </LinearGradient>
      ),
    },
    {
      id: 2,
      component: (
        <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
          <GeneralStatusBar
            backgroundColor="white"
            barStyle="dark-content"
            hidden={false}
            translucent={true}
          />

          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />
          <Text style={styles.text}>Step 1 of 7</Text>
          <Text style={styles.heading}>What type of church do you attend?</Text>

          <View>
            {/* <SelectDropdown
              data={countries}
              defaultButtonText="Select one"
              buttonTextStyle={{color: '#4F6D77'}}
              buttonStyle={{...styles.btn, backgroundColor: '#E7F0F3'}}
              onSelect={type => setChurchType(type)}
            /> */}

            <Button
              text={
                churchType == null || churchType.churchType == 'Non-Denomination'
                  ? 'Select One'
                  : churchType.churchType
              }
              btnStyle={styles.btn3}
              leftIcon={<View />}
              RightIcon={<Ionicons name="chevron-down" color={'#4F6D77'} size={getFontSize(3)} />}
              btnTextStyle={styles.btnText3}
              onPress={() => setChurchTypeModalVisible(true)}
            />

            {churchType && churchType?.children?.length > 0 ? (
              <Button
                text={churchSubType == null ? 'Select One' : churchSubType.churchType}
                btnStyle={styles.btn3}
                leftIcon={<View />}
                RightIcon={<Ionicons name="chevron-down" color={'#4F6D77'} size={getFontSize(3)} />}
                btnTextStyle={styles.btnText3}
                onPress={() => setChurchSubTypeModalVisible(true)}
              />
            ) : null}
          </View>
        </LinearGradient>
      ),
    },
    {
      id: 3,
      component: (
        <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
          <GeneralStatusBar
            backgroundColor="white"
            barStyle="dark-content"
            hidden={false}
            translucent={true}
          />
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

          <Text style={styles.text}>Step 2 of 7</Text>
          <Text style={styles.heading}>How often do you attend church?</Text>

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
        </LinearGradient>
      ),
    },
    {
      id: 4,
      component: (
        <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
          <GeneralStatusBar
            backgroundColor="white"
            barStyle="dark-content"
            hidden={false}
            translucent={true}
          />
          {/* {open && (
            <MonthPicker
              onChange={onValueChange}
              value={date}
              maximumDate={new Date()}
            />
          )} */}
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />
          <Text style={styles.text}>Step 3 of 7</Text>
          <Text style={{ ...styles.heading, width: getWidth(80) }}>
            What is your date of birth?
          </Text>
          <View>
            <TextInput
              mode="outlined"
              label="Date"
              style={{ ...GeneralStyle.input, width: getWidth(80) }}
              activeOutlineColor={'#5B7279'}
              theme={{ roundness: 10 }}
              showSoftInputOnFocus={false}
              onFocus={() => setOpen(true)}
              onChangeText={(value) => setDate(value)}
              onPressIn={() => setOpen(true)}
              value={date}
              right={
                <TextInput.Icon
                  name="calendar"
                  onPress={() => setOpen(true)}
                  style={{ paddingTop: 6 }}
                  color={'#032f3c'}
                />
              }
            />

            <DatePicker
              modal
              maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 16))}
              mode="date"
              open={open}
              date={date ? parse(date, 'MM/dd/yyyy', new Date()) : new Date()}
              onConfirm={(date) => {
                setOpen(false);
                setDate(format(date, 'MM/dd/yyyy'));
              }}
              onCancel={() => {
                setOpen(false);
              }}
            />
          </View>
          <Text style={{ ...styles.heading, width: '100%' }}>Where are you located?</Text>
          <TextInput
            style={{ ...GeneralStyle.input, width: getWidth(80) }}
            mode="outlined"
            value={location_country?.place_name ?? ''}
            theme={{ roundness: 10 }}
            activeOutlineColor={'#5B7279'}
            showSoftInputOnFocus={false}
            onPressIn={() => setCountrySelector(true)}
            label={'Country'}
            placeholderTextColor={'black'}
          />

          <MapBox
            location={location_country}
            setLongitude={setLongitude}
            setLatitude={setLatitude}
            CheckIn={countrySelector}
            setCheckIn={setCountrySelector}
            setLocation={setLocation_country}
            types={[MapBoxTypes.country]}
          />

          <TextInput
            style={{ ...GeneralStyle.input, width: getWidth(80), marginTop: 20 }}
            mode="outlined"
            value={
              location?.place_name.replace(`, ${location_country?.place_name ?? ''}`, '') ?? ''
            }
            theme={{ roundness: 10 }}
            activeOutlineColor={'#5B7279'}
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
          />
        </LinearGradient>
      ),
    },
    {
      id: 5,
      component: (
        <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
          <GeneralStatusBar
            backgroundColor="white"
            barStyle="dark-content"
            hidden={false}
            translucent={true}
          />

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
            <Text style={{ fontWeight: '400' }}>to personalize your News/Blog stream.</Text>
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
                name={() => (
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
                    selectedInterest.includes(item?._id) ? { color: 'white' } : { color: '#757575' }
                  }
                >
                  {item?.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      ),
    },
    {
      id: 6,
      component: (
        <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
          <GeneralStatusBar
            backgroundColor="white"
            barStyle="dark-content"
            hidden={false}
            translucent={true}
          />
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
            <Text style={{ fontWeight: '400' }}>to personalize your Social stream.</Text>
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
                name={() => (
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
            <FlatList
              data={searchInfluencer}
              style={{ marginBottom: getHeight(7) }}
              ListFooterComponent={<View style={{ height: getHeight(2) }} />}
              ItemSeparatorComponent={() => <View style={{ height: getHeight(1) }} />}
              keyExtractor={(item, index) => item._id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text>No Search Results</Text>}
              numColumns={3}
              renderItem={({ item, index }) => (
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
                >
                  <Image
                    style={
                      Organization.includes(item._id)
                        ? {
                            ...styles.img,
                            borderWidth: 2.5,
                            borderColor: '#032F3C',
                          }
                        : styles.img
                    }
                    source={{ uri: item?.profileImage }}
                  />
                  <View>
                    <Text style={{ ...styles.textname, textAlign: 'center' }}>{item?.name}</Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: '#757575',
                        alignSelf: 'center',
                      }}
                    >
                      {item?.whatIDo?.whatIDo}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </LinearGradient>
      ),
    },
    {
      id: 7,
      component: (
        <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
          <GeneralStatusBar
            backgroundColor="white"
            barStyle="dark-content"
            hidden={false}
            translucent={true}
          />
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

          <Text style={{ ...styles.heading, margin: 5 }}>Allow notifications</Text>
          <Text
            style={{
              ...styles.text,
              width: getWidth(80),
              fontSize: getFontSize(2.1),
              color: '#4F6D77',
            }}
          >
            Reminders help you break your tenced routine and get your body back where it really
            needs to be. Amen!
          </Text>
          <View style={styles.box2}>
            <Text
              style={{
                ...styles.heading2,
                fontSize: getFontSize(2.5),
                fontWeight: '400',
                left: 5,
              }}
            >
              Notifications
            </Text>

            <Switch
              value={notificationSwitchOn}
              color="#126B87"
              onValueChange={() => {
                setNotificationSwitch(!notificationSwitchOn);
                requestUserPermission(token);
              }}
            />
          </View>
          <Divider style={{ height: 1, width: '100%' }} />
        </LinearGradient>
      ),
    },
    {
      id: 8,
      component: (
        <LinearGradient
          colors={['#fff', '#fff', '#E0EEF3']}
          style={{ ...styles.innerContainer, paddingHorizontal: 15 }}
        >
          <GeneralStatusBar
            backgroundColor="white"
            barStyle="dark-content"
            hidden={false}
            translucent={true}
          />
          <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

          <Text style={{ ...styles.heading, margin: 5 }}>Use location</Text>
          <Text
            style={{
              ...styles.text,
              width: getWidth(80),
              fontSize: getFontSize(2.1),
              color: '#4F6D77',
            }}
          >
            Allow OneBody to use your location for the best possible experience while your Body
            finds peace. Amen!
          </Text>

          {!locationData?.longitude || !locationData?.latitude ? (
            <Button
              text="Authorize"
              btnStyle={styles.btn3}
              btnTextStyle={styles.btnText3}
              onPress={() => getlocationPermison()}
            />
          ) : (
            <Text
              style={{
                marginTop: 40,
                fontSize: getFontSize(2.5),
                color: '#4F6D77',
                textAlign: 'center',
              }}
            >
              Good Job! Location services are authorized
            </Text>
          )}
        </LinearGradient>
      ),
    },
  ];

  const showToast = (sms: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      // position: 'bottom',
      // bottomOffset: getHeight(10),
      topOffset: getHeight(1),
      text2: sms,
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
          showToast('Location and Birth date required!');
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
      case 6:
        next();
        break;
      case 7:
        next();
        break;
      default:
        console.log('Its defult');
    }
  };
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        horizontal={true}
        scrollEnabled={false}
        ref={flatListRef}
        keyExtractor={(item, index) => {
          return item.id;
        }}
        pagingEnabled
        renderItem={({ item }) => <View style={styles.componentview}>{item?.component}</View>}
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

            {curentIndex == 7 ? (
              <TouchableOpacity
                onPress={() => {
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
                  dispatch(profileUpdate({ data, token, go, role: user?.role }));
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
      >
        <View style={styles.content2}>
          <View style={styles.headLine} />
          <View style={{ flex: 1 }}>
            <FlatList
              data={churchTypes}
              keyExtractor={(item) => {
                return item._id;
              }}
              ListHeaderComponent={() => <View style={{ height: getHeight(2) }} />}
              ItemSeparatorComponent={() => <Divider />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      // setWhatIDo(item);
                      setChurchType(item);

                      setChurchTypeModalVisible(false);
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
                      {item.churchType}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        backdropOpacity={0.3}
        isVisible={churchSubTypeModalVisible}
        onBackdropPress={() => setChurchSubTypeModalVisible(false)}
        onSwipeComplete={() => setChurchSubTypeModalVisible(false)}
        swipeDirection={['down']}
        style={styles.bottomView}
      >
        <View style={styles.content2}>
          <View style={styles.headLine} />
          <View style={{ flex: 1 }}>
            <FlatList
              data={churchType?.children}
              keyExtractor={(item) => {
                return item._id;
              }}
              ListHeaderComponent={() => <View style={{ height: getHeight(2) }} />}
              ItemSeparatorComponent={() => <Divider />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      // setWhatIDo(item);
                      setSubChurchType(item);
                      setChurchSubTypeModalVisible(false);
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
                      {item.churchType}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default IndividualSteps;
