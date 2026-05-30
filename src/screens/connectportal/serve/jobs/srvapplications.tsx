import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import RNFS from 'react-native-fs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  formatConnectPortalDate,
  listConnectServeJobApplications,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import type {
  ConnectServeJobApplicationRecord,
  ConnectServeJobRecord,
} from '@/src/services/connectPortal/types';
import { BRAND_COLORS, ServeHeader, useServePalette } from '../shared';
import { buildApplicationsCsv, buildApplicationsCsvFileName } from './srvapplications.utils';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectServeApplications'>;

type ApplicantCardTheme = {
  cardBg: string;
  borderColor: string;
  text: string;
  subText: string;
  iconBg: string;
  iconColor: string;
  resumeBg: string;
  resumeText: string;
};

const LIGHT_SCREEN_COLORS = {
  background: BRAND_COLORS.grays[100],
  cardBg: BRAND_COLORS.white,
  borderColor: BRAND_COLORS.grays[200],
  text: BRAND_COLORS.black,
  subText: BRAND_COLORS.grays[700],
  mutedText: BRAND_COLORS.grays[600],
  searchBg: BRAND_COLORS.white,
  searchBorder: BRAND_COLORS.grays[200],
  opportunityBadgeBg: '#E7FBFC',
  opportunityBadgeText: BRAND_COLORS.primaryDark,
  headerTitle: BRAND_COLORS.primaryDark,
  metaPillBg: '#F3F7F8',
  openStatusBg: BRAND_COLORS.successBg,
  openStatusText: BRAND_COLORS.successText,
  closedStatusBg: '#EEF2F4',
  closedStatusText: BRAND_COLORS.grays[700],
  emptyIconBg: '#F2F6F7',
  emptyIconColor: BRAND_COLORS.grays[500],
  exportOutline: BRAND_COLORS.primaryBase,
  exportMuted: BRAND_COLORS.grays[400],
  iconBg: '#E8F4F7',
  iconColor: BRAND_COLORS.primaryDark,
  resumeBg: '#E9F5F7',
  resumeText: BRAND_COLORS.primaryDark,
};

const getApplicantInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return 'OB';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};

const getPostedDateLabel = (job: ConnectServeJobRecord) => {
  const sourceDate = job.publishedAt || job.updatedAt || job.createdAt;
  return sourceDate ? formatConnectPortalDate(String(sourceDate).slice(0, 10)) : 'Recently posted';
};

