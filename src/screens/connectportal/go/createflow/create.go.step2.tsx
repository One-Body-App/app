import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function DateLocationScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIconButton}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Date & Location</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section */}
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>Step 2 of 7</Text>
            <Text style={styles.percentageText}>28%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          {/* Section: When is the event? */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📅</Text>
            <Text style={styles.sectionTitle}>When is the event?</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity style={styles.dateInputBox}>
                <Text style={styles.inputValue}>10/25/2023</Text>
                <Text style={styles.inputIcon}>📅</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity style={styles.dateInputBox}>
                <Text style={styles.inputValue}>10/25/2023</Text>
                <Text style={styles.inputIcon}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Start Time</Text>
              <TouchableOpacity style={styles.dateInputBox}>
                <Text style={styles.inputValue}>09:00 AM</Text>
                <Text style={styles.inputIcon}>🕒</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>End Time</Text>
              <TouchableOpacity style={styles.dateInputBox}>
                <Text style={styles.inputValue}>05:00 PM</Text>
                <Text style={styles.inputIcon}>🕒</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Section: Where is it? */}
          <View style={styles.sectionHeaderSpaceBetween}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>📍</Text>
              <Text style={styles.sectionTitle}>Where is it?</Text>
            </View>
            <View style={styles.toggleContainer}>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: '#e6eaec', true: '#126b87' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#e6eaec"
              />
              <Text style={styles.toggleLabel}>Online Event</Text>
            </View>
          </View>

          {/* Location Search */}
          {!isOnline && (
            <>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search address or venue name"
                  placeholderTextColor="#68828a"
                />
              </View>

              {/* Map Preview Placeholder */}
              <View style={styles.mapContainer}>
                {/* Replace with actual react-native-maps component or static image */}
                <View style={styles.mapPlaceholderBg}>
                  <View style={styles.mapOverlayTextBox}>
                    <Text style={styles.mapOverlayText}>123 Main St, San Francisco, CA</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Fixed Bottom Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light background matching screenshot
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  backIconButton: {
    padding: 8,
    marginLeft: -8,
  },
  iconText: {
    fontSize: 24,
    color: '#126b87',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#032f3c',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for the absolute footer
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
    marginTop: 8,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#032f3c',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#126b87', // Primary dark
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#cdd5d8', // Muted blue-gray track
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    width: '28%',
    height: '100%',
    backgroundColor: '#126b87', // Primary dark
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#032f3c',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#032f3c',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainerHalf: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#355963',
    marginBottom: 8,
  },
  dateInputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6eaec',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputValue: {
    fontSize: 14,
    color: '#032f3c',
  },
  inputIcon: {
    fontSize: 16,
    color: '#032f3c',
  },
  divider: {
    height: 1,
    backgroundColor: '#e6eaec',
    marginVertical: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#355963',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6eaec',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#68828a',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#032f3c',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e6eaec',
    backgroundColor: '#a0c4cf', // Placeholder map color
  },
  mapPlaceholderBg: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  mapOverlayTextBox: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapOverlayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#032f3c',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6eaec',
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cdd5d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  backButtonText: {
    color: '#126b87',
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#126b87',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
