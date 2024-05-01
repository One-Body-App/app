import React, { useState } from 'react';
import { TouchableOpacity, Text, View, ScrollView, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowRight,
  faCalendarAlt,
  faTag,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import { Strongbox } from 'iconsax-react-native';
import StyledText from '../../styled/Text';
import { styles } from '../connectPortalStyles';
import { spacing } from '@/src/styles/spacing';

type homeServeTypes = 'People/Places' | 'Go!' | 'Serve';

interface OptionButtonProps {
  label: string;
  option: homeServeTypes;
  selectedOption: homeServeTypes;
  onPress: (option: homeServeTypes) => void;
}

interface Opportunity {
  id: number;
  name: string;
  date: string;
  eventType: string;
  location: string;
}

function HomeServeScreen() {
  const [opportunity, setOpportunity] = useState<Opportunity[]>([
    {
      id: 1,
      name: 'Hiring a Full Time Accountant for Med size Church',
      date: 'Closes: July 15, 2028',
      eventType: 'Accounting',
      location: 'Atlanta, GA',
    },
    {
      id: 2,
      name: 'Drummer needed for 4 services per week',
      date: 'Closes: June 29, 2028',
      eventType: 'Musicians',
      location: 'Decatur, GA',
    },
    {
      id: 3,
      name: 'Web Developer needed for Church website',
      date: 'Closes: August 30, 2028',
      eventType: 'Technology',
      location: 'Clarkston, GA',
    },
    {
      id: 4,
      name: 'After School Lead needed for fast growing Daycare',
      date: 'Closes: June 15, 2028',
      eventType: 'Childcare',
      location: 'Dublin, GA',
    },
  ]);

  const [selectedOption, setSelectedOption] = useState<homeServeTypes>('Serve');

  const navigation = useNavigation();
  const handleOptionSelect = (option: homeServeTypes) => {
    setSelectedOption(option);
    if (option === 'Serve') {
      navigation.navigate('Serve');
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
            <Strongbox size={40} color="#126B87" />
          </View>
          <StyledText style={[styles.title, { textAlign: 'center', color: '#000' }]}>
            Find Job Opportunities
          </StyledText>
          <StyledText
            style={[styles.contenCard, { textAlign: 'center', color: '#000' }]}
            numberOfLines={2}
          >
            Discover and post jobs/ opportunities.
          </StyledText>
          <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <Strongbox size={70} color="#999" />
          </View>
        </View>

        <View style={styles.headerLineContainer}>
          <View style={styles.line} />
          <StyledText style={styles.headerLine}>Recommended Opportunities</StyledText>
          <View style={styles.line} />
        </View>

        <View style={styles.organizationContainer}>
          <FlatList
            data={opportunity}
            renderItem={({ item }) => (
              <View style={localstyle.cardContainer}>
                <View style={localstyle.card}>
                  <StyledText style={localstyle.cardTitle}>{item.name}</StyledText>
                  <View style={localstyle.cardInfo}>
                    <FontAwesomeIcon icon={faCalendarAlt} size={20} color="black" />
                    <StyledText>{item.date}</StyledText>
                  </View>
                  <View style={localstyle.cardInfo}>
                    <FontAwesomeIcon icon={faTag} size={20} color="black" />
                    <StyledText>{item.eventType}</StyledText>
                  </View>
                  <View style={localstyle.cardInfo}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} size={20} color="black" />
                    <StyledText>{item.location}</StyledText>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
        <TouchableOpacity
          style={localstyle.seeMoreButton}
          onPress={() => handleOptionSelect('Serve')}
        >
          <StyledText style={localstyle.seeMoreText}>See More</StyledText>
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

const localstyle = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: spacing.x20,
    marginBottom: spacing.x20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.x10,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.x10,
  },
  cardContainer: {
    backgroundColor: '#F2F3F3',
    borderRadius: 10,
    padding: spacing.x10,
    marginBottom: spacing.x16,
  },
  seeMoreButton: {
    backgroundColor: '#f2f3f3',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 70,
  },
  seeMoreText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeServeScreen;
