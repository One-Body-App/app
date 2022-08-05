import React, { useState, useEffect } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  View,
  Image,
  PermissionsAndroid,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/AntDesign';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import Geolocation from '@react-native-community/geolocation';
import { useDispatch } from 'react-redux';
import { setLoader } from '@/redux/actions/GernalActions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const access_token =
  'pk.eyJ1IjoiaW5hYW0xIiwiYSI6ImNramtmNmljYzJhMWMycnFwM28zOHE4ZzIifQ.pBIP97q3Us332iKImTP9aQ';

const MapBox = (props) => {
  const [show, setshown] = useState(false);
  const [suggetions, setSuggetions] = useState();
  const { setLocation_label, location_label, setCheckIn, CheckIn, setLongitued, setLatitued } =
    props;
  const dispatch = useDispatch();

  const getSuggestion = async (val) => {
    setLocation_label(val);
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${val}.json?access_token=${access_token}`
    )
      .then((response) => response.json())
      .then((data) => {
        data?.features == undefined ? setshown(false) : setshown(true);
        setSuggetions(data?.features);
      });
  };
  const onclose = () => {
    setLocation_label('');

    // setCheckIn(false);
  };
  const getlocationPermison = async () => {
    if (Platform.OS === 'ios') {
      Geolocation.getCurrentPosition((info) => {
        getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
      });
    } else {
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
          Geolocation.getCurrentPosition((info) => {
            getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
          });
        } else {
          setLocationStatus('Permission Denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };
  const getcurrentLocation = (longitude, latitude) => {
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=poi&access_token=${access_token}`
    )
      .then((response) => response.json())
      .then((data) => {
        setLocation_label(data?.features[0]?.place_name);
        setLatitued(latitude);
        setLongitued(longitude);
        dispatch(setLoader(false));
        setCheckIn(false);
      });
  };

  return (
    <Modal
      backdropOpacity={0.3}
      isVisible={CheckIn}
      onBackdropPress={() => setCheckIn(false)}
      onSwipeComplete={() => setCheckIn(false)}
      swipeDirection={['down']}
      style={styles.bottomView}
      onRequestClose={() => setCheckIn(false)}
    >
      <View style={styles.content2}>
        <View style={styles.headLine} />
        <View style={styles.container}>
          <View style={styles.inputView}>
            <TextInput
              value={location_label}
              style={styles.input}
              placeholder="Where are you?"
              onChangeText={(val) => getSuggestion(val)}
            />
            <TouchableOpacity onPress={() => onclose()} style={styles.iconTouch}>
              {location_label != '' && location_label != null ? (
                <Icon name="closecircleo" size={23} color="red" />
              ) : (
                <MaterialIcons
                  name={'my-location'}
                  onPress={() => {
                    dispatch(setLoader(true));
                    getlocationPermison();
                  }}
                  color="#126B87"
                  size={getFontSize(3.5)}
                />
              )}
            </TouchableOpacity>
          </View>

          {show == true ? (
            <FlatList
              style={{ flex: 1 }}
              nestedScrollEnabled
              data={suggetions}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setLongitued(item?.center[0]);
                      setLatitued(item?.center[1]);
                      setshown(false);
                      setLocation_label(item.place_name);
                      setCheckIn(false);
                    }}
                  >
                    <View style={styles.placeItemView}>
                      <Text>{item.place_name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: 'white',
  },
  imageThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  placeItemView: { padding: 10, backgroundColor: 'white' },
  input: {
    height: 40,
    paddingLeft: 15,
    width: getWidth(80),
  },
  inputView: {
    height: 40,
    margin: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
  },
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  iconTouch: {
    justifyContent: 'center',
    alignSelf: 'center',
    paddingRight: getWidth(2),
    color: 'red',
  },
  mapImage: {
    width: '100%',
    alignSelf: 'center',
    resizeMode: 'stretch',
    height: 300,
    //margin: 10,
    marginVertical: 10,
  },
  content2: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 13,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    height: getHeight(38),
  },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,
    backgroundColor: '#EAEAEA',
    marginBottom: 5,
  },
});

export default MapBox;
