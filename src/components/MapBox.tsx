import React, { useState, SetStateAction, Dispatch, ReactElement, useEffect } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
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
import { MAPBOX_PUBLIC_TOKEN } from '@/services/constants';
import { MapBoxTypes, type MapSuggestion } from './MapBoxTypes';

type MapBoxProps = {
  location: MapSuggestion | null;
  setLongitude?: Dispatch<SetStateAction<number | undefined>>;
  setLatitude?: Dispatch<SetStateAction<number | undefined>>;
  modalVisible?: boolean;
  setModalVisible?: Dispatch<SetStateAction<boolean>>;
  setLocation: Dispatch<SetStateAction<MapSuggestion | null>>;
  types?: MapBoxTypes[];
  countries?: string[];
  modalTitle: ReactElement;
  inline?: boolean;
};

let timer: NodeJS.Timeout | null = null;
const accessToken = String(MAPBOX_PUBLIC_TOKEN ?? '').trim();
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
  inline = false,
}: MapBoxProps) {
  const { colors } = useTheme();

  const [, setshown] = useState<boolean>(!!location);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggetions, setSuggetions] = useState<MapSuggestion[]>(location ? [location] : []);
  const [searchLocation, setsearchLocation] = useState<string>(location?.place_name ?? '');
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();
  const [locationPrompted, setLocationPrompted] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('location_permission_requested').then((val) => {
      setLocationPrompted(val === '1');
    });
  }, []);

  useEffect(() => {
    if (!modalVisible || userCoords) {
      return;
    }
    Geolocation.getCurrentPosition(
      (info) => {
        setUserCoords({ lng: info.coords.longitude, lat: info.coords.latitude });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, [modalVisible, userCoords]);

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
          }${countries ? `&country=${countries?.join(',')}` : ''}${
            userCoords ? `&proximity=${userCoords.lng},${userCoords.lat}` : ''
          }`
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
        granted = await new Promise<boolean>((resolve) => {
          Geolocation.requestAuthorization(
            () => resolve(true),
            () => resolve(false)
          );
        });
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
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator animating size="small" color={colors.text} />
          ) : (
            <Pressable
              onPress={() => {
                setLoading(true);
                getlocationPermison();
              }}
            >
              <Gps size={20} color={Colors.primarySapphire.brand} />
            </Pressable>
          )}
        </View>
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
          <Pressable
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
          </Pressable>
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
        backgroundColor: colors.background,
        flex: 1,
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

            <Pressable
              onPress={() => {
                // setModalVisible(false);
                onclose();
              }}
            >
              <MaterialCommunityIcons name="window-close" size={18} color={Colors.primary.brand} />
            </Pressable>
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
    <CustomModal modalVisible={modalVisible ?? false} onclose={() => onclose()} avoidKeyboard>
      {content}
    </CustomModal>
  );
}

export default MapBox;
