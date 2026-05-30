/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import MapBox from '../MapBox';
import { MapBoxTypes } from '../MapBoxTypes';

const mockCustomModal = jest.fn();

jest.mock('../CustomModal', () => (props: any) => {
  const ReactLocal = require('react');
  mockCustomModal(props);
  return ReactLocal.createElement(ReactLocal.Fragment, null, props.children);
});

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  requestAuthorization: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({
    colors: {
      text: '#000000',
      background: '#ffffff',
    },
  }),
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialCommunityIcons');
jest.mock('iconsax-react-native', () => ({ Gps: 'Gps' }));
jest.mock('@/assets/icons/search.svg', () => 'SearchIcon');
jest.mock('../styled/Text', () => 'StyledText');
jest.mock('../styled/TextInput', () => 'StyledTextInput');

describe('MapBox', () => {
  beforeEach(() => {
    mockCustomModal.mockClear();
  });

  it('opts the modal into keyboard avoidance for location search', async () => {
    await act(async () => {
      TestRenderer.create(
        <MapBox
          location={null}
          modalVisible
          setModalVisible={jest.fn()}
          setLocation={jest.fn()}
          types={[MapBoxTypes.address]}
          modalTitle={<Text>Location</Text>}
        />
      );
    });

    expect(mockCustomModal).toHaveBeenCalledWith(
      expect.objectContaining({
        avoidKeyboard: true,
        modalVisible: true,
      })
    );
  });
});
