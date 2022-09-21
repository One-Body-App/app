import React, { useState, useEffect, SetStateAction, Dispatch } from 'react';
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

import Geolocation from '@react-native-community/geolocation';
import { useDispatch } from 'react-redux';
import { setLoader } from '@/redux/actions/GeneralActions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const access_token =
  'pk.eyJ1IjoiaW5hYW0xIiwiYSI6ImNramtmNmljYzJhMWMycnFwM28zOHE4ZzIifQ.pBIP97q3Us332iKImTP9aQ';

export enum MapBoxTypes {
  country = 'country',
  region = 'region',
  postcode = 'postcode',
  district = 'district',
  place = 'place',
  locality = 'locality',
  neighborhood = 'neighborhood',
  address = 'address',
  poi = 'poi',
}

type MapBoxProps = {
  location: MapSuggestion | null;
  setLongitude: Dispatch<SetStateAction<number | null>>;
  setLatitude: Dispatch<SetStateAction<number | null>>;
  CheckIn: boolean;
  setCheckIn: Dispatch<SetStateAction<boolean>>;
  setLocation: Dispatch<SetStateAction<MapSuggestion | null>>;
  types?: MapBoxTypes[];
  countries?: string[];
  hideSearchMyLocation?: boolean;
};

export type MapSuggestion = {
  bbox: number[];
  center: number[];
  geometry: { type: string; coordinates: number[] };
  id: string;
  place_name: string;
  place_type: string[];
  properties: { wikidata: string; short_code: string };
  relevance: 1;
  text: string;
  type: string;
};

let timer: NodeJS.Timeout | null = null;

const MapBox = (props: MapBoxProps) => {
  const { setLocation, location, setCheckIn, CheckIn, setLongitude, setLatitude } = props;

  const [show, setshown] = useState<boolean>(false);
  const [suggetions, setSuggetions] = useState<MapSuggestion[]>();
  const [searchLocation, setsearchLocation] = useState<string>(location?.place_name ?? '');

  const dispatch = useDispatch();

  const getSuggestion = async (val: string) => {
    if (timer) clearTimeout(timer);
    setsearchLocation(val);
    if (val) {
      timer = setTimeout(() => {
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${val}.json?access_token=${access_token}${
            props.types ? `&types=${props.types?.join(',')}` : ''
          }${props.countries ? `&country=${props.countries?.join(',')}` : ''}`
        )
          .then((response) => response.json())
          .then((data) => {
            data?.features == undefined ? setshown(false) : setshown(true);
            setSuggetions(data?.features);
          });
      }, 400);
    }
  };
  const onclose = () => {
    setLocation(null);

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
            buttonPositive: '',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          //To Check, If Permission is granted
          Geolocation.getCurrentPosition((info) => {
            getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
          });
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };
  const getcurrentLocation = (longitude: number, latitude: number) => {
    console.log(longitude, latitude);
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=poi&access_token=${access_token}`
    )
      .then((response) => response.json())
      .then((data) => {
        setLocation(data?.features[0]);
        setsearchLocation(data?.features[0]?.place_name);
        setLatitude(latitude);
        setLongitude(longitude);
        // dispatch(setLoader(false));

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
      avoidKeyboard={true}
    >
      <View style={styles.content2}>
        <View style={styles.headLine} />
        <View style={styles.container}>
          <View style={styles.inputView}>
            <TextInput
              value={searchLocation}
              style={styles.input}
              placeholder="Where are you?"
              onChangeText={(val) => getSuggestion(val)}
              autoFocus={true}
              clearButtonMode="always"
            />
            {!props.hideSearchMyLocation ? (
              <TouchableOpacity onPress={() => onclose()} style={styles.iconTouch}>
                {location != null ? (
                  <Icon name="closecircleo" size={23} color="red" />
                ) : (
                  <MaterialIcons
                    name={'my-location'}
                    onPress={() => {
                      getlocationPermison();
                    }}
                    color="#126B87"
                    size={getFontSize(3.5)}
                  />
                )}
              </TouchableOpacity>
            ) : null}
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
                      setLongitude(item?.center[0]);
                      setLatitude(item?.center[1]);
                      setshown(false);
                      setLocation(item);
                      setsearchLocation(item.place_name);
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
    paddingRight: 50,
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
