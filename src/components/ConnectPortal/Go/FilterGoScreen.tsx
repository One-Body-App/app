import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMapMarkerAlt, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import Slider from '@react-native-community/slider';
import { localstyle } from '@/components/ConnectPortal/Serve/stylesFilterServe';

const FilterGoScreen = () => {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [distance, setDistance] = useState(10);
  const [organizationType, setOrganizationType] = useState('All');
  const [denomination, setDenomination] = useState('');
  const [location, setLocation] = useState('');

  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible);
  };

  const clearAllFilters = () => {
    setLocation;
    setDistance(10);
    setOrganizationType('All');
    setDenomination('');
  };

  const handleMapIconClick = () => {
    console.log('Abrir mapa para seleccionar ubicación');
  };

  const handleDatePosted = (type) => {
    setOrganizationType(type);
  };

  const handleStatus = (type) => {
    setOrganizationType(type);
  };

  return (
    <View>
      <View style={localstyle.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={clearAllFilters}>
          <Text style={localstyle.clearAllText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
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

            <View>
              <Text style={localstyle.label}>Date posted</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={localstyle.buttonContainer}
              >
                <View style={localstyle.dateOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'All' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('All')}
                  >
                    <Text style={localstyle.buttonText}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Today' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Today')}
                  >
                    <Text style={localstyle.buttonText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Last week' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Last week')}
                  >
                    <Text style={localstyle.buttonText}>Last week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Last mont' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Last mont')}
                  >
                    <Text style={localstyle.buttonText}>Last mont</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Last 6 months' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Last 6 months')}
                  >
                    <Text style={localstyle.buttonText}>Last 6 months</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Last 1 year' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Last 1 year')}
                  >
                    <Text style={localstyle.buttonText}>Last 1 year</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <Text style={localstyle.label}>Status</Text>
              <View style={localstyle.dateOptionsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={localstyle.buttonContainer}
                >
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'All' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleStatus('All')}
                  >
                    <Text style={localstyle.buttonText}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Open' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Open')}
                  >
                    <Text style={localstyle.buttonText}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Pre-registration' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleStatus('Pre-registration')}
                  >
                    <Text style={localstyle.buttonText}>Pre-registration</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Sold out' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleStatus('Sold out')}
                  >
                    <Text style={localstyle.buttonText}>Sold out</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Last 6 months' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Last 6 months')}
                  >
                    <Text style={localstyle.buttonText}>Last 6 months</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Last 1 year' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Last 1 year')}
                  >
                    <Text style={localstyle.buttonText}>Last 1 year</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
              <Text style={localstyle.label}>Event type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={localstyle.buttonContainer}
              >
                <View style={localstyle.dateOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'All' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleStatus('All')}
                  >
                    <Text style={localstyle.buttonText}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Conference' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleDatePosted('Conference')}
                  >
                    <Text style={localstyle.buttonText}>Conference</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Trade show' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleStatus('Trade show')}
                  >
                    <Text style={localstyle.buttonText}>Trade show</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Networking' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleStatus('Networking')}
                  >
                    <Text style={localstyle.buttonText}>Networking</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      localstyle.button,
                      localstyle.dateOptionButton,
                      organizationType === 'Workshop' && { backgroundColor: '#12D2D9' },
                    ]}
                    onPress={() => handleStatus('Workshop')}
                  >
                    <Text style={localstyle.buttonText}>Workshop</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
      </ScrollView>
    </View>
  );
};

export default FilterGoScreen;
