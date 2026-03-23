import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';

// One Body Brand Color Palette
const BRAND_COLORS = {
  white: '#FFFFFF',
  black: '#032f3c',
  primaryDark: '#126b87',
  infoDark: '#12d2d9',
  overlay: 'rgba(3, 47, 60, 0.5)', // Dark overlay for the bottom sheet
  grays: {
    100: '#e6eaec',
    200: '#cdd5d8',
    300: '#b3c1c5',
    400: '#9aacb1',
    500: '#81979e',
    600: '#68828a',
    700: '#4f6d77',
    800: '#355963',
    900: '#000015',
  },
};

// Reusable Metric Card
function MetricCard({
  title,
  value,
  theme,
}: {
  title: string;
  value: string | number;
  theme: { cardBg: string; cardBorder: string; text: string };
}) {
  return (
    <View
      style={[styles.metricCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
    >
      <Text style={[styles.metricTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.metricValue, { color: BRAND_COLORS.primaryDark }]}>{value}</Text>
    </View>
  );
}

interface JobAnalyticsProps {
  isVisible: boolean;
  onClose: () => void;
  jobTitle: string;
}

export default function ServeJobAnalytics({
  isVisible,
  onClose,
  jobTitle = 'Community Manager',
}: JobAnalyticsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic Theme Mapping
  const theme = {
    background: isDark ? BRAND_COLORS.grays[900] : BRAND_COLORS.white,
    text: isDark ? BRAND_COLORS.white : BRAND_COLORS.black,
    subText: isDark ? BRAND_COLORS.grays[300] : BRAND_COLORS.grays[600],
    cardBg: isDark ? BRAND_COLORS.grays[800] : BRAND_COLORS.white,
    cardBorder: isDark ? BRAND_COLORS.grays[700] : '#F1F1F1', // Exact hex from CSS
    handleBar: isDark ? BRAND_COLORS.grays[600] : BRAND_COLORS.grays[200],
  };

  // Mock Analytics Data
  const analyticsData = [
    { id: '1', title: 'PERFORMANCE', value: '3/5' },
    { id: '2', title: 'VIEWS', value: '1.2k' },
    { id: '3', title: 'SAVED', value: '526' },
    { id: '4', title: 'URL CLICKED', value: '128' },
    { id: '5', title: 'APPLICATIONS', value: '485' },
  ];

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
          {/* Handle Bar for dragging (visual only in this mock) */}
          <View style={[styles.handleBar, { backgroundColor: theme.handleBar }]} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Section */}
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Job Analytics</Text>
            <Text style={[styles.jobTitle, { color: theme.text }]}>{jobTitle}</Text>

            {/* Status Indicators */}
            <View style={styles.statusRow}>
              <View style={styles.statusBlock}>
                <Text style={[styles.statusLabel, { color: theme.text }]}>JOB STATUS</Text>
                <Text style={[styles.statusValue, { color: BRAND_COLORS.primaryDark }]}>Open</Text>
              </View>
              <View style={styles.statusBlock}>
                <Text style={[styles.statusLabel, { color: theme.text }]}>APPROVED STATUS</Text>
                <Text style={[styles.statusValue, { color: BRAND_COLORS.primaryDark }]}>
                  Approved
                </Text>
              </View>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              {analyticsData.map((data) => (
                <View key={data.id} style={styles.gridItem}>
                  <MetricCard title={data.title} value={data.value} theme={theme} />
                </View>
              ))}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BRAND_COLORS.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    height: '70%', // Leaves room for the screen behind it
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleBar: {
    width: 32,
    height: 4,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Lato', // Retaining requested font if loaded in project
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Lato',
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statusBlock: {
    width: 140, // Keeps columns aligned
    marginRight: 35,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16, // Modern RN gap support
  },
  gridItem: {
    width: '47%', // roughly half width minus gap
    marginBottom: 16, // Fallback for older RN versions without flex gap
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    height: 95,
    justifyContent: 'center',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Rubik',
  },
  bottomSpacer: {
    height: 40,
  },
});
