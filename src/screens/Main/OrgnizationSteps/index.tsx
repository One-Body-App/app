import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  PermissionsAndroid,
} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '@/components/Button';
import { styles } from './styles';
import Toast from 'react-native-toast-message';
import { Divider, Switch, TextInput } from 'react-native-paper';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import ProgressBar from 'react-native-animated-progress';
import { ApiCall } from '@/services/api';
import { useDispatch, useSelector } from 'react-redux';
import MapBox from '@/components/MapBox';
import { orgprofileUpdate, logout } from '@/redux/actions/AuthActions';
import { setLoader } from '@/redux/actions/GernalActions';
import Modal from 'react-native-modal';
import validator from '@/utils/validation/validator';
import { validateFields } from '@/utils/validation/validate-fields';
import LinearGradient from 'react-native-linear-gradient';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GernalStyle } from '@/constants/GernalStyle';
import Group134 from '@/assets/svg/Group134.svg';
import GradinteButton from '@/components/GradinteButton';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { requestUserPermission } from '@/services/Notification/notificationServices';

const OrgnizationSteps = ({ navigation }) => {
  const countries = ['option 1', 'option 2', 'option 3', 'option 4'];
  const token = useSelector((state) => state.auth.userToken);
  const user = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  let flatListRef = null;
  const [Organization, setOrganization] = useState([]);
  const [visible, setVisible] = useState(false);
  const [intrest, setIntrest] = useState([]);
  const [selectedIntrest, setSelectedIntrest] = useState([]);
  const [curentIndex, setCurrentIndex] = useState(0);
  const [notificationSwitchOn, setNotificationSwitch] = React.useState(false);
  const [ORGType, setORGType] = useState(null);
  const [CheckIn, setCheckIn] = useState(false);
  const [location_label, setLocation_label] = useState(null);
  const [longitued, setLongitued] = useState(null);
  const [latitude, setLatitued] = useState(null);

  const inputRefs = {
    companyName: useRef(null),
    orgfullName: useRef(null),
    orgEmail: useRef(null),
    orgPhoneNo: useRef(null),
    location_label: useRef(null),
  };
  const [state, setState] = useState({
    companyName: '',
    companyNameError: '',
    orgfullName: '',
    orgfullNameError: '',
    orgEmail: '',
    orgEmailError: '',
    orgPhoneNo: '',
    orgPhoneNoError: '',
    location_labelError: '',
  });
  const changeHandler = (type, value) => setState({ ...state, [type]: value });
  const go = () => {
    navigation.navigate('loading');
  };

  const [org, setorg] = useState([]);
  useEffect(() => {
    getIntrest();
    getOrg();
  }, []);
  const getOrg = async () => {
    try {
      const res = await ApiCall({
        route: 'user/get-users-to-subscribe',
        verb: 'get',
        token: token,
      });
      if (res?.status == '200') {
        setorg(res?.data);
      } else {
        console.log('error', res?.data);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const handelSubscribe = async (id) => {
    try {
      const res = await ApiCall({
        route: `individual/subscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res.status == '200') {
        console.log('res==200', res);
      } else {
        console.log('error', res);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };
  const getIntrest = async () => {
    try {
      const res = await ApiCall({
        route: 'interests',
        verb: 'get',
        token: token,
      });
      if (res?.status == '200') {
        setIntrest(res?.response);
      } else {
        console.log('error', res?.data);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const addIntrest = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: 'individual/add-interests',
        token: token,
        params: { interests: selectedIntrest },
        verb: 'patch',
      });
      if (res.status == '200') {
        getOrg();
        dispatch(setLoader(false));
        next();
      } else {
        console.log('error', res);
      }
    } catch (e) {
      showToast('An error acoured pls try again!');
      console.log('saga error -- ', e.toString());
    }
  };
  const getlocationPermison = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Access Required',
          message: 'This App needs to Access your location',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //To Check, If Permission is granted
        console.log('Permission acess');

        //  getOneTimeLocation();
        //  subscribeLocationLocation();
      } else {
        console.log('Permission Denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };
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
          <GradinteButton
            text={'LET’S GET STARTED'}
            btnStyle={{
              ...GernalStyle.btn,
              marginTop: getHeight(4),
              height: getHeight(7.5),
              width: getWidth(78),
            }}
            btnTextStyle={GernalStyle.btnText}
            onPress={() => {
              gonext();
            }}
          />
          <TouchableOpacity
            onPress={() => dispatch(logout())}
            style={{ ...styles.lists, marginBottom: 10, borderBottomWidth: 0 }}
          >
            <Text style={styles.logouttext}>Log out</Text>
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
          <Text style={{ ...styles.text, color: '#888C93' }}>Step 1 of 7</Text>
          <Text style={{ ...styles.heading, width: getWidth(80) }}>Identify your Organization</Text>
          <Text style={styles.text}>What type of Organization are you?</Text>
          <View>
            {/* <SelectDropdown
              data={countries}
              defaultButtonText="Select one"
              buttonTextStyle={{color: '#4F6D77'}}
              buttonStyle={{...styles.btn, backgroundColor: '#E7F0F3'}}
              onSelect={type => setORGType(type)}
            /> */}
            <Button
              text={ORGType == null || ORGType == 'Church' ? 'Select One' : ORGType}
              btnStyle={styles.btn3}
              leftIcon={<View />}
              RightIcon={<Ionicons name="chevron-down" color={'#4F6D77'} size={getFontSize(3)} />}
              btnTextStyle={styles.btnText3}
              onPress={() => setVisible(true)}
            />
            {ORGType == 'Church' ? (
              <Button
                text={'Church'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setORGType(null)}
              />
            ) : (
              <Button
                text={'Church'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setORGType('Church')}
              />
            )}
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

          <Text style={{ ...styles.text, color: '#888C93' }}>Step 2 of 7</Text>
          <Text style={{ ...styles.heading, width: getWidth(80) }}>Identify your Organization</Text>
          <Text style={styles.text}>Where is your Organization located?</Text>
          <View>
            <TextInput
              style={{ ...GernalStyle.input, width: getWidth(80) }}
              theme={{ roundness: 10 }}
              ref={inputRefs.companyName}
              value={state.companyName}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              label={'Company Name'}
              onFocus={() => setState({ ...state, companyNameError: '' })}
              onBlur={() =>
                validateFields(state.companyName, 'companyName', (error) =>
                  setState({ ...state, companyNameError: error })
                )
              }
              onSubmitEditing={() => inputRefs.location_label.current.focus()}
              onChangeText={(companyName) => changeHandler('companyName', companyName.trim())}
              blurOnSubmit={false}
            />
            <Text style={{ ...GernalStyle.InputError, marginLeft: 10 }}>
              {state.companyNameError}
            </Text>

            <TextInput
              style={{ ...GernalStyle.input, width: getWidth(80) }}
              theme={{ roundness: 10 }}
              ref={inputRefs.location_label}
              returnKeyType={'done'}
              mode="outlined"
              value={location_label}
              activeOutlineColor={'#5B7279'}
              showSoftInputOnFocus={false}
              onFocus={() => setCheckIn(true)}
              onPressIn={() => setCheckIn(true)}
              label={'Company Address'}
              placeholderTextColor={'black'}
              onSubmitEditing={() => gonext()}
            />
            <Text style={{ ...GernalStyle.InputError, marginLeft: 10 }}>
              {state.location_labelError}
            </Text>

            {CheckIn == true ? (
              <MapBox
                location_label={location_label}
                setLongitued={setLongitued}
                setLatitued={setLatitued}
                CheckIn={CheckIn}
                setCheckIn={setCheckIn}
                setLocation_label={setLocation_label}
              />
            ) : null}
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
          <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
            <Logo height={getHeight(14)} width={getWidth(40)} style={styles.logo} />

            <Text style={{ ...styles.text, color: '#888C93', alignSelf: 'center' }}>
              Step 3 of 7
            </Text>
            <Text style={{ ...styles.heading, width: getWidth(80) }}>
              Identify your Organization
            </Text>
            <Text style={{ ...styles.text, alignSelf: 'center' }}>
              Who will be the primary contact for your Organization?
            </Text>

            <View>
              <TextInput
                style={{ ...GernalStyle.input, width: getWidth(80) }}
                theme={{ roundness: 10 }}
                ref={inputRefs.orgfullName}
                value={state.orgfullName}
                returnKeyType={'next'}
                mode="outlined"
                activeOutlineColor={'#5B7279'}
                label={'Full Name'}
                onFocus={() => setState({ ...state, orgfullNameError: '' })}
                onBlur={() =>
                  validateFields(state.orgfullName, 'orgfullName', (error) =>
                    setState({ ...state, orgfullNameError: error })
                  )
                }
                onSubmitEditing={() => inputRefs.orgEmail.current.focus()}
                onChangeText={(orgfullName) => changeHandler('orgfullName', orgfullName)}
                blurOnSubmit={false}
              />
              <Text style={{ ...GernalStyle.InputError, marginLeft: 25 }}>
                {state.orgfullNameError}
              </Text>

              <TextInput
                style={{ ...GernalStyle.input, width: getWidth(80) }}
                theme={{ roundness: 10 }}
                mode="outlined"
                ref={inputRefs.orgEmail}
                value={state.orgEmail}
                returnKeyType={'next'}
                activeOutlineColor={'#5B7279'}
                label={'Email'}
                onFocus={() => setState({ ...state, orgEmailError: '' })}
                onBlur={() =>
                  validateFields(state.orgEmail, 'orgEmail', (error) =>
                    setState({ ...state, orgEmailError: error })
                  )
                }
                onSubmitEditing={() => inputRefs.orgPhoneNo.current.focus()}
                onChangeText={(orgEmail) => changeHandler('orgEmail', orgEmail.trim())}
                blurOnSubmit={false}
              />
              <Text style={{ ...GernalStyle.InputError, marginLeft: 25 }}>
                {state.orgEmailError}
              </Text>

              <TextInput
                style={{ ...GernalStyle.input, width: getWidth(80) }}
                theme={{ roundness: 10 }}
                ref={inputRefs.orgPhoneNo}
                value={state.orgPhoneNo}
                returnKeyType={'done'}
                mode="outlined"
                keyboardType="number-pad"
                activeOutlineColor={'#5B7279'}
                label={'Phone number'}
                onFocus={() => setState({ ...state, orgPhoneNoError: '' })}
                onBlur={() =>
                  validateFields(state.orgPhoneNo, 'orgPhoneNo', (error) =>
                    setState({ ...state, orgPhoneNoError: error })
                  )
                }
                onSubmitEditing={() => gonext()}
                onChangeText={(orgPhoneNo) => changeHandler('orgPhoneNo', orgPhoneNo)}
                blurOnSubmit={false}
              />
              <Text style={{ ...GernalStyle.InputError, marginLeft: 25 }}>
                {state.orgPhoneNoError}
              </Text>
            </View>
            <Text
              style={{
                ...styles.text,
                width: getWidth(85),
                alignSelf: 'center',
                color: '#888C93',
                marginTop: 12,
              }}
            >
              Note: This person will serve as the representative for your account and will be
              responsible for all account related communications.{' '}
            </Text>
          </KeyboardAwareScrollView>
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
            style={{ ...GernalStyle.input, width: getWidth(80) }}
            mode="outlined"
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

          <View style={{ ...styles.flatlistview, marginTop: 25 }}>
            {intrest.map((item) => (
              <TouchableOpacity
                onPress={() =>
                  selectedIntrest.includes(item?._id)
                    ? setSelectedIntrest(
                        selectedIntrest.filter(function (item2) {
                          return item2 !== item?._id;
                        })
                      )
                    : setSelectedIntrest([...selectedIntrest, item?._id])
                }
                style={
                  selectedIntrest.includes(item?._id)
                    ? [styles.listItem, { backgroundColor: '#032F3C', borderColor: '#032f3c' }]
                    : styles.listItem
                }
              >
                <Text
                  numberOfLines={1}
                  style={
                    selectedIntrest.includes(item?._id)
                      ? { color: 'white', maxWidth: getWidth(17) }
                      : { color: '#757575', maxWidth: getWidth(17) }
                  }
                >
                  {item?.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            Select a minimum of 3 topics{' '}
            <Text style={{ fontWeight: '400' }}>to personalize your News/Blog stream.</Text>
          </Text>

          <TextInput
            style={{ ...GernalStyle.input, width: getWidth(80) }}
            mode="outlined"
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
            label={'Search by Name & Organization'}
            placeholderTextColor={'black'}
          />

          <View style={{ ...styles.largeview, marginTop: 25 }}>
            <FlatList
              data={org}
              style={{ marginBottom: getHeight(7) }}
              ListFooterComponent={<View style={{ height: getHeight(2) }} />}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              numColumns={3}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() =>
                    Organization.includes(index)
                      ? setOrganization(
                          Organization.filter(function (item) {
                            return item !== index;
                          })
                        )
                      : (setOrganization([...Organization, index]), handelSubscribe(item?._id))
                  }
                  style={styles.box}
                >
                  <Image
                    style={
                      Organization.includes(index)
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
                    <Text numberOfLines={2} style={{ ...styles.textname, textAlign: 'center' }}>
                      {item?.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: '#032f3c',
                        alignSelf: 'center',
                        marginTop: 5,
                        fontSize: 12,
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
        <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.innerContainer}>
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
        </LinearGradient>
      ),
    },
  ];
  const showToast = (sms) => {
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
    flatListRef.scrollToIndex({ index: curentIndex + 1 });
    setCurrentIndex(curentIndex + 1);
  };

  const gonext = async () => {
    switch (curentIndex) {
      case 0:
        next();

        break;
      case 1:
        if (ORGType != null) {
          next();
        } else {
          showToast('Organization Type required!');
        }
        break;
      case 2:
        const { companyName } = state;
        const companyNameError = await validator('companyName', companyName);
        const location_labelError = await validator('location_label', location_label);
        if (!companyNameError && !location_labelError) {
          next();
        } else {
          setState({ ...state, companyNameError, location_labelError });
        }

        break;
      case 3:
        const { orgfullName, orgEmail, orgPhoneNo } = state;
        const orgfullNameError = await validator('orgfullName', orgfullName);
        const orgEmailError = await validator('orgEmail', orgEmail);
        const orgPhoneNoError = await validator('orgPhoneNo', orgPhoneNo);
        if (!orgfullNameError && !orgEmailError && !orgPhoneNoError) {
          next();
        } else {
          setState({
            ...state,
            orgfullNameError,
            orgEmailError,
            orgPhoneNoError,
          });
        }

        break;
      case 4:
        addIntrest();

        break;
      case 5:
        next();
        break;
      case 6:
        getlocationPermison();
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
      <Toast />
      <FlatList
        data={data}
        horizontal={true}
        scrollEnabled={false}
        ref={(ref) => (flatListRef = ref)}
        keyExtractor={(item, index) => {
          item.id;
        }}
        pagingEnabled
        renderItem={({ item }) => <View style={styles.componentview}>{item?.component}</View>}
      />
      {curentIndex == 0 ? null : (
        <View style={styles.foter}>
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
                  flatListRef.scrollToIndex({ index: curentIndex - 1 });
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

            {curentIndex == 6 ? (
              <TouchableOpacity
                onPress={() => {
                  console.log('user', user);
                  const { orgfullName, orgEmail, orgPhoneNo, companyName } = state;
                  const data = {
                    typeOfOrganization: ORGType,
                    companyEmail: orgEmail,
                    companyName: companyName,
                    fullName: orgfullName,
                    companyPhoneNumber: orgPhoneNo,
                    location: {
                      longitude: longitued,
                      latitude: latitude,
                      address: location_label,
                    },
                  };
                  dispatch(orgprofileUpdate({ data, token, go, role: user?.role }));
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
        swipeDirection={['down']}
        style={styles.bottomView}
        onRequestClose={() => hideVisible(false)}
      >
        <View style={styles.content2}>
          <View style={styles.headLine} />
          <View style={{ flex: 1 }}>
            <FlatList
              data={countries}
              keyExtractor={(item, index) => index.toString()}
              ListHeaderComponent={() => <View style={{ height: getHeight(2) }} />}
              ItemSeparatorComponent={() => <Divider />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => {
                    // setWhatIDo(item);
                    setORGType(item);
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
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default OrgnizationSteps;
