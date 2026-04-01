import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  listConnectServeJobApplications,
  formatConnectPortalDate,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import type { ConnectServeJobApplicationRecord } from '@/src/services/connectPortal/types';
import { ServeHeader, useServePalette, BRAND_COLORS } from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeApplications'>;

function ApplicantCard({
  applicant,
  theme,
  onOptionsPress,
}: {
  applicant: ConnectServeJobApplicationRecord;
  theme: { cardBg: string; borderColor: string; text: string; subText: string };
  onOptionsPress: () => void;
}) {
  const submittedDate = applicant.createdAt
    ? formatConnectPortalDate(String(applicant.createdAt).slice(0, 10))
    : 'Recently submitted';

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
      <View style={styles.cardHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={[styles.applicantName, { color: theme.text }]}>{applicant.name}</Text>
        </View>
        <TouchableOpacity onPress={onOptionsPress} style={styles.optionsButton}>
          <Text style={[styles.optionsIcon, { color: theme.subText }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{submittedDate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>✉️</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{applicant.email}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📞</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{applicant.phone}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={[styles.metaText, { color: theme.subText }]}>{applicant.location}</Text>
        </View>
        {applicant.testimony ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>✍️</Text>
            <Text style={[styles.metaText, { color: theme.subText }]} numberOfLines={3}>
              {applicant.testimony}
            </Text>
          </View>
        ) : null}
      </View>
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

  useEffect(() => {
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
  }, [route.params.jobId]);

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

      {!job ? (
        <View style={styles.emptyShell}>
          <Text style={[styles.emptyStateText, { color: palette.subText }]}>Job not found.</Text>
        </View>
      ) : (
        <>
          <View style={styles.stickyHeaderContent}>
            <View
              style={[
                styles.jobContextCard,
                { backgroundColor: palette.cardBg, borderColor: palette.borderColor },
              ]}
            >
              <Text style={[styles.jobContextTitle, { color: palette.text }]}>{job.title}</Text>
              <Text style={[styles.jobContextMeta, { color: palette.subText }]}>
                {applications.length} applicant{applications.length === 1 ? '' : 's'}
              </Text>
            </View>

            <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
              <Text style={styles.exportIcon}>↑</Text>
              <Text style={styles.exportText}>Export CSV</Text>
            </TouchableOpacity>

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

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={BRAND_COLORS.primaryDark} />
            </View>
          ) : (
            <FlatList
              data={filteredApplicants}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateTitle, { color: palette.text }]}>
                    {error ? 'Unable to load applicants' : 'No applicants yet'}
                  </Text>
                  <Text style={[styles.emptyStateText, { color: palette.subText }]}>
                    {error || 'New applications for this role will appear here.'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <ApplicantCard
                  applicant={item}
                  theme={palette}
                  onOptionsPress={() => handleApplicantOptions(item.id)}
                />
              )}
              removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
              initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
              maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
              updateCellsBatchingPeriod={
                STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod
              }
              windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
            />
          )}
        </>
      )}
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
  emptyShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'OpenSans-Regular',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6FA',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 18,
  },
  applicantName: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
  },
  optionsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  optionsIcon: {
    fontSize: 18,
  },
  metaContainer: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  metaText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'OpenSans-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontFamily: 'Rubik-Medium',
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },
});
