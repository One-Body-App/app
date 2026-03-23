import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  ServeHeader,
  ServeHubTabs,
  useServePalette,
  SERVE_APPLIED_JOB_IDS,
  SERVE_JOBS,
} from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeApplied'>;

// Reusable Applied Job Card Component
function AppliedJobCard({
  title,
  date,
  category,
  location,
  theme,
  onPress,
  onOptionsPress,
}: {
  title: string;
  date: string;
  category: string;
  location: string;
  theme: { cardBg: string; borderColor: string; text: string; subText: string };
  onPress: () => void;
  onOptionsPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.jobTitle, { color: theme.text }]}>{title}</Text>
        <TouchableOpacity onPress={onOptionsPress} style={styles.optionsButton}>
          <Text style={[styles.optionsIcon, { color: theme.subText }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaIcon}>📅</Text>
        <Text style={[styles.metaText, { color: theme.subText }]}>{date}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaIcon}>🏷️</Text>
        <Text style={[styles.metaText, { color: theme.subText }]}>{category}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaIcon}>📍</Text>
        <Text style={[styles.metaText, { color: theme.subText }]}>{location}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ServeAppliedScreen({ navigation }: Props) {
  const palette = useServePalette();
  const appliedJobs = SERVE_JOBS.filter((job) => SERVE_APPLIED_JOB_IDS.includes(job.id));
  const [searchQuery, setSearchQuery] = React.useState('');
  const filteredJobs = appliedJobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [job.title, job.category, job.location].some((value) =>
      value.toLowerCase().includes(query)
    );
  });

  const handleCardOptions = (jobId: number) => {
    // Action to open a bottom sheet/modal for the specific application
    console.log(`Open options for job ${jobId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ServeHeader
        title="Applied"
        titleColor={palette.text}
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
            return;
          }
          navigation.navigate('ConnectPortal', { initialTab: 'Serve' });
        }}
      />
      <ServeHubTabs activeTab="Applied" navigation={navigation} palette={palette} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search and Sort Row */}
        <View style={styles.actionRow}>
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

          <TouchableOpacity
            style={[
              styles.sortButton,
              { backgroundColor: palette.background, borderColor: palette.borderColor },
            ]}
          >
            <Text style={styles.sortIcon}>≡</Text>
            <Text style={[styles.sortText, { color: palette.subText }]}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Applied Jobs List */}
        <View style={styles.listContainer}>
          {filteredJobs.map((job) => (
            <AppliedJobCard
              key={job.id}
              title={job.title}
              date={job.date}
              category={job.category}
              location={job.location}
              theme={palette}
              onPress={() => navigation.navigate('ConnectServeAppliedJobView', { jobId: job.id })}
              onOptionsPress={() => handleCardOptions(Number(job.id))}
            />
          ))}
          {!filteredJobs.length ? (
            <View style={[styles.emptyState, { borderColor: palette.borderColor }]}>
              <Text style={[styles.emptyStateTitle, { color: palette.text }]}>
                No applications match
              </Text>
              <Text style={[styles.emptyStateText, { color: palette.subText }]}>
                Try another search term to find one of your submitted applications.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  sortIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  sortText: {
    fontSize: 14,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    paddingRight: 10,
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
  emptyState: {
    borderWidth: 1,
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
  bottomSpacer: {
    height: 40,
  },
});
