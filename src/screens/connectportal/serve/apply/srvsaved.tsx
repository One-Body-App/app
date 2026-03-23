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
  SERVE_JOBS,
  SERVE_SAVED_JOB_IDS,
} from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeSaved'>;

// Reusable Job Card Component
function SavedJobCard({
  title,
  date,
  category,
  location,
  theme,
  onPress,
}: {
  title: string;
  date: string;
  category: string;
  location: string;
  theme: { cardBg: string; borderColor: string; text: string; subText: string };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.jobTitle, { color: theme.text }]}>{title}</Text>

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

export default function ServeSavedScreen({ navigation }: Props) {
  const palette = useServePalette();
  const savedJobs = SERVE_JOBS.filter((job) => SERVE_SAVED_JOB_IDS.includes(job.id));
  const [searchQuery, setSearchQuery] = React.useState('');
  const filteredJobs = savedJobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [job.title, job.category, job.location].some((value) =>
      value.toLowerCase().includes(query)
    );
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ServeHeader
        title="Saved"
        titleColor={palette.text}
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
            return;
          }
          navigation.navigate('ConnectPortal', { initialTab: 'Serve' });
        }}
      />
      <ServeHubTabs activeTab="Saved" navigation={navigation} palette={palette} />

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

        {/* Saved Jobs List */}
        <View style={styles.listContainer}>
          {filteredJobs.map((job) => (
            <SavedJobCard
              key={job.id}
              title={job.title}
              date={job.date}
              category={job.category}
              location={job.location}
              theme={palette}
              onPress={() => navigation.navigate('ConnectServeJobView', { jobId: job.id })}
            />
          ))}
          {!filteredJobs.length ? (
            <View style={[styles.emptyState, { borderColor: palette.borderColor }]}>
              <Text style={[styles.emptyStateTitle, { color: palette.text }]}>
                No saved jobs found
              </Text>
              <Text style={[styles.emptyStateText, { color: palette.subText }]}>
                Try a different search or save a role from Explore.
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
    marginRight: 12, // Fallback for gap
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
    borderRadius: 4,
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
    marginBottom: 16, // Fallback for gap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 22,
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
  bottomSpacer: {
    height: 40,
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
});
