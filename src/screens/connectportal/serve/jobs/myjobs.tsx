import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import FilterSortIcon from '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg';
import CustomModal from '@/src/components/CustomModal';
import {
  formatConnectPortalDate,
  getConnectServeResumeRouteName,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import {
  ServeHeader,
  ServeHubTabs,
  useServePalette,
  BRAND_COLORS,
  type ServePalette,
} from '../shared';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectServeHome'>;

const STATUS_OPTIONS = ['All', 'Draft', 'Public', 'Private'];
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
            <Pressable
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
            </Pressable>
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
  const isHighlighted = status === 'Public' || status === 'Draft';
  const isDraft = status === 'Draft';

  let badgeBg = palette.inputBg;
  if (isHighlighted) {
    if (isDraft) {
      badgeBg = palette.isDark ? '#3f2d14' : '#fff6e8';
    } else {
      badgeBg = palette.isDark ? '#0A4A35' : BRAND_COLORS.successBg;
    }
  }

  let badgeColor = palette.subText;
  if (isHighlighted) {
    if (isDraft) {
      badgeColor = palette.isDark ? '#f8d27a' : '#b26a00';
    } else {
      badgeColor = palette.isDark ? '#4ade80' : BRAND_COLORS.successText;
    }
  }

  return (
    <Pressable
      style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.borderColor }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.jobTitle, { color: palette.text }]}>{title}</Text>
        <Pressable onPress={onOptionsPress} style={styles.optionsButton}>
          <MaterialIcons name="more-vert" size={20} color={palette.subText} />
        </Pressable>
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

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text
            style={[
              styles.badgeText,
              isHighlighted ? { color: badgeColor } : { color: palette.subText },
            ]}
          >
            {status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ServeMyJobsScreen({ navigation }: Props) {
  const palette = useServePalette();
  const { serve } = useConnectPortalData();
  const refreshServeJobs = serve.refresh;

  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedOpportunityType, setSelectedOpportunityType] = useState('All');

  useFocusEffect(
    React.useCallback(() => {
      refreshServeJobs();
    }, [refreshServeJobs])
  );

  const allMyJobs = useMemo(
    () =>
      [...serve.draftRecords, ...serve.organizerRecords].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt)
      ),
    [serve.draftRecords, serve.organizerRecords]
  );

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(allMyJobs.flatMap((job) => (job.sector ? [job.sector] : [])))
    );
    return ['All', ...unique];
  }, [allMyJobs]);

  const myJobs = useMemo(() => {
    return allMyJobs.filter((job) => {
      let cardStatus = 'Private';
      if (job.status === 'draft') {
        cardStatus = 'Draft';
      } else if (job.visibility === 'public') {
        cardStatus = 'Public';
      }

      if (selectedCategory !== 'All' && job.sector !== selectedCategory) return false;
      if (selectedStatus !== 'All' && cardStatus !== selectedStatus) return false;
      if (selectedOpportunityType !== 'All' && job.opportunityType !== selectedOpportunityType)
        return false;
      return true;
    });
  }, [allMyJobs, selectedCategory, selectedStatus, selectedOpportunityType]);

  const getCardStatus = (job: (typeof allMyJobs)[number]) => {
    if (job.status === 'draft') {
      return 'Draft';
    }

    if (job.visibility === 'public') {
      return 'Public';
    }

    return 'Private';
  };

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
  const postJobButtonColor = '#126b87';
  const modalSurface = palette.isDark ? '#1a2c32' : '#ffffff';
  const modalHandle = palette.isDark ? '#3a4a50' : '#d1d5db';
  const modalCloseBg = palette.isDark ? '#032f3c' : '#f3f4f6';

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
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create opportunity"
              onPress={handlePostJob}
              style={styles.headerActionButton}
            >
              <MaterialIcons name="add" size={22} color={palette.text} />
            </Pressable>
          }
        />
        <ServeHubTabs activeTab="Created" navigation={navigation} palette={palette} />
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContainer}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={[styles.postJobButton, { backgroundColor: postJobButtonColor }]}
          onPress={handlePostJob}
        >
          <MaterialIcons name="add-box" size={18} color={ctaTextColor} style={styles.postJobIcon} />
          <Text style={[styles.postJobText, { color: ctaTextColor }]}>Post an Opportunity</Text>
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.filterButton,
              { backgroundColor: palette.inputBg, borderColor: palette.borderColor },
            ]}
            onPress={() => setFilterVisible(true)}
          >
            <FilterSortIcon width={18} height={18} color={palette.subText} />
          </Pressable>
          {hasActiveFilters ? (
            <Pressable onPress={handleClearFilters}>
              <Text style={[styles.clearFilterText, { color: palette.accent }]}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.listContainer}>
          {myJobs.map((job) => (
            <MyJobCard
              key={job.id}
              title={job.title}
              date={
                job.status === 'draft'
                  ? `Saved ${formatConnectPortalDate(job.updatedAt.slice(0, 10))}`
                  : `Published ${formatConnectPortalDate((job.publishedAt || job.updatedAt).slice(0, 10))}`
              }
              category={job.sector || 'Uncategorized'}
              location={job.address || 'Location TBD'}
              status={getCardStatus(job)}
              palette={palette}
              onPress={() => {
                if (job.status === 'draft') {
                  navigation.navigate(getConnectServeResumeRouteName(job), {
                    draftId: job.id,
                  } as never);
                  return;
                }
                navigation.navigate('ConnectServeApplications', { jobId: job.id });
              }}
              onOptionsPress={() => {
                console.log(`Open management options for job ${job.id}`);
              }}
            />
          ))}
          {!myJobs.length ? (
            <View style={[styles.emptyState, { borderColor: palette.borderColor }]}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                No Opportunities Found
              </Text>
              <Text style={[styles.emptyBody, { color: palette.subText }]}>
                Try adjusting your filters or post an opportunity.
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
            <Pressable
              onPress={() => setFilterVisible(false)}
              style={[filterStyles.closeButton, { backgroundColor: modalCloseBg }]}
            >
              <MaterialIcons name="close" size={20} color={palette.subText} />
            </Pressable>
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
            <Pressable
              style={[filterStyles.footerButton, { backgroundColor: palette.inputBg }]}
              onPress={() => {
                handleClearFilters();
                setFilterVisible(false);
              }}
            >
              <Text style={[filterStyles.footerButtonText, { color: palette.text }]}>
                Clear all
              </Text>
            </Pressable>
            <Pressable
              style={[filterStyles.footerButton, { backgroundColor: palette.accent }]}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={[filterStyles.footerButtonText, { color: ctaTextColor }]}>
                Apply filter
              </Text>
            </Pressable>
          </View>
        </View>
      </CustomModal>
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
  headerActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
