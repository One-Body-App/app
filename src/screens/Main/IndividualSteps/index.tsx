import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  PermissionsAndroid,
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
import MapBox from '@/components/MapBox';
import { ApiCall } from '@/services/api';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

// import * as permissions from 'react-native-permissions';
// import MonthPicker from 'react-native-month-year-picker';
import { useDispatch, useSelector } from 'react-redux';
import { profileUpdate, logout } from '@/redux/actions/AuthActions';
import { setLoader } from '@/redux/actions/GeneralActions';
import LinearGradient from 'react-native-linear-gradient';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import moment from 'moment';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '@/constants/GeneralStyle';
import Group134 from '@/assets/svg/Group134.svg';
import GradinteButton from '@/components/GradinteButton';
import { requestUserPermission } from '@/services/Notification/notificationServices';

const IndividualSteps = ({ navigation }) => {
  console.log('er56789oiugfghjkl');
  const countries = ['option 1', 'option 2', 'option 3', 'option 4'];

  const flatListRef = useRef(null);
  const user = useSelector((state) => {
    console.log(state);
    return state.auth.userData;
  });

  const dispatch = useDispatch();
  const [churchAtend, setChurchAtend] = useState(null);
  const [CheckIn, setCheckIn] = useState(false);
  const [location_label, setLocation_label] = useState(null);
  const [longitued, setLongitued] = useState(null);
  const [latitude, setLatitued] = useState(null);
  const [visible, setVisible] = useState(false);
  const [Organization, setOrganization] = useState([]);
  const [curentIndex, setCurrentIndex] = useState(0);
  const [notificationSwitchOn, setNotificationSwitch] = React.useState(false);
  const token = useSelector((state) => state.auth.userToken);
  const [intrest, setIntrest] = useState([]);
  const [selectedIntrest, setSelectedIntrest] = useState([]);
  const [churType, setChurchType] = useState(null);
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
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
        setorg(res.response?.data);
      } else {
        console.log('error', res?.data);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const go = () => {
    navigation.navigate('loading');
  };
  const getIntrest = async () => {
    console.log(token, 'tokentokentoken');
    try {
      const res = await ApiCall({
        route: 'interests',
        verb: 'get',
        token: token,
      });
      console.log(res, 'resres');
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
    // dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: 'individual/add-interests',
        token: token,
        params: { interests: selectedIntrest },
        verb: 'patch',
      });

      if (res?.status == '200') {
        getOrg();
        // dispatch(setLoader(false));

        next();
      } else {
        dispatch(setLoader(false));
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
        console.log('res==400', res);
      }
    } catch (e) {
      console.log('saga sign up err --- ', e);
    }
  };
  const onValueChange = useCallback(
    (event, newDate) => {
      const selectedDate = newDate || date;

      setOpen(false);
      setDate(selectedDate);
    },
    [date, open]
  );
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
              text={churType == null || churType == 'Non-Denomination' ? 'Select One' : churType}
              btnStyle={styles.btn3}
              leftIcon={<View />}
              RightIcon={<Ionicons name="chevron-down" color={'#4F6D77'} size={getFontSize(3)} />}
              btnTextStyle={styles.btnText3}
              onPress={() => setVisible(true)}
            />
            {churType == 'Non-Denomination' ? (
              <Button
                text={'Non-Denomination'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchType(null)}
              />
            ) : (
              <Button
                text={'Non-Denomination'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchType('Non-Denomination')}
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

          <Text style={styles.text}>Step 2 of 7</Text>
          <Text style={styles.heading}>How often do you attend church?</Text>

          <View>
            {churchAtend == 'Weekly' ? (
              <Button
                text={'Weekly'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchAtend(null)}
              />
            ) : (
              <Button
                text={'Weekly'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchAtend('Weekly')}
              />
            )}
            {churchAtend == 'Bi-Weekly' ? (
              <Button
                text={'Bi-Weekly'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchAtend(null)}
              />
            ) : (
              <Button
                text={'Bi-Weekly'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchAtend('Bi-Weekly')}
              />
            )}
            {churchAtend == 'Once a month' ? (
              <Button
                text={'Once a month'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchAtend(null)}
              />
            ) : (
              <Button
                text={'Once a month'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchAtend('Once a month')}
              />
            )}
            {churchAtend == 'I only watch at home' ? (
              <Button
                text={'I only watch at home'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => setChurchAtend(null)}
              />
            ) : (
              <Button
                text={'I only watch at home'}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
                onPress={() => setChurchAtend('I only watch at home')}
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
          <View style={styles.dateContainer}>
            <TextInput
              mode="outlined"
              label="Date"
              value={moment(date).format('YYYY-MM')}
              style={{ ...GeneralStyle.input, width: getWidth(80) }}
              activeOutlineColor={'#5B7279'}
              theme={{ roundness: 10 }}
              showSoftInputOnFocus={false}
              onFocus={() => setOpen(true)}
              // onChangeText={() => setDate}
              onPressIn={() => setOpen(true)}
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
              mode="date"
              open={open}
              date={date}
              androidVariant={'iosClone'}
              onConfirm={(date) => {
                setOpen(false);
                setDate(date);
                console.log(date);
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
            value={location_label}
            theme={{ roundness: 10 }}
            activeOutlineColor={'#5B7279'}
            showSoftInputOnFocus={false}
            onFocus={() => setCheckIn(true)}
            onPressIn={() => setCheckIn(true)}
            label={'City, State'}
            placeholderTextColor={'black'}
          />
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
            style={{ ...GeneralStyle.input, width: getWidth(80) }}
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
              ItemSeparatorComponent={() => <View style={{ height: getHeight(1) }} />}
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
    console.log(flatListRef, curentIndex + 1, 'asdfsdfasdfasdf');
    flatListRef?.current?.scrollToIndex({ index: curentIndex + 1 });
    console.log(curentIndex + 1, 'curentIndex + 1');
    setCurrentIndex(curentIndex + 1);
  };
  const gonext = () => {
    switch (curentIndex) {
      case 0:
        next();

        break;
      case 1:
        if (churType != null) {
          next();
        } else {
          showToast('Church Type required!');
        }
        break;
      case 2:
        if (churchAtend != null) {
          next();
        } else {
          showToast('Church Atend days required!');
        }
        break;
      case 3:
        if (location_label != null && date != null) {
          next();
        } else {
          showToast('Location and Birth date required!');
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
        ref={flatListRef}
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
                progress={(curentIndex + 1) * 15}
                height={7}
                backgroundColor="#12D2D9"
                trackColor="#032F3c"
              />
            </View>

            {curentIndex == 6 ? (
              <TouchableOpacity
                onPress={() => {
                  const data = {
                    churchType: churType,
                    oftenChurch: churchAtend,
                    dateOfBirth: date,
                    location: {
                      longitude: longitued,
                      latitude: latitude,
                      address: location_label,
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
                    setChurchType(item);
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
export default IndividualSteps;
