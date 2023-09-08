import React, { useState, useEffect, SetStateAction, Dispatch } from 'react';
import {
  FlatList,
  Platform,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';

import Geolocation from '@react-native-community/geolocation';

import { useTheme } from '@react-navigation/native';
import { borderRadius } from '../styles/outlines';
import { StyledText } from './styled/Text';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Gps, GpsSlash } from 'iconsax-react-native';
import { Colors, Typography } from '../styles';
import { StyledTextInput } from './styled/TextInput';
import SearchIcon from '@/assets/icons/search.svg';

const access_token =
  'pk.eyJ1Ijoib25lYm9keWRldiIsImEiOiJjbGJ4a2Z4ZDQwYjkzM3ZtZHFib3Noa21jIn0.focAWV7VQewXQeUykG8LVA';

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
  setLongitude: Dispatch<SetStateAction<number | undefined>>;
  setLatitude: Dispatch<SetStateAction<number | undefined>>;
  modalVisible: boolean;
  setModalVisible: Dispatch<SetStateAction<boolean>>;
  setLocation: Dispatch<SetStateAction<MapSuggestion | null>>;
  types?: MapBoxTypes[];
  countries?: string[];
  hideSearchMyLocation?: boolean;
  modalTitle: string;
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
  const { setLocation, location, setModalVisible, modalVisible, setLongitude, setLatitude } = props;
  const { colors, dark } = useTheme();

  const [show, setshown] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggetions, setSuggetions] = useState<MapSuggestion[]>();
  const [searchLocation, setsearchLocation] = useState<string>(location?.place_name ?? '');

  const getSuggestion = async (val: string) => {
    setLoading(true);
    if (timer) clearTimeout(timer);
    setsearchLocation(val);
    if (val) {
      timer = setTimeout(() => {
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${val}.json?access_token=${access_token}${
            props.types ? `&types=${props.types?.join(',')}` : '&types=place'
          }${props.countries ? `&country=${props.countries?.join(',')}` : ''}`
        )
          .then((response) => response.json())
          .then((data) => {
            data?.features == undefined ? setshown(false) : setshown(true);
            setSuggetions(data?.features);
            setLoading(false);
          });
      }, 400);
    } else {
      setSuggetions([]);
      setLoading(false);
    }
  };
  const onclose = () => {
    setLocation(null);
    setsearchLocation('');
    setModalVisible(false);
    setSuggetions([]);
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
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
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
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${access_token}${
        props.types ? `&types=${props.types?.join(',')}` : '&types=place'
      }${props.countries ? `&country=${props.countries?.join(',')}` : ''}`
    )
      .then((response) => response.json())
      .then((data) => {
        setLocation(data?.features[0]);
        setsearchLocation(data?.features[0]?.place_name);
        setLatitude(latitude);
        setLongitude(longitude);
        // dispatch(setLoader(false));
        setLoading(false);
        setModalVisible(false);
      });
  };

  return (
    <Modal
      swipeDirection={['down']}
      avoidKeyboard={true}
      backdropOpacity={0.3}
      isVisible={modalVisible}
      onBackdropPress={() => onclose()}
      onSwipeComplete={() => onclose()}
      // style={styles.bottomView}
      style={{
        justifyContent: 'flex-end',
        margin: 0,
      }}
      propagateSwipe={true}
    >
      <View
        style={{
          paddingVertical: 18,
          borderTopRightRadius: borderRadius.large,
          borderTopLeftRadius: borderRadius.large,
          height: '60%',
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flex: 1.5, maxHeight: 80, paddingHorizontal: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              flex: 1,
              paddingBottom: 10,
            }}
          >
            <StyledText style={{ fontSize: 18 }}>{props.modalTitle}</StyledText>
            <TouchableOpacity
              onPress={() => {
                // setModalVisible(false);
                onclose();
              }}
            >
              <MaterialCommunityIcons name="window-close" size={18} color={Colors.primary.brand} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 2 }}>
            <StyledTextInput
              autoFocus
              wrapperStyle={{ flex: 1 }}
              value={searchLocation}
              returnKeyType={'search'}
              placeholder="Search"
              onChangeText={(val) => getSuggestion(val)}
              leftIcon={
                <View>
                  <SearchIcon
                    style={{ height: 20, width: 20, marginRight: 10 }}
                    stroke={Colors.neutral[200]}
                  />
                </View>
                // <MaterialCommunityIcons
                //   name="magnify"
                //   size={20}
                //   style={{ marginRight: 10 }}
                //   color={Colors.neutral[200]}
                // />
              }
              rightIcon={
                !props.hideSearchMyLocation ? (
                  <>
                    {location != null && searchLocation ? null : (
                      <>
                        {loading ? (
                          <ActivityIndicator animating={true} size="small" color={colors.text} />
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              setLoading(true);
                              getlocationPermison();
                            }}
                          >
                            <Gps size={20} color={Colors.primarySapphire.brand} />
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </>
                ) : undefined
              }
            />
          </View>
        </View>
        <View style={{ flex: 5 }}>
          {show == true ? (
            <FlatList
              style={{ flex: 1, paddingVertical: 10 }}
              nestedScrollEnabled
              data={suggetions}
              ListEmptyComponent={
                <>
                  {searchLocation && !loading ? (
                    <StyledText style={[Typography.body.x2M, { padding: 18, textAlign: 'center' }]}>
                      No results found
                    </StyledText>
                  ) : null}
                </>
              }
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setLongitude(item?.center[0]);
                      setLatitude(item?.center[1]);
                      setshown(false);
                      setLocation(item);
                      setsearchLocation(item.place_name);
                      setModalVisible(false);
                    }}
                  >
                    <View>
                      <StyledText
                        style={{ color: colors.text, marginHorizontal: 18, marginVertical: 10 }}
                      >
                        {item.place_name}
                      </StyledText>
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

export default MapBox;
