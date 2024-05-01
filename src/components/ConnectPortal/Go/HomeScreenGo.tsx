import React, { useState } from 'react';
import {
  ImageSourcePropType,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faMapMarker, faCalendar, faClock } from '@fortawesome/free-solid-svg-icons';
import { CalendarSearch } from 'iconsax-react-native';
import { styles } from '../connectPortalStyles';
import EventsImage from '@/assets/images/Events.png';
import StyledText from '../../styled/Text';
import EventDetails from './EventDetails';

type homeGoTypes = 'People/Places' | 'Go!' | 'Serve';

interface OptionButtonProps {
  label: string;
  option: homeGoTypes;
  selectedOption: homeGoTypes;
  onPress: (option: homeGoTypes) => void;
}

interface Events {
  id: number;
  name: string;
  date: Date;
  hour: string;
  location: string;
  imageSource: ImageSourcePropType;
}

function HomeScreenGo() {
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
  const [selectedOption, setSelectedOption] = useState<homeGoTypes>('People/Places');

  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);
  const handleEventSelect = (event: Events) => {
    setSelectedEvent(event);
  };

  const navigation = useNavigation();
  const handleOptionSelect = (option: homeGoTypes) => {
    setSelectedOption(option);
    if (option === 'Go!') {
      navigation.navigate('Go');
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.optionContainer}>
          <OptionButton
            label="People/Places"
            option="People/Places"
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

        <View style={styles.cardContainer}>
          <View style={styles.arrowContainer}>
            <TouchableOpacity style={styles.arrowIconContainer}>
              <FontAwesomeIcon icon={faArrowRight} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ ...styles.iconsContainer, width: 40, height: 40 }}>
            <CalendarSearch size={40} color="#126B87" />
          </View>
          <StyledText style={[styles.title, { textAlign: 'center', color: '#000' }]}>
            Find Events
          </StyledText>
          <StyledText
            style={[styles.contenCard, { textAlign: 'center', color: '#000' }]}
            numberOfLines={2}
          >
            Explore local Christian events and go!
          </StyledText>
          <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <CalendarSearch size={80} color="#999" />
          </View>
        </View>

        <View style={styles.headerLineContainer}>
          <View style={styles.line} />
          <StyledText style={styles.headerLine}>Recommended Events</StyledText>
          <View style={styles.line} />
        </View>

        <View style={styles.organizationContainer}>
          <FlatList
            data={events}
            renderItem={({ item }) => (
              <View style={styles.organizationCard}>
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
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
        <TouchableOpacity style={styles.seeMoreButton} onPress={() => handleOptionSelect('Go!')}>
          <Text style={styles.seeMoreText}>See More</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
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

export default HomeScreenGo;
