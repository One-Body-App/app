import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import FilterSortIcon from '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg';
import CustomModal from '@/src/components/CustomModal';
import {
  ServeHeader,
  ServeHubTabs,
  useServePalette,
  BRAND_COLORS,
  SERVE_JOBS,
  SERVE_MY_JOB_IDS,
  type ServePalette,
} from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeHome'>;

const STATUS_OPTIONS = ['All', 'Public', 'Private', 'Open'];
const OPPORTUNITY_TYPE_OPTIONS = ['All', 'Full time', 'Part time'];

function FilterSection({
  label,
  options,
  selected,
  onSelect,
  palette,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  palette: ServePalette;
}) {
  return (
    <View style={filterStyles.section}>
      <Text style={[filterStyles.sectionLabel, { color: palette.text }]}>{label}</Text>
      <View style={filterStyles.pillRow}>
        {options.map((option) => {
          const isActive = option === selected;
          const activeTextColor = palette.isDark ? BRAND_COLORS.black : BRAND_COLORS.white;
          return (
            <TouchableOpacity
              key={option}
              style={[
                filterStyles.pill,
                isActive
                  ? { backgroundColor: palette.accent, borderColor: palette.accent }
                  : { backgroundColor: palette.inputBg, borderColor: palette.borderColor },
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  filterStyles.pillText,
                  { color: isActive ? activeTextColor : palette.text },
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MyJobCard({
  title,
  date,
  category,
  location,
  status,
  palette,
  onPress,
  onOptionsPress,
}: {
  title: string;
  date: string;
  category: string;
  location: string;
  status: string;
  palette: ServePalette;
  onPress: () => void;
  onOptionsPress: () => void;
}) {
  const isPublic = status === 'Public';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.borderColor }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.jobTitle, { color: palette.text }]}>{title}</Text>
        <TouchableOpacity onPress={onOptionsPress} style={styles.optionsButton}>
          <MaterialIcons name="more-vert" size={20} color={palette.subText} />
        </TouchableOpacity>
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
          style={[
            styles.badge,
            isPublic
              ? { backgroundColor: palette.isDark ? '#0A4A35' : BRAND_COLORS.successBg }
              : { backgroundColor: palette.inputBg },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isPublic
                ? { color: palette.isDark ? '#4ade80' : BRAND_COLORS.successText }
                : { color: palette.subText },
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

  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedOpportunityType, setSelectedOpportunityType] = useState('All');

  const allMyJobs = useMemo(
    () => SERVE_JOBS.filter((job) => SERVE_MY_JOB_IDS.includes(job.id)),
    []
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(allMyJobs.map((job) => job.category)));
    return ['All', ...unique];
  }, [allMyJobs]);

  const myJobs = useMemo(() => {
    return allMyJobs.filter((job) => {
      if (selectedCategory !== 'All' && job.category !== selectedCategory) return false;
      if (selectedStatus !== 'All' && job.status !== selectedStatus) return false;
      if (selectedOpportunityType !== 'All' && job.opportunityType !== selectedOpportunityType)
        return false;
      return true;
    });
  }, [allMyJobs, selectedCategory, selectedStatus, selectedOpportunityType]);

  const hasActiveFilters =
    selectedCategory !== 'All' || selectedStatus !== 'All' || selectedOpportunityType !== 'All';

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedOpportunityType('All');
  };

  const handlePostJob = () => {
    navigation.navigate('ConnectServeCreateJobStep1');
  };

  const ctaTextColor = palette.isDark ? BRAND_COLORS.black : BRAND_COLORS.white;
  const modalSurface = palette.isDark ? '#1a2c32' : '#ffffff';
  const modalHandle = palette.isDark ? '#3a4a50' : '#d1d5db';
  const modalCloseBg = palette.isDark ? '#032f3c' : '#f3f4f6';

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
        <TouchableOpacity
          style={[styles.postJobButton, { backgroundColor: palette.accent }]}
          onPress={handlePostJob}
        >
          <MaterialIcons name="add-box" size={18} color={ctaTextColor} style={styles.postJobIcon} />
          <Text style={[styles.postJobText, { color: ctaTextColor }]}>Post your job</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: palette.inputBg, borderColor: palette.borderColor },
            ]}
            onPress={() => setFilterVisible(true)}
          >
            <FilterSortIcon width={18} height={18} color={palette.subText} />
          </TouchableOpacity>
          {hasActiveFilters ? (
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={[styles.clearFilterText, { color: palette.accent }]}>Clear filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.listContainer}>
          {myJobs.map((job) => (
            <MyJobCard
              key={job.id}
              title={job.title}
              date={job.date}
              category={job.category}
              location={job.location}
              status={job.status}
              palette={palette}
              onPress={() => navigation.navigate('ConnectServeApplications', { jobId: job.id })}
              onOptionsPress={() => {
                console.log(`Open management options for job ${job.id}`);
              }}
            />
          ))}
          {!myJobs.length ? (
            <View style={[styles.emptyState, { borderColor: palette.borderColor }]}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>No jobs found</Text>
              <Text style={[styles.emptyBody, { color: palette.subText }]}>
                Try adjusting your filters.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CustomModal
        modalVisible={filterVisible}
        onclose={() => setFilterVisible(false)}
        style={{ backgroundColor: modalSurface, minHeight: '50%' }}
      >
        <View style={[filterStyles.surface, { backgroundColor: modalSurface }]}>
          <View style={filterStyles.handleRow}>
            <View style={[filterStyles.handle, { backgroundColor: modalHandle }]} />
          </View>

          <View style={filterStyles.headerRow}>
            <Text style={[filterStyles.headerTitle, { color: palette.text }]}>Filter</Text>
            <TouchableOpacity
              onPress={() => setFilterVisible(false)}
              style={[filterStyles.closeButton, { backgroundColor: modalCloseBg }]}
            >
              <MaterialIcons name="close" size={20} color={palette.subText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={filterStyles.scrollArea}
            contentContainerStyle={filterStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <FilterSection
              label="Category"
              options={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              palette={palette}
            />
            <FilterSection
              label="Status"
              options={STATUS_OPTIONS}
              selected={selectedStatus}
              onSelect={setSelectedStatus}
              palette={palette}
            />
            <FilterSection
              label="Opportunity Type"
              options={OPPORTUNITY_TYPE_OPTIONS}
              selected={selectedOpportunityType}
              onSelect={setSelectedOpportunityType}
              palette={palette}
            />
          </ScrollView>

          <View style={[filterStyles.footer, { borderTopColor: palette.borderColor }]}>
            <TouchableOpacity
              style={[filterStyles.footerButton, { backgroundColor: palette.inputBg }]}
              onPress={() => {
                handleClearFilters();
                setFilterVisible(false);
              }}
            >
              <Text style={[filterStyles.footerButtonText, { color: palette.text }]}>
                Clear all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[filterStyles.footerButton, { backgroundColor: palette.accent }]}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={[filterStyles.footerButtonText, { color: ctaTextColor }]}>
                Apply filter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>
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
  postJobButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  postJobIcon: {
    marginRight: 8,
  },
  postJobText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Rubik-Bold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    width: 40,
    height: 40,
  },
  clearFilterText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    marginLeft: 12,
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
  optionsButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
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

const filterStyles = StyleSheet.create({
  surface: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    flex: 1,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 9999,
  },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    fontWeight: '600',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 15,
    fontWeight: '600',
  },
});
