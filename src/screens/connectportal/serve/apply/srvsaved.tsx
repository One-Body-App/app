import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import FilterSortIcon from '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg';
import {
  ServeHeader,
  ServeHubTabs,
  useServePalette,
  SERVE_JOBS,
  SERVE_SAVED_JOB_IDS,
  type ServePalette,
} from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeSaved'>;

function SavedJobCard({
  title,
  date,
  category,
  location,
  palette,
  onPress,
}: {
  title: string;
  date: string;
  category: string;
  location: string;
  palette: ServePalette;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.borderColor }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.jobTitle, { color: palette.text }]}>{title}</Text>
        <MaterialIcons name="bookmark" size={18} color={palette.subText} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaIconWrap}>
          <MaterialIcons name="event" size={14} color={palette.subText} />
        </View>
        <Text style={[styles.metaText, { color: palette.subText }]}>{date}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaIconWrap}>
          <MaterialIcons name="label-outline" size={14} color={palette.subText} />
        </View>
        <Text style={[styles.metaText, { color: palette.subText }]}>{category}</Text>
      </View>

      <View style={styles.metaBottomRow}>
        <View style={styles.metaRowLeft}>
          <View style={styles.metaIconWrap}>
            <MaterialIcons name="place" size={14} color={palette.subText} />
          </View>
          <Text style={[styles.metaText, { color: palette.subText }]}>{location}</Text>
        </View>

        <View
          style={[styles.badge, { backgroundColor: palette.isDark ? '#112935' : palette.inputBg }]}
        >
          <Text style={[styles.badgeText, { color: palette.isDark ? '#8dd6e5' : palette.text }]}>
            Saved
          </Text>
        </View>
      </View>
    </Pressable>
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
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <SafeAreaView edges={['top']}>
        <ServeHeader
          title="My Serve"
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
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContainer}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: palette.inputBg, borderColor: palette.borderColor },
            ]}
          >
            <MaterialIcons
              name="search"
              size={18}
              color={palette.subText}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: palette.text }]}
              placeholder="Search saved jobs"
              placeholderTextColor={palette.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Pressable
            style={[
              styles.filterButton,
              { backgroundColor: palette.inputBg, borderColor: palette.borderColor },
            ]}
          >
            <FilterSortIcon width={18} height={18} color={palette.subText} />
          </Pressable>
        </View>

        <View style={styles.listContainer}>
          {filteredJobs.map((job) => (
            <SavedJobCard
              key={job.id}
              title={job.title}
              date={job.date}
              category={job.category}
              location={job.location}
              palette={palette}
              onPress={() => navigation.navigate('ConnectServeJobView', { jobId: job.id })}
            />
          ))}
          {!filteredJobs.length ? (
            <View style={[styles.emptyState, { borderColor: palette.borderColor }]}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>No saved jobs found</Text>
              <Text style={[styles.emptyBody, { color: palette.subText }]}>
                Try a different search or save a role from Explore.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
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
    marginBottom: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    width: 40,
    height: 40,
  },
  listContainer: {
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Rubik-Bold',
    lineHeight: 24,
    paddingRight: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  metaIconWrap: {
    width: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'OpenSans-Regular',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },
  bottomSpacer: {
    height: 40,
  },
});
