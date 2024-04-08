import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ImageSourcePropType,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faMapMarker, faChurch } from '@fortawesome/free-solid-svg-icons';
import { GlobalSearch } from 'iconsax-react-native';
import { useNavigation } from '@react-navigation/native';
import StyledText from '../../styled/Text';
import churchImage from '../../../assets/images/church.jpeg';
import { styles } from '../connectPortalStyles';

type connectPortalHomeTypes = 'People/Places' | 'Go!' | 'Serve';

interface OptionButtonProps {
  label: string;
  option: connectPortalHomeTypes;
  selectedOption: connectPortalHomeTypes;
  onPress: (option: connectPortalHomeTypes) => void;
}

interface Organization {
  id: number;
  name: string;
  type: string;
  location: string;
  imageSource: ImageSourcePropType;
}

function HomeScreenPlace() {
  const [organizations, setOrganizations] = useState<Organization[]>([
    {
      id: 1,
      name: 'Lakewood church',
      type: 'Church',
      location: 'Toronto',
      imageSource: churchImage,
    },
    {
      id: 2,
      name: 'Lakewood church',
      type: 'Church',
      location: 'Toronto',
      imageSource: churchImage,
    },
    {
      id: 3,
      name: 'Lakewood church',
      type: 'Church',
      location: 'Toronto',
      imageSource: churchImage,
    },
    {
      id: 4,
      name: 'Lakewood church',
      type: 'Church',
      location: 'Toronto',
      imageSource: churchImage,
    },
    {
      id: 5,
      name: 'Lakewood church',
      type: 'Church',
      location: 'Toronto',
      imageSource: churchImage,
    },
  ]);
  const [selectedOption, setSelectedOption] = useState<connectPortalHomeTypes>('People/Places');

  const navigation = useNavigation();
  const handleOptionSelect = (option: connectPortalHomeTypes) => {
    setSelectedOption(option);
    if (option === 'People/Places') {
      navigation.navigate('People');
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
            <TouchableOpacity
              style={styles.arrowIconContainer}
              onPress={() => handleOptionSelect('People/Places')}
            >
              <FontAwesomeIcon icon={faArrowRight} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ ...styles.iconsContainer, width: 40, height: 40 }}>
            <GlobalSearch size={40} color="#126B87" />
          </View>
          <StyledText style={[styles.title, { textAlign: 'center', color: '#000' }]}>
            Find Organizations Near You
          </StyledText>
          <StyledText
            style={[styles.contenCard, { textAlign: 'center', color: '#000' }]}
            numberOfLines={2}
          >
            Find local Church’s, Non-Profits and more near you!
          </StyledText>
          <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <GlobalSearch size={80} color="#999" />
          </View>
        </View>

        <View style={styles.headerLineContainer}>
          <View style={styles.line} />
          <StyledText style={styles.headerLine}>Recommended Places</StyledText>
          <View style={styles.line} />
        </View>

        <View style={styles.organizationListContainer}>
          <FlatList
            data={organizations}
            renderItem={({ item }) => (
              <View style={styles.organizationCard}>
                <View style={styles.cardHeader}>
                  <Image source={item.imageSource} style={styles.organizationImage} />
                </View>
                <View style={styles.organizationInfo}>
                  <Text style={styles.organizationName}>{item.name}</Text>
                  <View style={styles.organizationTypeContainer}>
                    <FontAwesomeIcon icon={faChurch} size={16} style={styles.typeIcon} />
                    <Text style={styles.organizationType}>{item.type}</Text>
                  </View>
                  <View style={styles.organizationLocationContainer}>
                    <FontAwesomeIcon icon={faMapMarker} size={16} style={styles.locationIcon} />
                    <Text style={styles.organizationLocation}>{item.location}</Text>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>

        <TouchableOpacity style={styles.seeMoreButton}>
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

export default HomeScreenPlace;
