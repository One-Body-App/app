import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  ServeHeader,
  ServeHubTabs,
  useServePalette,
  BRAND_COLORS,
  SERVE_JOBS,
  SERVE_MY_JOB_IDS,
} from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeHome'>;

// Reusable My Job Card Component
function MyJobCard({
  title,
  date,
  category,
  location,
  status,
  theme,
  onPress,
  onOptionsPress,
}: {
  title: string;
  date: string;
  category: string;
  location: string;
  status: string;
  theme: {
    cardBg: string;
    borderColor: string;
    text: string;
    subText: string;
    isDark: boolean;
    inputBg: string;
  };
  onPress: () => void;
  onOptionsPress: () => void;
}) {
  const isPublic = status === 'Public';

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

      <View style={styles.metaBottomRow}>
        <View style={styles.metaRowLeft}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{location}</Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.badge,
            isPublic
              ? { backgroundColor: theme.isDark ? '#0A4A35' : BRAND_COLORS.successBg }
              : { backgroundColor: theme.inputBg },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isPublic
                ? { color: theme.isDark ? '#4ade80' : BRAND_COLORS.successText }
                : { color: theme.subText },
            ]}
          >
            {status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ServeMyJobsScreen({ navigation }: Props) {
  const palette = useServePalette();

  const myJobs = SERVE_JOBS.filter((job) => SERVE_MY_JOB_IDS.includes(job.id));

  const handlePostJob = () => {
    navigation.navigate('ConnectServeCreateJobStep1');
  };

  const handleCardOptions = (jobId: number) => {
    console.log(`Open management options for job ${jobId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ServeHeader
        title="My Jobs"
        titleColor={palette.text}
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
            return;
          }
          navigation.navigate('ConnectPortal', { initialTab: 'Serve' });
        }}
      />
      <ServeHubTabs activeTab="My Jobs" navigation={navigation} palette={palette} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Post Job CTA */}
        <TouchableOpacity style={styles.postJobButton} onPress={handlePostJob}>
          <Text style={styles.postJobIcon}>⊞</Text>
          <Text style={styles.postJobText}>Post your job</Text>
        </TouchableOpacity>

        {/* Sort Row */}
        <View style={styles.actionRow}>
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

        {/* My Jobs List */}
        <View style={styles.listContainer}>
          {myJobs.map((job) => (
            <MyJobCard
              key={job.id}
              title={job.title}
              date={job.date}
              category={job.category}
              location={job.location}
              status={job.status}
              theme={palette}
              onPress={() => navigation.navigate('ConnectServeApplications', { jobId: job.id })}
              onOptionsPress={() => handleCardOptions(Number(job.id))}
            />
          ))}
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
    paddingTop: 20,
  },
  postJobButton: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  postJobIcon: {
    color: BRAND_COLORS.white,
    fontSize: 18,
    marginRight: 8,
    marginTop: -2,
  },
  postJobText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 40,
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
    marginBottom: 8,
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
  metaBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});
