import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';

export default function MyEventsScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Active', 'Draft', 'Past'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>📅</Text>
            <Text style={styles.headerTitle}>My Events</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search your events..."
              placeholderTextColor={isDarkMode ? '#68828a' : '#9aacb1'}
            />
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, activeTab === tab && styles.filterPillActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.filterText, activeTab === tab && styles.filterTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Active Event */}
          <View style={styles.eventCard}>
            <View style={styles.imageContainer}>
              {/* Placeholder for Event Image */}
              <View style={[styles.imagePlaceholder, { backgroundColor: '#126b87' }]} />
              <View style={[styles.badge, styles.badgeActive]}>
                <Text style={styles.badgeText}>ACTIVE</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.eventTitle}>Global AI Summit 2024</Text>
              <Text style={styles.eventDate}>📅 Nov 12, 2024 • 09:00 AM</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton, { flex: 1 }]}>
                  <Text style={styles.primaryButtonText}>⚙️ Manage</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, { flex: 1 }]}
                >
                  <Text style={styles.secondaryButtonText}>📊 Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, { width: 44 }]}
                >
                  <Text style={styles.secondaryButtonText}>✏️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Card 2: Draft Event */}
          <View style={styles.eventCard}>
            <View style={styles.imageContainer}>
              <View style={[styles.imagePlaceholder, { backgroundColor: '#d9a05b' }]} />
              <View style={[styles.badge, styles.badgeDraft]}>
                <Text style={styles.badgeText}>DRAFT</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.eventTitle}>Summer Beats Festival</Text>
              <Text style={styles.eventDate}>📅 Jul 22, 2025 • TBD</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton, { flex: 1 }]}>
                  <Text style={styles.primaryButtonText}>⇪ Publish</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, { flex: 1 }]}
                >
                  <Text style={styles.secondaryButtonText}>✏️ Edit Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.dangerButton, { width: 44 }]}>
                  <Text style={styles.dangerButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Card 3: Past Event */}
          <View style={[styles.eventCard, isDarkMode ? { opacity: 0.7 } : { opacity: 0.8 }]}>
            <View style={styles.imageContainer}>
              <View style={[styles.imagePlaceholder, { backgroundColor: '#81979e' }]} />
              <View style={[styles.badge, styles.badgePast]}>
                <Text style={styles.badgeText}>PAST</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.eventTitle}>Design Thinking Workshop</Text>
              <Text style={styles.eventDate}>📅 Ended Sep 15, 2024</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, { flex: 1 }]}
                >
                  <Text style={styles.secondaryButtonText}>📊 Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, { flex: 1 }]}
                >
                  <Text style={styles.secondaryButtonText}>🔄 Duplicate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navIcon, styles.navIconActive]}>📅</Text>
            <Text style={[styles.navText, styles.navTextActive]}>MY EVENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📈</Text>
            <Text style={styles.navText}>STATS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navText}>PROFILE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111d21' : '#f7f7f7',
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
      backgroundColor: isDarkMode ? '#111d21' : '#f7f7f7',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      fontSize: 24,
      color: '#126b87',
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#126b87',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#126b87',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: 24,
      fontWeight: '400',
      marginTop: -2,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
    },
    searchIcon: {
      fontSize: 16,
      color: '#68828a',
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    filterContainer: {
      paddingBottom: 16,
    },
    filterScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterPill: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#1e333a' : '#eef6f8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterPillActive: {
      backgroundColor: '#126b87',
    },
    filterText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#9aacb1' : '#126b87',
    },
    filterTextActive: {
      color: '#ffffff',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    eventCard: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      marginBottom: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    imageContainer: {
      height: 140,
      width: '100%',
      position: 'relative',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
    },
    badge: {
      position: 'absolute',
      top: 12,
      right: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    badgeActive: {
      backgroundColor: '#10b981', // Green
    },
    badgeDraft: {
      backgroundColor: '#f59e0b', // Orange
    },
    badgePast: {
      backgroundColor: '#68828a', // Gray
    },
    badgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    cardContent: {
      padding: 16,
    },
    eventTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 4,
    },
    eventDate: {
      fontSize: 13,
      color: isDarkMode ? '#9aacb1' : '#68828a',
      marginBottom: 16,
      fontWeight: '500',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    primaryButton: {
      backgroundColor: '#126b87',
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.15)' : '#eef6f8',
    },
    secondaryButtonText: {
      color: '#126b87',
      fontSize: 13,
      fontWeight: '700',
    },
    dangerButton: {
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
    },
    dangerButtonText: {
      color: '#ef4444',
      fontSize: 14,
    },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      backgroundColor: isDarkMode ? '#111d21' : '#ffffff',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#1e333a' : '#e6eaec',
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    navIcon: {
      fontSize: 22,
      color: '#9aacb1',
      marginBottom: 4,
    },
    navIconActive: {
      color: '#126b87',
    },
    navText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#9aacb1',
      letterSpacing: 0.5,
    },
    navTextActive: {
      color: '#126b87',
      fontWeight: '800',
    },
  });
