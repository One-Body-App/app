import React, { useState } from 'react';
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

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { styles } from './connectPortalStyles';

type types = 'Explore' | 'My Places' | 'Filter' | 'List' | 'Map';

interface Organization {
  id: number;
  name: string;
  type: string;
  location: string;
  image: any;
}

function FilterModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter</Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <FontAwesomeIcon icon={faTimes} size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          {/* Location, Distance, Organization Type, Denomination */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Location</Text>
            <TextInput style={styles.input} placeholder="Select" />
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Distance (Mi)</Text>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Organization Type</Text>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Denomination</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.applyFilterButton}>
          <Text style={styles.applyFilterText}>Apply Filter</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
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

  // importar organizaciones
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const handleOptionSelect = (option: types) => {
    setSelectedOption(option);
  };

  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible);
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

      <FilterModal visible={filterModalVisible} onClose={toggleFilterModal} />
    </View>
  );
}

export default ConnectPortal;
