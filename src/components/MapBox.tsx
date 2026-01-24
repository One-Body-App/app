import React, { useState, SetStateAction, Dispatch, ReactElement, useEffect } from 'react';
import {
  FlatList,
  Platform,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Gps } from 'iconsax-react-native';
import { borderRadius } from '../styles/outlines';
import StyledText from './styled/Text';
import { Colors, Typography } from '../styles';
import StyledTextInput from './styled/TextInput';
import SearchIcon from '@/assets/icons/search.svg';
import CustomModal from './CustomModal';

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
  setLongitude?: Dispatch<SetStateAction<number | undefined>>;
  setLatitude?: Dispatch<SetStateAction<number | undefined>>;
  modalVisible?: boolean;
  setModalVisible?: Dispatch<SetStateAction<boolean>>;
  setLocation: Dispatch<SetStateAction<MapSuggestion | null>>;
  types?: MapBoxTypes[];
  countries?: string[];
  hideSearchMyLocation?: boolean;
  modalTitle: ReactElement;
  inline?: boolean;
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
const accessToken =
  'pk.eyJ1Ijoib25lYm9keWRldiIsImEiOiJjbGJ4a2Z4ZDQwYjkzM3ZtZHFib3Noa21jIn0.focAWV7VQewXQeUykG8LVA';
function MapBox({
  types,
  countries,
  setLocation,
  location,
  setModalVisible,
  modalVisible,
  setLongitude,
  setLatitude,
  modalTitle,
  hideSearchMyLocation,
  inline = false,
}: MapBoxProps) {
  const { colors } = useTheme();

  const [, setshown] = useState<boolean>(!!location);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggetions, setSuggetions] = useState<MapSuggestion[]>(location ? [location] : []);
  const [searchLocation, setsearchLocation] = useState<string>(location?.place_name ?? '');
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();
  const [locationPrompted, setLocationPrompted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('location_permission_requested').then((val) => {
      setLocationPrompted(val === '1');
    });
  }, []);

  const focusSelectionStart = () => {
    setSelection({ start: 0, end: 0 });
    requestAnimationFrame(() => {
      setSelection(undefined);
    });
  };

  const getSuggestion = async (val: string) => {
    setLoading(true);
    if (timer) clearTimeout(timer);
    setSelection(undefined);
    setsearchLocation(val);
    if (val) {
      timer = setTimeout(() => {
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${val}.json?access_token=${accessToken}${
            types ? `&types=${types?.join(',')}` : '&types=place'
          }${countries ? `&country=${countries?.join(',')}` : ''}`
        )
          .then((response) => response.json())
          .then((data) => {
            if (data?.features == undefined) {
              setshown(false);
            } else {
              setshown(true);
            }
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
    if (inline) {
      setSuggetions([]);
      setshown(false);
      return;
    }

    setsearchLocation('');
    setModalVisible?.(false);
    setSuggetions([]);
    setshown(false);
    // setCheckIn(false);
  };
  const getlocationPermison = async () => {
    try {
      if (locationPrompted) {
        Geolocation.getCurrentPosition((info) => {
          getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
        });
        return;
      }

      let granted = false;
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message: 'This App needs to access your location',
            buttonPositive: 'Allow',
          }
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const status = await Geolocation.requestAuthorization('whenInUse');
        granted = status === 'granted';
      }

      if (granted) {
        Geolocation.getCurrentPosition((info) => {
          getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
        });
      }
    } catch (err) {
      console.warn(err);
    } finally {
      await AsyncStorage.setItem('location_permission_requested', '1');
      setLocationPrompted(true);
    }
  };
  const getcurrentLocation = (longitude: number, latitude: number) => {
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}${
        types ? `&types=${types?.join(',')}` : '&types=place'
      }${countries ? `&country=${countries?.join(',')}` : ''}`
    )
      .then((response) => response.json())
      .then((data) => {
        setLocation(data?.features[0]);
        setsearchLocation(data?.features[0]?.place_name);
        focusSelectionStart();
        if (setLatitude) setLatitude(latitude);
        if (setLongitude) setLongitude(longitude);
        // dispatch(setLoader(false));
        setLoading(false);

        onclose();
      });
  };

  const searchInput = (
    <StyledTextInput
      wrapperStyle={{ flex: 0 }}
      value={searchLocation}
      selection={selection}
      returnKeyType="search"
      placeholder="Search"
      onChangeText={(val) => getSuggestion(val)}
      leftIcon={
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <SearchIcon
            style={{ height: 20, width: 20, marginRight: 10 }}
            stroke={Colors.neutral[200]}
          />
        </View>
      }
      rightIcon={
        !hideSearchMyLocation ? (
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            {location != null && searchLocation ? null : (
              // eslint-disable-next-line react/jsx-no-useless-fragment
              <>
                {loading ? (
                  <ActivityIndicator animating size="small" color={colors.text} />
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
          </View>
        ) : undefined
      }
    />
  );

  const suggestionsList = (
    <FlatList
      style={{ flex: 1, paddingVertical: 10 }}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      data={suggetions}
      ListEmptyComponent={
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
          {searchLocation && !loading && location == null ? (
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
              if (setLongitude) setLongitude(item?.center[0]);
              if (setLatitude) setLatitude(item?.center[1]);

              setLocation(item);
              setsearchLocation(item.place_name);
              focusSelectionStart();

              onclose();
            }}
          >
            <View>
              <StyledText style={{ color: colors.text, marginHorizontal: 18, marginVertical: 10 }}>
                {item.place_name}
              </StyledText>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );

  const content = (
    <View
      style={{
        paddingVertical: inline ? 0 : 18,
        borderTopRightRadius: inline ? 0 : borderRadius.large,
        borderTopLeftRadius: inline ? 0 : borderRadius.large,
        height: inline ? undefined : '60%',
        backgroundColor: colors.background,
        flex: inline ? 1 : undefined,
      }}
    >
      <View style={{ paddingHorizontal: inline ? 0 : 18 }}>
        {!inline ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 10,
            }}
          >
            {modalTitle}

            <TouchableOpacity
              onPress={() => {
                // setModalVisible(false);
                onclose();
              }}
            >
              <MaterialCommunityIcons name="window-close" size={18} color={Colors.primary.brand} />
            </TouchableOpacity>
          </View>
        ) : null}
        {searchInput}
      </View>
      <View style={{ flex: 1 }}>{suggestionsList}</View>
    </View>
  );

  if (inline) {
    return content;
  }

  return (
    <CustomModal modalVisible={modalVisible ?? false} onclose={() => onclose()}>
      {content}
    </CustomModal>
  );
}

export default MapBox;
