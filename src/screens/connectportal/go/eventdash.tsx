import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';

export default function EventDashboardScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Text style={styles.headerIcon}>📅</Text>
            </View>
            <Text style={styles.headerTitle}>Event Management</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellButton}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarContainer}>
              <Text style={styles.avatarIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>SALES</Text>
              <Text style={styles.statValue}>$12.4k</Text>
              <View style={styles.trendContainer}>
                <Text style={styles.trendUpIcon}>↗</Text>
                <Text style={styles.trendUpText}>12%</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TICKETS</Text>
              <Text style={styles.statValue}>856</Text>
              <View style={styles.trendContainer}>
                <Text style={styles.trendUpIcon}>↗</Text>
                <Text style={styles.trendUpText}>8%</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>VIEWS</Text>
              <Text style={styles.statValue}>3.2k</Text>
              <View style={styles.trendContainer}>
                <Text style={styles.trendFlatIcon}>—</Text>
                <Text style={styles.trendFlatText}>0%</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScroll}
            >
              <TouchableOpacity style={styles.actionButtonPrimary}>
                <Text style={styles.actionButtonPrimaryIcon}>⊕</Text>
                <Text style={styles.actionButtonPrimaryText}>New Event</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonSecondary}>
                <Text style={styles.actionButtonSecondaryIcon}>📊</Text>
                <Text style={styles.actionButtonSecondaryText}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonSecondary}>
                <Text style={styles.actionButtonSecondaryIcon}>⛶</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Active Events */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Events</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            {/* Event Card 1 */}
            <View style={styles.eventCard}>
              <View style={styles.eventCardHeader}>
                <View style={[styles.eventImagePlaceholder, { backgroundColor: '#126b87' }]}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>Image</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>Summer Go! Festival</Text>
                  <Text style={styles.eventDateTime}>Aug 24, 2024 • 6:00 PM</Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.badgeLight}>
                      <Text style={styles.badgeLightText}>ACTIVE</Text>
                    </View>
                    <View style={styles.badgeLight}>
                      <Text style={styles.badgeLightText}>OUTDOOR</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>85% Capacity reached</Text>
                  <Text style={styles.progressValues}>425 / 500</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[styles.progressBarFill, { width: '85%', backgroundColor: '#126b87' }]}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.manageButton}>
                <Text style={styles.manageButtonText}>Manage Event</Text>
              </TouchableOpacity>
            </View>

            {/* Event Card 2 */}
            <View style={styles.eventCard}>
              <View style={styles.eventCardHeader}>
                <View style={[styles.eventImagePlaceholder, { backgroundColor: '#a0c4cf' }]}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>Image</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>Leadership Workshop</Text>
                  <Text style={styles.eventDateTime}>Sept 12, 2024 • 10:00 AM</Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.badgeLight}>
                      <Text style={styles.badgeLightText}>PLANNING</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>40% Tickets Sold</Text>
                  <Text style={styles.progressValues}>20 / 50</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[styles.progressBarFill, { width: '40%', backgroundColor: '#12d2d9' }]}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.manageButton}>
                <Text style={styles.manageButtonText}>Manage Event</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Performance (Mock Chart) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Performance</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartBarsContainer}>
                {/* Mon */}
                <View style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: '35%', backgroundColor: isDarkMode ? '#1e4b59' : '#e6f0f2' },
                    ]}
                  />
                  <Text style={styles.chartDayText}>Mon</Text>
                </View>
                {/* Tue */}
                <View style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: '50%', backgroundColor: isDarkMode ? '#1e4b59' : '#e6f0f2' },
                    ]}
                  />
                  <Text style={styles.chartDayText}>Tue</Text>
                </View>
                {/* Wed */}
                <View style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: '60%', backgroundColor: isDarkMode ? '#1e4b59' : '#e6f0f2' },
                    ]}
                  />
                  <Text style={styles.chartDayText}>Wed</Text>
                </View>
                {/* Thu */}
                <View style={styles.chartColumn}>
                  <View style={[styles.chartBar, { height: '100%', backgroundColor: '#126b87' }]} />
                  <Text style={[styles.chartDayText, styles.chartDayTextActive]}>Thu</Text>
                </View>
                {/* Fri */}
                <View style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: '40%', backgroundColor: isDarkMode ? '#1e4b59' : '#e6f0f2' },
                    ]}
                  />
                  <Text style={styles.chartDayText}>Fri</Text>
                </View>
                {/* Sat */}
                <View style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: '20%', backgroundColor: isDarkMode ? '#1e4b59' : '#e6f0f2' },
                    ]}
                  />
                  <Text style={styles.chartDayText}>Sat</Text>
                </View>
                {/* Sun */}
                <View style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: '15%', backgroundColor: isDarkMode ? '#1e4b59' : '#e6f0f2' },
                    ]}
                  />
                  <Text style={styles.chartDayText}>Sun</Text>
                </View>
              </View>
              <View style={styles.chartFooter}>
                <Text style={styles.chartFooterText}>
                  Highest: <Text style={styles.chartFooterTextBold}>Thursday (124 tickets)</Text>
                </Text>
                <Text style={styles.chartFooterIcon}>•••</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>👥</Text>
            <Text style={styles.navText}>Connect</Text>
          </TouchableOpacity>

          <View style={styles.fabContainer}>
            <TouchableOpacity style={styles.fabButton}>
              <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📊</Text>
            <Text style={styles.navText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navIcon, styles.navIconActive]}>🗂️</Text>
            <Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text>
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
      backgroundColor: isDarkMode ? '#111d21' : '#f8f9fa',
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
      backgroundColor: isDarkMode ? '#111d21' : '#f8f9fa',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIconContainer: {
      backgroundColor: '#126b87',
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerIcon: {
      color: '#ffffff',
      fontSize: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bellButton: {
      marginRight: 16,
    },
    bellIcon: {
      fontSize: 20,
      color: '#126b87',
    },
    avatarContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? '#1e333a' : '#e6eaec',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDarkMode ? '#355963' : '#cdd5d8',
    },
    avatarIcon: {
      fontSize: 16,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 100, // Make room for bottom nav
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      marginTop: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 8,
      alignItems: 'center',
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#126b87',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 4,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trendUpIcon: {
      color: '#0e8a3a',
      fontSize: 12,
      marginRight: 2,
    },
    trendUpText: {
      color: '#0e8a3a',
      fontSize: 11,
      fontWeight: '700',
    },
    trendFlatIcon: {
      color: '#68828a',
      fontSize: 12,
      marginRight: 2,
    },
    trendFlatText: {
      color: '#68828a',
      fontSize: 11,
      fontWeight: '700',
    },
    sectionContainer: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: '#126b87',
      letterSpacing: 1,
      marginBottom: 12,
    },
    quickActionsScroll: {
      paddingBottom: 4,
    },
    actionButtonPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#126b87',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginRight: 12,
    },
    actionButtonPrimaryIcon: {
      color: '#ffffff',
      fontSize: 16,
      marginRight: 8,
      fontWeight: 'bold',
    },
    actionButtonPrimaryText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    actionButtonSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginRight: 12,
    },
    actionButtonSecondaryIcon: {
      color: '#032f3c',
      fontSize: 16,
      marginRight: 8,
    },
    actionButtonSecondaryText: {
      color: isDarkMode ? '#ffffff' : '#032f3c',
      fontSize: 14,
      fontWeight: '700',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#126b87',
    },
    eventCard: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
    },
    eventCardHeader: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    eventImagePlaceholder: {
      width: 64,
      height: 64,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    eventInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 4,
    },
    eventDateTime: {
      fontSize: 13,
      color: '#126b87',
      marginBottom: 8,
    },
    badgesRow: {
      flexDirection: 'row',
    },
    badgeLight: {
      backgroundColor: isDarkMode ? 'rgba(18, 210, 217, 0.15)' : '#eef6f8',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginRight: 8,
    },
    badgeLightText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#126b87',
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#126b87',
    },
    progressValues: {
      fontSize: 12,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    progressBarBg: {
      height: 6,
      backgroundColor: isDarkMode ? '#111d21' : '#e6eaec',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    manageButton: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    manageButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#126b87',
    },
    chartCard: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
    },
    chartBarsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 120,
      marginBottom: 16,
    },
    chartColumn: {
      alignItems: 'center',
      flex: 1,
      height: '100%',
      justifyContent: 'flex-end',
    },
    chartBar: {
      width: 24,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      marginBottom: 8,
    },
    chartDayText: {
      fontSize: 11,
      color: '#68828a',
      fontWeight: '600',
    },
    chartDayTextActive: {
      color: '#126b87',
      fontWeight: '800',
    },
    chartFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#355963' : '#e6eaec',
      paddingTop: 16,
    },
    chartFooterText: {
      fontSize: 12,
      color: '#126b87',
    },
    chartFooterTextBold: {
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    chartFooterIcon: {
      color: '#126b87',
      fontSize: 16,
      fontWeight: 'bold',
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
      fontSize: 20,
      color: '#9aacb1',
      marginBottom: 4,
    },
    navIconActive: {
      color: '#126b87',
    },
    navText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#9aacb1',
    },
    navTextActive: {
      color: '#126b87',
      fontWeight: '800',
    },
    fabContainer: {
      position: 'relative',
      top: -20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#126b87',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: isDarkMode ? '#111d21' : '#ffffff',
      shadowColor: '#126b87',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    fabIcon: {
      fontSize: 24,
      color: '#ffffff',
      fontWeight: '400',
    },
  });
