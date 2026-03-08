import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  Image,
  Platform,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function EventAnalyticsScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  // Mock data for messages
  const messages = [
    {
      id: '1',
      name: 'Felix Carter',
      time: '10 min ago',
      avatar: 'https://i.pravatar.cc/150?u=felix',
      text: '"Is there dedicated parking available at the venue? I\'ll be driving from out of town."',
    },
    {
      id: '2',
      name: 'Sarah Jenkins',
      time: '2 hours ago',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      text: '"Will there be vegan options provided during the mixer? I want to make sure I don\'t need to bring my own lunch."',
    },
    {
      id: '3',
      name: 'Marcus Chen',
      time: '5 hours ago',
      avatar: 'https://i.pravatar.cc/150?u=marcus',
      text: '"Can I bring a +1 even if they haven\'t registered yet? We can pay at the door if needed."',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Summer Community{'\n'}Mixer</Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareIcon}>🔗</Text>
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Metrics */}
          <View style={styles.metricsContainer}>
            {/* Tickets Sold */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeaderRow}>
                <Text style={styles.metricLabel}>Total Tickets Sold</Text>
                <View style={styles.badgeGreen}>
                  <Text style={styles.badgeGreenText}>+12%</Text>
                </View>
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValueLarge}>145</Text>
                <Text style={styles.metricValueSmall}>/150</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[styles.progressBarFill, { width: '96%', backgroundColor: '#ec5b13' }]}
                />
              </View>
            </View>

            {/* Total Revenue */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeaderRow}>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <View style={styles.badgeGreen}>
                  <Text style={styles.badgeGreenText}>+5%</Text>
                </View>
              </View>
              <Text style={styles.metricValueLarge}>$1,450</Text>
              <Text style={styles.metricSubText}>Updated 5m ago</Text>
            </View>

            {/* Page Views */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeaderRow}>
                <Text style={styles.metricLabel}>Page Views</Text>
                <View style={styles.badgeGreen}>
                  <Text style={styles.badgeGreenText}>+18%</Text>
                </View>
              </View>
              <Text style={styles.metricValueLarge}>2.1k</Text>
              <Text style={styles.metricSubText}>Unique visitors</Text>
            </View>
          </View>

          {/* Chart Section */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.sectionTitle}>Ticket Sales Over{'\n'}Time</Text>
                <Text style={styles.chartSubtitle}>Sales performance for the{'\n'}last 7 days</Text>
              </View>
              <View style={styles.dropdownBox}>
                <Text style={styles.dropdownText}>Last 7 Days</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </View>
            </View>

            <View style={styles.chartContainer}>
              <Svg width="100%" height="100%" viewBox="0 0 478 150" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="150">
                    <Stop offset="0%" stopColor="#ec5b13" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#ec5b13" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                {/* Gradient Fill */}
                <Path
                  d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V150H0V109Z"
                  fill="url(#chart-grad)"
                />
                {/* Line Path */}
                <Path
                  d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
                  stroke="#ec5b13"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </View>
            <View style={styles.chartAxisLabels}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                <Text key={day} style={styles.axisLabel}>
                  {day}
                </Text>
              ))}
            </View>
          </View>

          {/* Attendee Support */}
          <View style={styles.supportSection}>
            <View style={styles.supportHeader}>
              <View style={styles.supportHeaderLeft}>
                <View style={styles.supportIconBox}>
                  <Text style={styles.supportIcon}>❓</Text>
                </View>
                <Text style={styles.sectionTitle}>Attendee{'\n'}Support</Text>
              </View>
              <View style={styles.badgeOrange}>
                <Text style={styles.badgeOrangeText}>3 NEW MESSAGES</Text>
              </View>
            </View>

            {messages.map((msg, index) => (
              <View
                key={msg.id}
                style={[
                  styles.messageItem,
                  index === messages.length - 1 && styles.messageItemLast,
                ]}
              >
                <Image source={{ uri: msg.avatar }} style={styles.avatar} />
                <View style={styles.messageContent}>
                  <View style={styles.messageRow}>
                    <Text style={styles.messageName}>{msg.name}</Text>
                    <Text style={styles.messageTime}>{msg.time}</Text>
                  </View>
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <TouchableOpacity style={styles.replyButton}>
                    <Text style={styles.replyIcon}>↩</Text>
                    <Text style={styles.replyButtonText}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Messages</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📅</Text>
            <Text style={styles.navText}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIconOrange}>📈</Text>
            <Text style={styles.navTextOrange}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>💬</Text>
            <Text style={styles.navText}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navText}>Settings</Text>
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
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
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
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      marginRight: 12,
      padding: 4,
    },
    iconText: {
      fontSize: 24,
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      lineHeight: 22,
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#126b87',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    shareIcon: {
      color: '#ffffff',
      fontSize: 16,
      marginRight: 6,
    },
    shareButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    metricsContainer: {
      gap: 16,
      marginBottom: 24,
    },
    metricCard: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    metricHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    metricLabel: {
      fontSize: 14,
      color: isDarkMode ? '#b3c1c5' : '#68828a',
      fontWeight: '500',
    },
    badgeGreen: {
      backgroundColor: isDarkMode ? 'rgba(14, 138, 58, 0.2)' : '#e6f8ea',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    badgeGreenText: {
      color: isDarkMode ? '#4ade80' : '#0e8a3a',
      fontSize: 12,
      fontWeight: '800',
    },
    metricValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    metricValueLarge: {
      fontSize: 32,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    metricValueSmall: {
      fontSize: 20,
      fontWeight: '500',
      color: isDarkMode ? '#9aacb1' : '#9aacb1',
      marginLeft: 4,
    },
    metricSubText: {
      fontSize: 12,
      color: isDarkMode ? '#9aacb1' : '#9aacb1',
      marginTop: 8,
      fontStyle: 'italic',
    },
    progressBarTrack: {
      height: 6,
      backgroundColor: isDarkMode ? '#111d21' : '#e6eaec',
      borderRadius: 3,
      marginTop: 16,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    chartSection: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      marginBottom: 24,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 4,
    },
    chartSubtitle: {
      fontSize: 13,
      color: isDarkMode ? '#b3c1c5' : '#68828a',
    },
    dropdownBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    dropdownText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginRight: 6,
    },
    dropdownIcon: {
      fontSize: 10,
      color: isDarkMode ? '#9aacb1' : '#68828a',
    },
    chartContainer: {
      height: 180,
      width: '100%',
      marginBottom: 16,
    },
    chartAxisLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    axisLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: isDarkMode ? '#9aacb1' : '#9aacb1',
    },
    supportSection: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      overflow: 'hidden',
    },
    supportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#355963' : '#e6eaec',
    },
    supportHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    supportIconBox: {
      backgroundColor: '#126b87',
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    supportIcon: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    badgeOrange: {
      backgroundColor: isDarkMode ? 'rgba(236, 91, 19, 0.2)' : '#fef0eb',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    badgeOrangeText: {
      color: '#ec5b13',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    messageItem: {
      flexDirection: 'row',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#355963' : '#e6eaec',
    },
    messageItemLast: {
      borderBottomWidth: 0,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#e6eaec',
      marginRight: 16,
    },
    messageContent: {
      flex: 1,
    },
    messageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    messageName: {
      fontSize: 15,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    messageTime: {
      fontSize: 11,
      color: isDarkMode ? '#9aacb1' : '#9aacb1',
    },
    messageText: {
      fontSize: 14,
      color: isDarkMode ? '#b3c1c5' : '#4f6d77',
      lineHeight: 20,
      marginBottom: 12,
    },
    replyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#126b87',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    replyIcon: {
      color: '#ffffff',
      fontSize: 14,
      marginRight: 6,
    },
    replyButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
    },
    viewAllButton: {
      padding: 16,
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.1)' : '#f8f9fa',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#355963' : '#e6eaec',
    },
    viewAllText: {
      color: '#126b87',
      fontSize: 14,
      fontWeight: '800',
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
    navText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#9aacb1',
    },
    navIconOrange: {
      fontSize: 22,
      color: '#ec5b13',
      marginBottom: 4,
    },
    navTextOrange: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ec5b13',
    },
  });
