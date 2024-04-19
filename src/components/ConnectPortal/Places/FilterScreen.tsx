import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faMapMarkerAlt, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import Slider from '@react-native-community/slider';
import { spacing } from '@/src/styles/spacing';

const FilterScreen = () => {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [distance, setDistance] = useState(10);
  const [organizationType, setOrganizationType] = useState('All');
  const [denomination, setDenomination] = useState('');

  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible);
  };

  const clearAllFilters = () => {
    setDistance(10);
    setOrganizationType('All');
    setDenomination('');
  };

  const [location, setLocation] = useState('');

  const handleMapIconClick = () => {
    console.log('Abrir mapa para seleccionar ubicación');
  };

  const handleOrganizationTypeChange = (type) => {
    setOrganizationType(type);
  };

  return (
    <View>
      <View style={localstyle.header}>
        <TouchableOpacity onPress={toggleFilterModal}>
          <FontAwesomeIcon icon={faTimes} size={24} color="black" />
        </TouchableOpacity>
        <Text style={localstyle.headerTitle}>Filter</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={clearAllFilters}>
          <Text style={localstyle.clearAllText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <View style={localstyle.content}>
        <Text style={localstyle.label}>Location</Text>

        <View style={localstyle.inputContainer}>
          <TextInput
            style={localstyle.input}
            placeholder="Select"
            value={location}
            onChangeText={setLocation}
          />
          <TouchableOpacity onPress={handleMapIconClick} style={localstyle.mapIcon}>
            <FontAwesomeIcon icon={faMapMarkerAlt} size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={localstyle.content}>
          <View style={localstyle.labelContainer}>
            <Text style={localstyle.label}>Distance (Mi)</Text>
            <Text style={localstyle.rangeText}>0-50</Text>
          </View>
          <View style={localstyle.sliderContainer}>
            <View>
              <Slider
                style={localstyle.slider}
                minimumValue={0}
                maximumValue={50}
                step={1}
                value={distance}
                minimumTrackTintColor="#12D2D9"
                maximumTrackTintColor="gray"
                thumbTintColor="#12D2D9"
                onValueChange={(value) => setDistance(value)}
              />
            </View>
          </View>
          <View style={localstyle.orgTypeContainer}>
            <Text style={localstyle.label}>Organization type</Text>
            <View style={localstyle.buttonContainer}>
              <TouchableOpacity
                style={[
                  localstyle.button,
                  organizationType === 'All' && { backgroundColor: '#12D2D9' },
                ]}
                onPress={() => handleOrganizationTypeChange('All')}
              >
                <Text style={localstyle.buttonText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localstyle.button,
                  organizationType === 'Church' && { backgroundColor: '#12D2D9' },
                ]}
                onPress={() => handleOrganizationTypeChange('Church')}
              >
                <Text style={localstyle.buttonText}>Church</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localstyle.button,
                  organizationType === 'Non-profit' && { backgroundColor: '#12D2D9' },
                ]}
                onPress={() => handleOrganizationTypeChange('Non-profit')}
              >
                <Text style={localstyle.buttonText}>Non-profit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localstyle.button,
                  organizationType === 'House' && { backgroundColor: '#12D2D9' },
                ]}
                onPress={() => handleOrganizationTypeChange('House')}
              >
                <Text style={localstyle.buttonText}>House</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={localstyle.label}>Denomination</Text>

        <View style={localstyle.inputContainer}>
          <TextInput
            style={localstyle.input}
            placeholder="Select"
            value={denomination}
            onChangeText={setDenomination}
          />
          <TouchableOpacity
            onPress={() => console.log('Abrir lista de elementos')}
            style={localstyle.arrowIcon}
          >
            <FontAwesomeIcon icon={faAngleDown} size={24} color="black" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={localstyle.applyFilterButton}>
          <Text style={localstyle.applyFilterText}>Apply Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localstyle = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginHorizontal: spacing.x20,
  },
  iconContainer: {
    marginRight: 'auto',
    paddingRight: spacing.x16,
  },
  clearAllText: {
    fontSize: 24,
    color: '#126B87',
    marginEnd: spacing.x10,
  },
  content: {
    paddingHorizontal: spacing.x16,
    paddingTop: spacing.x20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.x20,
  },
  label: {
    fontSize: 18,
    paddingHorizontal: spacing.x5,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F2F3F3',
    paddingHorizontal: spacing.x10,
    borderRadius: 5,
    marginTop: spacing.x10,
  },
  mapIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.x8,
    marginTop: spacing.x5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'gray',
  },
  sliderContainer: {
    marginBottom: spacing.x20,
    backgroundColor: '#F2F3F3',
    paddingVertical: spacing.x10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: spacing.x10,
  },
  slider: {
    width: '100%',
  },
  rangeText: {
    fontSize: spacing.x16,
    marginLeft: spacing.x10,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgTypeContainer: {
    marginBottom: spacing.x20,
    paddingHorizontal: spacing.x16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.x17,
  },
  button: {
    backgroundColor: '#F3F2F2',
    paddingHorizontal: spacing.x20,
    paddingVertical: spacing.x10,
    borderRadius: spacing.x20,
  },
  buttonText: {
    fontSize: 16,
    color: 'black',
  },
  arrowIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.x8,
    marginTop: spacing.x5,
  },
  applyFilterButton: {
    backgroundColor: '#126B87',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 370,
  },
  applyFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default FilterScreen;
