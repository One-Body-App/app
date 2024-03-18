import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faFilter,
  faList,
  faMap,
  faChurch,
  faMapMarker,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { styles } from '../../components/ConnectPortal/connectPortalStyles';
import LobbyConnectPortal from '@/src/components/ConnectPortal/LobbyConnectPortal';

type types = 'Explore' | 'My Place' | 'Filter' | 'List' | 'Map' | 'People/Places';

interface Organization {
  id: number;
  name: string;
  type: string;
  location: string;
}

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

  const [organizations, setOrganizations] = useState<Organization[]>(() => [
    {
      id: 1,
      name: 'Example Church',
      type: 'Church',
      location: 'Toronto',
    },
    {
      id: 2,
      name: 'Another Church',
      type: 'Church',
      location: 'New York',
    },
    {
      id: 3,
      name: 'Another Church',
      type: 'Church',
      location: 'Miami',
    },
    {
      id: 4,
      name: 'Another Church',
      type: 'Houst',
      location: 'Houston texas',
    },
  ]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [lobbyModalVisible, setLobbyModalVisible] = useState(false);

  const handleOptionSelect = (option: types) => {
    setSelectedOption(option);
  };

  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible);
  };

  const toggleLobbyModal = () => {
    setLobbyModalVisible(!lobbyModalVisible);
  };

  const renderOrganizationItem = ({ item }: { item: Organization }) => (
    <View style={styles.organizationContainer}>
      <Image source={item.image} style={styles.organizationImage} />
      <View style={styles.organizationDetails}>
        <Text>{item.name}</Text>
        <View style={styles.organizationTypeContainer}>
          <FontAwesomeIcon icon={faChurch} size={16} color="black" />
          <Text>{item.type}</Text>
        </View>
        <View style={styles.organizationLocationContainer}>
          <FontAwesomeIcon icon={faMapMarker} size={16} color="black" />
          <Text>{item.location}</Text>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    setLobbyModalVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleLobbyModal}>
        <Text>Open Lobby Modal</Text>
      </TouchableOpacity>
      <Modal
        visible={lobbyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLobbyModalVisible(false)}
      >
        <LobbyConnectPortal onClose={() => setLobbyModalVisible(false)} />
      </Modal>

      <View>
        <Text style={styles.header}>People/Places</Text>

        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[styles.option, selectedOption === 'Explore' && styles.selectedOption]}
            onPress={() => handleOptionSelect('Explore')}
          >
            <Text>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selectedOption === 'My Place' && styles.selectedOption]}
            onPress={() => handleOptionSelect('My Place')}
          >
            <Text>My Place</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selectedOption === 'People/Places' && styles.selectedOption]}
            onPress={() => handleOptionSelect('People/Places')}
          >
            <Text>People/Places</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedOption !== 'Map' && (
        <View style={styles.searchBar}>
          <TextInput placeholder="Search..." style={styles.input} />
        </View>
      )}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, selectedOption === 'Filter' && styles.activeButton]}
          onPress={toggleFilterModal}
        >
          <FontAwesomeIcon
            icon={faFilter}
            size={24}
            color={selectedOption === 'Filter' ? 'white' : 'black'}
          />
          <Text>Filter</Text>
        </TouchableOpacity>

        <View style={styles.listMapButtons}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.listButton,
              selectedOption === 'List' && styles.activeButton,
            ]}
            onPress={() => handleOptionSelect('List')}
          >
            <FontAwesomeIcon
              icon={faList}
              size={24}
              color={selectedOption === 'List' ? 'white' : 'black'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.mapButton,
              selectedOption === 'Map' && styles.activeButton,
            ]}
            onPress={() => handleOptionSelect('Map')}
          >
            <FontAwesomeIcon
              icon={faMap}
              size={24}
              color={selectedOption === 'Map' ? 'white' : 'black'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {selectedOption === 'Map' ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          onRegionChangeComplete={(region) => setRegion(region)}
        >
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
        </MapView>
      ) : (
        <FlatList
          data={organizations}
          renderItem={renderOrganizationItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  );
}

export default ConnectPortal;
