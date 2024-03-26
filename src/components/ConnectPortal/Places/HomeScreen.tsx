import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faMapMarker } from '@fortawesome/free-solid-svg-icons';

interface Organization {
  id: number;
  name: string;
  type: string;
  location: string;
}

function HomeScreen() {
  const [organizations, setOrganizations] = useState<Organization[]>([
    {
      id: 1,
      name: 'Example Church',
      type: 'Church',
      location: 'Toronto',
    },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Recommended Places</Text>
        </View>
      </View>
      <FlatList
        data={organizations}
        renderItem={({ item }) => (
          <View style={styles.organizationCard}>
            <View style={styles.cardHeader}>
              <TouchableOpacity style={styles.leftIcon}>
                <FontAwesomeIcon icon={faArrowLeft} size={20} />
              </TouchableOpacity>
              <View style={styles.logoContainer} />
            </View>
            <Text style={styles.organizationName}>{item.name}</Text>
            <Text style={styles.organizationType}>{item.type}</Text>
            <View style={styles.organizationLocationContainer}>
              <FontAwesomeIcon icon={faMapMarker} size={16} style={styles.locationIcon} />
              <Text style={styles.organizationLocation}>{item.location}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      <TouchableOpacity style={styles.seeMoreButton}>
        <Text style={styles.seeMoreText}>See More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  organizationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftIcon: {
    marginRight: 'auto',
  },
  logoContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
  },
  logo: {
    width: 30,
    height: 30,
  },
  organizationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  organizationType: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
  },
  organizationLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 5,
    color: '#666666',
  },
  organizationLocation: {
    fontSize: 16,
    color: '#666666',
  },
  seeMoreButton: {
    backgroundColor: '#126B87',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  seeMoreText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
