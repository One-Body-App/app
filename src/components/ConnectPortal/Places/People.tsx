import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  FlatList,
  Modal,
  ScrollView,
  ImageSourcePropType,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSlidersH,
  faList,
  faMap,
  faChurch,
  faMapMarker,
} from '@fortawesome/free-solid-svg-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '@/src/styles/spacing';
import { styles } from '../connectPortalStyles';
import HomeScreen from './HomeScreen';
import churchImage from '../../../assets/images/church.jpeg';

type types = 'Explore' | 'My Places' | 'Filter' | 'List' | 'Map';
interface Organization {
  id: number;
  name: string;
  type: string;
  location: string;
  imageSource: ImageSourcePropType;
}

function People() {
  const navigation = useNavigation();

  const [selectedOption, setSelectedOption] = useState<types>('Explore');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      imageSource: churchImage,
    },
    {
      id: 2,
      name: 'Another Church',
      type: 'Church',
      location: 'New York',
      imageSource: churchImage,
    },
    {
      id: 3,
      name: 'Another Church',
      type: 'Church',
      location: 'Miami',
      imageSource: churchImage,
    },
    {
      id: 4,
      name: 'Another Church',
      type: 'Houst',
      location: 'Houston texas',
      imageSource: churchImage,
    },
    {
      id: 5,
      name: 'Another Church',
      type: 'Houst',
      location: 'Houston texas',
      imageSource: churchImage,
    },
  ]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible);
  };

  const handleOptionSelect = (option: types) => {
    setSelectedOption(option);
    if (option === 'Filter') {
      navigation.navigate('FilterScreen');
    }
  };

  const renderOrganizationItem = ({ item }: { item: Organization }) => (
    <View style={localstyle.organizationCard}>
      <View style={styles.organizationContainer}>
        <Image source={item.imageSource} style={styles.organizationImage} />
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
    </View>
  );

  return (
    <ScrollView>
      <View style={{ flex: 1 }}>
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[styles.option, selectedOption === 'Explore' && styles.selectedOption]}
            onPress={() => setSelectedOption('Explore')}
          >
            <Text>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selectedOption === 'My Places' && styles.selectedOption]}
            onPress={() => setSelectedOption('My Places')}
          >
            <Text>My Places</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search"
            style={styles.input}
            onChangeText={(text) => setSearchQuery(text)}
            value={searchQuery}
          />
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, selectedOption === 'Filter' && styles.activeButton]}
            onPress={() => handleOptionSelect('Filter')}
          >
            <FontAwesomeIcon
              icon={faSlidersH}
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

        {/* Integración del componente HomeScreen */}

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
            contentContainerStyle={localstyle.flatListContainer}
          />
        )}
      </View>
    </ScrollView>
  );
}

const localstyle = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  backButton: {
    padding: 10,
    position: 'absolute',
    left: 0,
  },
  searchIcon: {
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: spacing.x13,
    backgroundColor: '#F2F3F3',
  },
  organizationCard: {
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  flatListContainer: {
    padding: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    fontSize: 24,
    marginRight: 'auto',
  },
});

export default People;
