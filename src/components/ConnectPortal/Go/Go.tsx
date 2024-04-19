import React, { useState } from 'react';
import {
  ImageSourcePropType,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faMapMarker,
  faCalendar,
  faClock,
  faSlidersH,
  faList,
  faMap,
} from '@fortawesome/free-solid-svg-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { styles } from '../connectPortalStyles';
import EventsImage from '@/assets/images/Events.png';
import EventDetails from './EventDetails';

type types = 'Explore' | 'Saved' | 'My Events' | 'Filter' | 'List' | 'Map';

interface Events {
  id: number;
  name: string;
  date: Date;
  hour: string;
  location: string;
  imageSource: ImageSourcePropType;
}

function Go() {
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

  const [events, setEvents] = useState<Events[]>([
    {
      id: 1,
      name: 'Easter sunday Thanksgiving',
      date: new Date(2024, 5, 23),
      hour: '5:30 pm - 6:30 pm EST',
      location: 'Toronto',
      imageSource: EventsImage,
    },
    {
      id: 2,
      name: 'Easter sunday Thanksgiving',
      date: new Date(2024, 5, 23),
      hour: '5:30 pm - 6:30 pm EST',
      location: 'Toronto',
      imageSource: EventsImage,
    },
    {
      id: 3,
      name: 'Easter sunday Thanksgiving',
      date: new Date(2024, 5, 23),
      hour: '5:30 pm - 6:30 pm EST',
      location: 'Toronto',
      imageSource: EventsImage,
    },
    {
      id: 4,
      name: 'Easter sunday Thanksgiving',
      date: new Date(2024, 5, 23),
      hour: '5:30 pm - 6:30 pm EST',
      location: 'Toronto',
      imageSource: EventsImage,
    },
    {
      id: 5,
      name: 'Easter sunday Thanksgiving',
      date: new Date(2024, 5, 23),
      hour: '5:30 pm - 6:30 pm EST',
      location: 'Toronto',
      imageSource: EventsImage,
    },
  ]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible);
  };

  const handleOptionSelect = (option: types) => {
    setSelectedOption(option);
    if (option === 'Filter') {
      navigation.navigate('FilterGoScreen');
    }
  };

  const renderEventsItem = ({ item }: { item: Events }) => (
    <TouchableOpacity onPress={() => navigation.navigate('EventDetails', { event: item })}>
      <View style={styles.organizationContainer}>
        <View style={styles.cardHeader}>
          <Image source={item.imageSource} style={styles.organizationImage} />
        </View>
        <View style={styles.organizationInfo}>
          <Text style={styles.organizationName}>{item.name}</Text>
          <View style={styles.organizationTypeContainer}>
            <FontAwesomeIcon icon={faCalendar} size={16} style={styles.typeIcon} />
            <Text style={styles.organizationType}>{item.date.toLocaleDateString()}</Text>
          </View>
          <View style={styles.organizationTypeContainer}>
            <FontAwesomeIcon icon={faClock} size={16} style={styles.typeIcon} />
            <Text style={styles.organizationType}>{item.hour}</Text>
          </View>
          <View style={styles.organizationTypeContainer}>
            <FontAwesomeIcon icon={faMapMarker} size={16} style={styles.typeIcon} />
            <Text style={styles.organizationType}>{item.location}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
            style={[styles.option, selectedOption === 'Saved' && styles.selectedOption]}
            onPress={() => setSelectedOption('Saved')}
          >
            <Text>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, selectedOption === 'My Events' && styles.selectedOption]}
            onPress={() => setSelectedOption('My Events')}
          >
            <Text>My Events</Text>
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
            data={events}
            renderItem={renderEventsItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.flatListContainer}
          />
        )}
      </View>
    </ScrollView>
  );
}

export default Go;
