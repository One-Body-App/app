import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAPBOX_ACCESS_TOKEN =
  'pk.eyJ1Ijoib25lYm9keWRldiIsImEiOiJjbGJ4a2Z4ZDQwYjkzM3ZtZHFib3Noa21jIn0.focAWV7VQewXQeUykG8LVA';

type Coordinates = {
  longitude: number;
  latitude: number;
};

type DeviceLocation = Coordinates & {
  address?: string;
};

const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Allow location',
          message: 'We use your city to help personalize your experience.',
          buttonPositive: 'Allow',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

const getCurrentCoordinates = async (): Promise<Coordinates | null> => {
  const permissionRequested = await AsyncStorage.getItem('location_permission_requested');
  let granted = permissionRequested === '1';

  if (!granted) {
    granted = await requestLocationPermission();
    await AsyncStorage.setItem('location_permission_requested', '1');
  }

  if (!granted) {
    return null;
  }

  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (info) =>
        resolve({
          longitude: info.coords.longitude,
          latitude: info.coords.latitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  });
};

const reverseGeocode = async (longitude: number, latitude: number): Promise<string | undefined> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place`
    );
    const data = await response.json();
    const first = data?.features?.[0];
    return typeof first?.place_name === 'string' ? first.place_name : undefined;
  } catch (error) {
    return undefined;
  }
};

export const getDeviceLocation = async (): Promise<DeviceLocation | null> => {
  const coords = await getCurrentCoordinates();
  if (!coords) return null;
  const address = await reverseGeocode(coords.longitude, coords.latitude);
  return address ? { ...coords, address } : coords;
};
