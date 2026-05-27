import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Brand Colors
const COLORS = {
  white: '#FFFFFF',
  black: '#032f3c',
  gray100: '#e6eaec',
  gray200: '#cdd5d8',
  gray500: '#81979e',
  primaryDark: '#126b87',
  infoDark: '#12d2d9',
};

// Reusable Pill Component
function FilterPill({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.pill, isActive && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

// Reusable Dropdown Mock Component
function DropdownField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputBox}>
        <Text style={styles.inputText}>{placeholder}</Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>
    </View>
  );
}

export default function ServeFiltersScreen() {
  // State Management for active filters
  const [activeDate, setActiveDate] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [activeFocus, setActiveFocus] = useState('All'); // Enhancement

  const handleClearAll = () => {
    setActiveDate('All');
    setActiveStatus('All');
    setActiveType('All');
    setActiveFocus('All');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Filter</Text>
        <Pressable onPress={handleClearAll}>
          <Text style={styles.clearText}>Clear all</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.inputText}
              placeholder="Select location"
              placeholderTextColor={COLORS.gray500}
            />
            <Text style={styles.icon}>📍</Text>
          </View>
        </View>

        {/* Distance Slider Mock */}
        <View style={styles.inputGroup}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Distance (Mi)</Text>
            <Text style={styles.valueText}>0 - 50</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View style={styles.sliderFill} />
            <View style={styles.sliderThumb} />
          </View>
        </View>

        {/* Sector */}
        <DropdownField label="Sector" placeholder="Select sector" />

        {/* Date Posted */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date posted</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillContainer}
          >
            {['All', 'Today', 'Last week', 'Last month'].map((item) => (
              <FilterPill
                key={item}
                label={item}
                isActive={activeDate === item}
                onPress={() => setActiveDate(item)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pillContainer}>
            {['All', 'Open', 'Closed'].map((item) => (
              <FilterPill
                key={item}
                label={item}
                isActive={activeStatus === item}
                onPress={() => setActiveStatus(item)}
              />
            ))}
          </View>
        </View>

        {/* Opportunity Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Opportunity type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillContainer}
          >
            {['All', 'Full-time', 'Intern', 'Contract', 'Volunteer'].map((item) => (
              <FilterPill
                key={item}
                label={item}
                isActive={activeType === item}
                onPress={() => setActiveType(item)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ENHANCEMENT: Ministry Focus */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ministry Focus</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillContainer}
          >
            {['All', 'Youth', 'Worship', 'Outreach', 'Admin'].map((item) => (
              <FilterPill
                key={item}
                label={item}
                isActive={activeFocus === item}
                onPress={() => setActiveFocus(item)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Denomination & Salary */}
        <DropdownField label="Denomination" placeholder="Select denomination" />
        <DropdownField label="Salary range" placeholder="Select range" />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky Footer Button */}
      <View style={styles.footer}>
        <Pressable style={styles.applyButton}>
          <Text style={styles.applyButtonText}>Apply filter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.black,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  clearText: {
    fontSize: 16,
    color: COLORS.primaryDark,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  icon: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
    marginTop: 10,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    width: '30%',
    height: '100%',
    backgroundColor: COLORS.infoDark,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    left: '30%',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.infoDark,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    marginRight: 10, // Fallback for gap on older RN versions
  },
  pillActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primaryDark,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    color: COLORS.black,
  },
  pillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  applyButton: {
    backgroundColor: COLORS.primaryDark,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
