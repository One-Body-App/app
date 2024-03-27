import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../../components/ConnectPortal/connectPortalStyles';
import LobbyConnectPortal from '../../components/ConnectPortal/LobbyConnectPortal';

type connectPortalTabsTypes = 'Places' | 'Go' | 'Serve';

function ConnectPortalHome() {
  const [selectedOption, setSelectedOption] = useState<connectPortalTabsTypes>('Places');
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

  const handleOptionSelect = (option: connectPortalTabsTypes) => {
    setSelectedOption(option);
    if (option === 'Places') {
      navigation.navigate('People');
    } else if (option === 'Serve') {
      navigation.navigate('Serve');
    }
  };

  const toggleLobbyModal = () => {
    setLobbyModalVisible(!lobbyModalVisible);
  };

  return (
    <View style={styles.container}>
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
        <OptionButton
          label="Pleople/Places"
          option="Places"
          selectedOption={selectedOption}
          onPress={handleOptionSelect}
        />
        <OptionButton
          label="Go!"
          option="Go"
          selectedOption={selectedOption}
          onPress={handleOptionSelect}
        />
        <OptionButton
          label="Serve"
          option="Serve"
          selectedOption={selectedOption}
          onPress={handleOptionSelect}
        />
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

interface OptionButtonProps {
  label: string;
  option: connectPortalTabsTypes;
  selectedOption: connectPortalTabsTypes;
  onPress: (option: connectPortalTabsTypes) => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ label, option, selectedOption, onPress }) => {
  const isSelected = selectedOption === option;

  return (
    <TouchableOpacity
      style={[styles.option, isSelected && styles.selectedOption]}
      onPress={() => onPress(option)}
    >
      <Text
        style={{
          color: isSelected ? '#126B87' : '#000',
        }}
      >
        {label}
      </Text>
      {isSelected && <View style={styles.selectedBar} />}
    </TouchableOpacity>
  );
};

export default ConnectPortalHome;
