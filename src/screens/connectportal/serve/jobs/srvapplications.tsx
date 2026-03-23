import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  ServeHeader,
  useServePalette,
  BRAND_COLORS,
  getServeApplicantsByJobId,
  getServeJobById,
} from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeApplications'>;

// Reusable Applicant Card Component
function ApplicantCard({
  name,
  date,
  email,
  phone,
  location,
  theme,
  onOptionsPress,
}: {
  name: string;
  date: string;
  email: string;
  phone: string;
  location: string;
  theme: { cardBg: string; borderColor: string; text: string; subText: string };
  onOptionsPress: () => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
      <View style={styles.cardHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={[styles.applicantName, { color: theme.text }]}>{name}</Text>
        </View>
        <TouchableOpacity onPress={onOptionsPress} style={styles.optionsButton}>
          <Text style={[styles.optionsIcon, { color: theme.subText }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>✉️</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{email}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📞</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{phone}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{location}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ServeApplicationsScreen({ navigation, route }: Props) {
  const palette = useServePalette();
  const job = getServeJobById(route.params.jobId);

  const [searchQuery, setSearchQuery] = useState('');
  const applicants = getServeApplicantsByJobId(route.params.jobId);
  const filteredApplicants = applicants.filter((applicant) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [applicant.name, applicant.email, applicant.location].some((value) =>
      value.toLowerCase().includes(query)
    );
  });

  const handleExportCSV = () => {
    console.log('Trigger CSV Export');
  };

  const handleApplicantOptions = (id: string) => {
    console.log('Open options for applicant:', id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ServeHeader
        title="Applications"
        titleColor={palette.text}
        onBack={() => navigation.navigate('ConnectServeHome')}
      />

      {/* Sticky Context Info & Actions */}
      <View style={styles.stickyHeaderContent}>
        {/* Current Job Context */}
        <View
          style={[
            styles.jobContextCard,
            { backgroundColor: palette.cardBg, borderColor: palette.borderColor },
          ]}
        >
          <Text style={[styles.jobContextTitle, { color: palette.text }]}>{job.title}</Text>
          <Text style={[styles.jobContextMeta, { color: palette.subText }]}>
            {filteredApplicants.length} applicant{filteredApplicants.length === 1 ? '' : 's'}
          </Text>
        </View>

        {/* Export Button */}
        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Text style={styles.exportIcon}>↑</Text>
          <Text style={styles.exportText}>Export CSV</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: palette.inputBg, borderColor: palette.borderColor },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: palette.text }]}
            placeholder="Search"
            placeholderTextColor={palette.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Applicant List */}
      <FlatList
        data={filteredApplicants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateTitle, { color: palette.text }]}>No applicants yet</Text>
            <Text style={[styles.emptyStateText, { color: palette.subText }]}>
              New applications for this role will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ApplicantCard
            name={item.name}
            date={item.date}
            email={item.email}
            phone={item.phone}
            location={item.location}
            theme={palette}
            onOptionsPress={() => handleApplicantOptions(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeaderContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  jobContextCard: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 16,
  },
  jobContextTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Rubik-Medium',
  },
  jobContextMeta: {
    fontSize: 13,
    marginTop: 6,
    fontFamily: 'OpenSans-Regular',
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportIcon: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  exportText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.grays[100],
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Medium',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.grays[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 20,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionsButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  optionsIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metaContainer: {
    paddingLeft: 52, // Align with text next to avatar
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
  },
});
