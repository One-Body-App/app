import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Modal } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../../components/ConnectPortal/connectPortalStyles';
import LobbyConnectPortal from '../../components/ConnectPortal/LobbyConnectPortal';

type types = 'People/Places' | 'Go!' | 'Serve';

function ConnectPortalHome() {
  const [selectedOption, setSelectedOption] = useState<types>('People/Places');
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

  const [lobbyModalVisible, setLobbyModalVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    setLobbyModalVisible(true);
  }, []);

  const handleOptionSelect = (option: types) => {
    setSelectedOption(option);
    if (option === 'People/Places') {
      navigation.native('People');
    }
  };

  const toggleLobbyModal = () => {
    setLobbyModalVisible(!lobbyModalVisible);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Connect Portal</Text>

      <Modal
        visible={lobbyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLobbyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LobbyConnectPortal onClose={() => setLobbyModalVisible(false)} />
        </View>
      </Modal>

      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={[styles.option, selectedOption === 'People/Places' && styles.selectedOption]}
          onPress={() => handleOptionSelect('People/Places')}
        >
          <Text>Pleople/Places</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, selectedOption === 'Go!' && styles.selectedOption]}
          onPress={() => handleOptionSelect('Go!')}
        >
          <Text>Go!</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, selectedOption === 'Serve' && styles.selectedOption]}
          onPress={() => handleOptionSelect('Serve')}
        >
          <Text>Serve</Text>
        </TouchableOpacity>
      </View>
      <MapView
        style={styles.mapContainer}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={(region) => setRegion(region)}
      >
        <Marker coordinate={{ latitude: region.latitude, longitude: region.latitude }} />
      </MapView>

      <TouchableOpacity onPress={toggleLobbyModal}>
        <Text>Open Lobby</Text>
      </TouchableOpacity>
    </View>
  );
}

export default ConnectPortalHome;