function ApplicantCard({
  applicant,
  theme,
  onResumePress,
}: {
  applicant: ConnectServeJobApplicationRecord;
  theme: ApplicantCardTheme;
  onResumePress: () => void;
}) {
  const submittedDate = applicant.createdAt
    ? formatConnectPortalDate(String(applicant.createdAt).slice(0, 10))
    : 'Recently submitted';

  return (
    <View
      style={[
        styles.applicantCard,
        { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
      ]}
    >
      <View style={styles.applicantHeader}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.iconBg }]}>
            <Text style={[styles.avatarText, { color: theme.iconColor }]}>
              {getApplicantInitials(applicant.name)}
            </Text>
          </View>
          <View style={styles.applicantHeaderCopy}>
            <Text style={[styles.applicantName, { color: theme.text }]} numberOfLines={1}>
              {applicant.name}
            </Text>
            <View style={styles.inlineMetaRow}>
              <MaterialIcons name="schedule" size={14} color={theme.subText} />
              <Text style={[styles.inlineMetaText, { color: theme.subText }]}>{submittedDate}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.applicantMetaGroup}>
        <View style={styles.metaRow}>
          <MaterialIcons
            name="mail-outline"
            size={16}
            color={theme.subText}
            style={styles.metaIcon}
          />
          <Text style={[styles.metaText, { color: theme.subText }]}>{applicant.email}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="phone" size={16} color={theme.subText} style={styles.metaIcon} />
          <Text style={[styles.metaText, { color: theme.subText }]}>{applicant.phone}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="place" size={16} color={theme.subText} style={styles.metaIcon} />
          <Text style={[styles.metaText, { color: theme.subText }]}>{applicant.location}</Text>
        </View>
        {applicant.testimony ? (
          <View style={styles.metaRow}>
            <MaterialIcons
              name="chat-bubble-outline"
              size={16}
              color={theme.subText}
              style={styles.metaIcon}
            />
            <Text style={[styles.metaText, { color: theme.subText }]} numberOfLines={3}>
              {applicant.testimony}
            </Text>
          </View>
        ) : null}
      </View>

      {applicant.resumeFileUrl ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View resume for ${applicant.name}`}
          onPress={onResumePress}
          style={[styles.resumeButton, { backgroundColor: theme.resumeBg }]}
          testID={`resume-link-${applicant.id}`}
        >
          <MaterialIcons name="description" size={16} color={theme.resumeText} />
          <Text style={[styles.resumeButtonText, { color: theme.resumeText }]} numberOfLines={1}>
            {applicant.resumeFileName ? `View Resume: ${applicant.resumeFileName}` : 'View Resume'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ServeApplicationsScreen({ navigation, route }: Props) {
  const palette = useServePalette();
  const { serve } = useConnectPortalData();
  const job = serve.organizerRecords.find((record) => record.id === route.params.jobId) || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ConnectServeJobApplicationRecord[]>([]);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          setLoading(true);
          setError('');
          const records = await listConnectServeJobApplications(route.params.jobId);
          if (!isActive) {
            return;
          }
          setApplications(records);
        } catch (err: any) {
          if (!isActive) {
            return;
          }
          setError(err?.message || 'Unable to load applications.');
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      })();

      return () => {
        isActive = false;
      };
    }, [route.params.jobId])
  );

  const filteredApplicants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return applications;
    }

    return applications.filter((applicant) =>
      [applicant.name, applicant.email, applicant.location, applicant.phone].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [applications, searchQuery]);

  const screenColors = useMemo(
    () =>
      palette.isDark
        ? {
            background: palette.background,
            cardBg: palette.cardBg,
            borderColor: palette.inputBorder,
            text: palette.text,
            subText: palette.subText,
            mutedText: palette.subText,
            searchBg: palette.cardBg,
            searchBorder: palette.inputBorder,
            opportunityBadgeBg: 'rgba(18, 210, 217, 0.16)',
            opportunityBadgeText: BRAND_COLORS.infoDark,
            headerTitle: BRAND_COLORS.infoDark,
            metaPillBg: 'rgba(255,255,255,0.08)',
            openStatusBg: 'rgba(18, 172, 123, 0.18)',
            openStatusText: '#6DE0B6',
            closedStatusBg: 'rgba(255,255,255,0.08)',
            closedStatusText: palette.subText,
            emptyIconBg: 'rgba(255,255,255,0.08)',
            emptyIconColor: palette.subText,
            exportOutline: BRAND_COLORS.infoDark,
            exportMuted: palette.subText,
            iconBg: 'rgba(18, 210, 217, 0.14)',
            iconColor: BRAND_COLORS.infoDark,
            resumeBg: 'rgba(18, 210, 217, 0.14)',
            resumeText: BRAND_COLORS.infoDark,
          }
        : LIGHT_SCREEN_COLORS,
    [palette]
  );

  const applicantCardTheme = useMemo(
    () => ({
      cardBg: screenColors.cardBg,
      borderColor: screenColors.borderColor,
      text: screenColors.text,
      subText: screenColors.subText,
      iconBg: screenColors.iconBg,
      iconColor: screenColors.iconColor,
      resumeBg: screenColors.resumeBg,
      resumeText: screenColors.resumeText,
    }),
    [screenColors]
  );

  const applicantCount = loading && job ? job.applicantCount : applications.length;
  const canExport = Boolean(job) && applications.length > 0 && !loading && !exporting;

  const handleExportCSV = async () => {
    if (!job || !canExport) {
      return;
    }

    const outputDirectory =
      RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath || RNFS.DocumentDirectoryPath;

    if (!outputDirectory) {
      Alert.alert('Unable to export CSV', 'No writable export directory is available.');
      return;
    }

    try {
      setExporting(true);
      const fileName = buildApplicationsCsvFileName(job.title);
      const filePath = `${outputDirectory}/${fileName}`;
      const csv = buildApplicationsCsv(applications);
      await RNFS.writeFile(filePath, csv, 'utf8');

      await Share.share({
        title: `Applications for ${job.title}`,
        url: `file://${filePath}`,
        message: Platform.OS === 'android' ? `Applications for ${job.title}` : undefined,
      });
    } catch (exportError) {
      Alert.alert('Unable to export CSV', 'Try again in a moment.');
    } finally {
      setExporting(false);
    }
  };

  const handleOpenResume = async (url: string) => {
    if (!url.trim()) {
      return;
    }

    await Linking.openURL(url);
  };

  const renderListHeader = () => {
    if (!job) {
      return null;
    }

    const postedDate = getPostedDateLabel(job);
    const locationLabel = [job.organizationName, job.address].filter(Boolean).join(' • ');

    return (
      <View style={styles.listHeaderContent}>
        <View
          style={[
            styles.opportunityCard,
            { backgroundColor: screenColors.cardBg, borderColor: screenColors.borderColor },
          ]}
          testID="opportunity-header-card"
        >
          <View style={styles.opportunityTopRow}>
            <View
              style={[
                styles.opportunityBadge,
                { backgroundColor: screenColors.opportunityBadgeBg },
              ]}
            >
              <Text
                style={[styles.opportunityBadgeText, { color: screenColors.opportunityBadgeText }]}
              >
                {job.opportunityType || 'Serve Opportunity'}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.opportunityTitle, { color: screenColors.headerTitle }]}
            numberOfLines={2}
          >
            {job.title}
          </Text>

          <Text
            style={[styles.organizationLine, { color: screenColors.subText }]}
            numberOfLines={1}
          >
            {locationLabel || 'Organization details coming soon'}
          </Text>

          <Text style={[styles.descriptionPreview, { color: screenColors.text }]} numberOfLines={2}>
            {job.description || 'No description provided for this opportunity yet.'}
          </Text>

          <View style={styles.opportunityMetaRow}>
            <View style={[styles.metaPill, { backgroundColor: screenColors.metaPillBg }]}>
              <MaterialIcons name="groups-2" size={16} color={screenColors.subText} />
              <Text style={[styles.metaPillText, { color: screenColors.subText }]}>
                {applicantCount} applicant{applicantCount === 1 ? '' : 's'}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    job.hiringStatus === 'open'
                      ? screenColors.openStatusBg
                      : screenColors.closedStatusBg,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      job.hiringStatus === 'open'
                        ? screenColors.openStatusText
                        : screenColors.closedStatusText,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      job.hiringStatus === 'open'
                        ? screenColors.openStatusText
                        : screenColors.closedStatusText,
                  },
                ]}
              >
                {job.hiringStatus === 'open' ? 'Active' : 'Closed'}
              </Text>
            </View>

            <View style={[styles.metaPill, { backgroundColor: screenColors.metaPillBg }]}>
              <MaterialIcons name="event" size={16} color={screenColors.subText} />
              <Text style={[styles.metaPillText, { color: screenColors.subText }]}>
                Posted {postedDate}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: screenColors.searchBg, borderColor: screenColors.searchBorder },
            ]}
          >
            <MaterialIcons
              color={screenColors.subText}
              name="search"
              size={20}
              style={styles.searchIcon}
            />
            <TextInput
              accessibilityLabel="Search applicants"
              onChangeText={setSearchQuery}
              placeholder="Search applicants"
              placeholderTextColor={screenColors.mutedText}
              style={[styles.searchInput, { color: screenColors.text }]}
              value={searchQuery}
            />
          </View>

          <Pressable
            accessibilityLabel="Export applicants as CSV"
            accessibilityRole="button"
            disabled={!canExport}
            onPress={handleExportCSV}
            style={[
              styles.exportButton,
              {
                borderColor: canExport ? screenColors.exportOutline : screenColors.exportMuted,
                opacity: canExport ? 1 : 0.55,
              },
            ]}
            testID="export-csv-button"
          >
            <MaterialIcons
              color={canExport ? screenColors.exportOutline : screenColors.exportMuted}
              name="file-download"
              size={18}
            />
            <Text
              style={[
                styles.exportButtonText,
                { color: canExport ? screenColors.exportOutline : screenColors.exportMuted },
              ]}
            >
              {exporting ? 'Exporting' : 'Export CSV'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={BRAND_COLORS.primaryDark} />
        </View>
      );
    }

    const trimmedSearch = searchQuery.trim();
    let title = 'No applicants yet';
    let description = 'New applications for this opportunity will appear here.';

    if (error) {
      title = 'Unable to load applicants';
      description = error;
    } else if (trimmedSearch) {
      title = 'No matches found';
      description = 'Try a different applicant name or contact detail.';
    }

    return (
      <View style={styles.stateContainer}>
        <View
          style={[styles.emptyIconWrap, { backgroundColor: screenColors.emptyIconBg }]}
          testID="applications-empty-icon"
        >
          <MaterialIcons
            name={error ? 'error-outline' : 'inbox'}
            size={28}
            color={screenColors.emptyIconColor}
          />
        </View>
        <Text style={[styles.emptyStateTitle, { color: screenColors.text }]}>{title}</Text>
        <Text style={[styles.emptyStateText, { color: screenColors.subText }]}>{description}</Text>
      </View>
    );
  };

  if (!job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenColors.background }]}>
        <ServeHeader
          title="Applications"
          titleColor={screenColors.text}
          onBack={() => navigation.navigate('ConnectServeHome')}
        />
        <View style={styles.missingState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: screenColors.emptyIconBg }]}>
            <MaterialIcons name="work-outline" size={28} color={screenColors.emptyIconColor} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: screenColors.text }]}>Job not found</Text>
          <Text style={[styles.emptyStateText, { color: screenColors.subText }]}>
            This Serve opportunity is no longer available in your organizer dashboard.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: screenColors.background }]}>
      <SafeAreaView edges={['top']}>
        <ServeHeader
          title="Applications"
          titleColor={screenColors.text}
          onBack={() => navigation.navigate('ConnectServeHome')}
        />
      </SafeAreaView>

      <FlatList
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        data={loading ? [] : filteredApplicants}
        initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={renderListHeader}
        maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
        removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
        renderItem={({ item }) => (
          <ApplicantCard
            applicant={item}
            onResumePress={() => handleOpenResume(item.resumeFileUrl)}
            theme={applicantCardTheme}
          />
        )}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
        windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  listHeaderContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  opportunityCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  opportunityTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  opportunityBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  opportunityBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'OpenSans-SemiBold',
  },
  opportunityTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Rubik-Bold',
    marginBottom: 8,
  },
  organizationLine: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'OpenSans-SemiBold',
    marginBottom: 10,
  },
  descriptionPreview: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'OpenSans-Regular',
    marginBottom: 16,
  },
  opportunityMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-SemiBold',
    marginLeft: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-SemiBold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'OpenSans-Regular',
    paddingVertical: 0,
  },
  exportButton: {
    minWidth: 120,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  exportButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'OpenSans-SemiBold',
    marginLeft: 8,
  },
  applicantCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  applicantHeader: {
    marginBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Rubik-Bold',
  },
  applicantHeaderCopy: {
    flex: 1,
  },
  applicantName: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Rubik-Medium',
    marginBottom: 4,
  },
  inlineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineMetaText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-Regular',
    marginLeft: 6,
  },
  applicantMetaGroup: {
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  metaIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  metaText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'OpenSans-Regular',
  },
  resumeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  resumeButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-SemiBold',
    marginLeft: 8,
    flexShrink: 1,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 52,
  },
  missingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyStateTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Rubik-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
  },
});
