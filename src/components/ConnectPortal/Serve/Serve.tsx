import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSlidersH,
  faCalendarAlt,
  faTag,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import { spacing } from '@/src/styles/spacing';
import { styles } from '../connectPortalStyles';

type types = 'Explore' | 'Saved' | 'Applied' | 'My jobs' | 'Filter';

function Card({
  title,
  date,
  eventType,
  location,
}: {
  title: string;
  date: string;
  eventType: string;
  location: string;
}) {
  return (
    <View style={localstyle.card}>
      <Text style={localstyle.cardTitle}>{title}</Text>
      <View style={localstyle.cardInfo}>
        <FontAwesomeIcon icon={faCalendarAlt} size={20} color="black" />
        <Text>{date}</Text>
      </View>
      <View style={localstyle.cardInfo}>
        <FontAwesomeIcon icon={faTag} size={20} color="black" />
        <Text>{eventType}</Text>
      </View>
      <View style={localstyle.cardInfo}>
        <FontAwesomeIcon icon={faMapMarkerAlt} size={20} color="black" />
        <Text>{location}</Text>
      </View>
    </View>
  );
}

function Serve() {
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState<types>('Explore');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleOptionSelect = (option: types) => {
    setSelectedOption(option);
    if (option === 'Filter') {
      navigation.navigate('FilterServeScreen');
    }
  };

  return (
    <ScrollView>
      <View style={{ flex: 1 }}>
        <View style={localstyle.optionContainer}>
          <TouchableOpacity
            style={[localstyle.option, selectedOption === 'Explore' && localstyle.selectedOption]}
            onPress={() => setSelectedOption('Explore')}
          >
            <Text>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localstyle.option, selectedOption === 'Saved' && localstyle.selectedOption]}
            onPress={() => setSelectedOption('Saved')}
          >
            <Text>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localstyle.option, selectedOption === 'Applied' && localstyle.selectedOption]}
            onPress={() => setSelectedOption('Applied')}
          >
            <Text>Applied</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localstyle.option, selectedOption === 'My jobs' && localstyle.selectedOption]}
            onPress={() => setSelectedOption('My jobs')}
          >
            <Text>My jobs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search"
            style={styles.input}
            onChangeText={(text) => setSearchQuery(text)}
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
        </View>

        <View style={localstyle.cardContainer}>
          <Card
            title="Hiring a Full Time Accountant for Med size Church"
            date="Closes: July 15, 2028"
            eventType="Accounting"
            location="Atlanta, GA"
          />
          <Card
            title="Drummer needed for 4 services per week"
            date="Closes: June 29, 2028"
            eventType="Musicians"
            location="Decatur, GA"
          />
          <Card
            title="Web Developer needed for Church website"
            date="Closes: August 30, 2028"
            eventType="Technology"
            location="Clarkston, GA"
          />
          <Card
            title="After School Lead needed for fast growing Daycare"
            date="Closes: June 15, 2028"
            eventType="Childcare"
            location="Dublin, GA"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const localstyle = StyleSheet.create({
  option: {
    flex: 1,
    alignItems: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    marginBottom: spacing.x20,
    backgroundColor: '#F2F3F3',
    paddingVertical: spacing.x20,
    borderRadius: spacing.x5,
    justifyContent: 'space-between',
  },
  selectedOption: {
    borderBottomWidth: 2,
    borderBottomColor: 'black',
  },
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
  },
});

export default Serve;
