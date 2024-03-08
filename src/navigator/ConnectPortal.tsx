import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { styles } from './connectPortalStyles';
import { GOOGLE_MAPS_API_KEY } from '../services/constants';

type types = 'Explore' | 'My Places';

function ConnectPortal() {
  const [selectedOption, setSelectedOption] = useState<types>('Explore');
  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const handleOptionSelect = (option: types) => {
    setSelectedOption(option);
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.header}>PLACES</Text>

        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[styles.option, selectedOption === 'Explore' && styles.selectedOption]}
            onPress={() => handleOptionSelect('Explore')}
          >
            <Text>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selectedOption === 'My Places' && styles.selectedOption]}
            onPress={() => handleOptionSelect('My Places')}
          >
            <Text>My Places</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBar}>
        <TextInput placeholder="Search..." style={styles.input} />
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={(region) => setRegion(region)}
      >
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
      </MapView>
    </View>
  );
}

export default ConnectPortal;
