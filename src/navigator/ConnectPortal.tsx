import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

type string = 'Explore' | 'My Places';
function ConnectPortal() {
  const [selectedOption, setSelectedOption] = useState<string>('Explore');

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

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

      <View style={styles.searchBar}>
        <TextInput placeholder="Search..." style={styles.input} />
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView provider={PROVIDER_GOOGLE} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 5,
  },
  option: {
    flex: 1,
    alignItems: 'center',
  },
  selectedOption: {
    borderBottomWidth: 2,
    borderBottomColor: 'black',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  input: {
    fontSize: 16,
    paddingVertical: 10,
  },
  mapContainer: {
    flex: 1,
  },
});

export default ConnectPortal;
