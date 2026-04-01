import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  formatConnectPortalDate,
  getConnectServeCompensationLabel,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { ServeHeader, useServePalette, BRAND_COLORS } from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeJobView'>;

// Reusable Card Component for Details
function DetailCard({
  title,
  children,
  customStyle,
}: {
  title: string;
  children: React.ReactNode;
  customStyle?: object;
}) {
  return (
    <View style={[styles.card, customStyle]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

export default function ServeJobPage({ navigation, route }: Props) {
  const palette = useServePalette();
  const [isSaved, setIsSaved] = React.useState(false);
  const { serve } = useConnectPortalData();
  const job =
    [...serve.publicRecords, ...serve.organizerRecords].find(
      (record) => record.id === route.params.jobId
    ) || null;

  if (!job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <ServeHeader
          title="Job Details"
          titleColor={palette.text}
          onBack={() => navigation.navigate('ConnectPortal', { initialTab: 'Serve' })}
        />
        <View style={styles.emptyState}>
          <Text style={[styles.bodyText, { color: palette.subText }]}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasInAppMethod = job.applicationMethods.includes('in_app');
  const hasExternalLinkMethod =
    job.applicationMethods.includes('external_link') && !!job.applicationUrl.trim();

  const handleApply = () => {
    if (hasInAppMethod && hasExternalLinkMethod) {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: 'Choose how to apply',
            options: ['Cancel', 'Apply in One Body', 'Open external link'],
            cancelButtonIndex: 0,
          },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              navigation.navigate('ConnectServeJobApply', { jobId: job.id });
            } else if (buttonIndex === 2) {
              handleOpenLink(job.applicationUrl);
            }
          }
        );
        return;
      }

      Alert.alert('Choose how to apply', undefined, [
        {
          text: 'Apply in One Body',
          onPress: () => navigation.navigate('ConnectServeJobApply', { jobId: job.id }),
        },
        {
          text: 'Open external link',
          onPress: () => handleOpenLink(job.applicationUrl),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    if (hasInAppMethod) {
      navigation.navigate('ConnectServeJobApply', { jobId: job.id });
      return;
    }

    if (hasExternalLinkMethod) {
      handleOpenLink(job.applicationUrl);
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ServeHeader
        title="Job Details"
        titleColor={palette.text}
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
            return;
          }
          navigation.navigate('ConnectPortal', { initialTab: 'Serve' });
        }}
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Job Header Info */}
        <View style={styles.jobHeader}>
          <Text style={[styles.jobTitle, { color: palette.text }]}>{job.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={[styles.metaText, { color: palette.subText }]}>
              {`Updated ${formatConnectPortalDate(job.updatedAt.slice(0, 10))}`}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>🏷️</Text>
            <Text style={[styles.metaText, { color: palette.subText }]}>{job.sector}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={[styles.metaText, { color: palette.subText }]}>{job.address}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: palette.inputBg }]}
            onPress={() => setIsSaved((current) => !current)}
          >
            <Text style={styles.saveIcon}>🔖</Text>
            <Text style={[styles.saveButtonText, { color: palette.text }]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <DetailCard title="Posted by">
          <TouchableOpacity>
            <Text style={styles.linkText}>{job.organizationName}</Text>
          </TouchableOpacity>
          <Text style={[styles.subText, { color: palette.subText }]}>{job.denomination}</Text>
        </DetailCard>

        <DetailCard title="Status">
          <Text style={[styles.bodyText, { color: palette.text }]}>
            {`${job.hiringStatus === 'open' ? 'Open' : 'Closed'} • ${job.visibility === 'public' ? 'Public' : 'Private'}`}
          </Text>
        </DetailCard>

        <DetailCard title="Description">
          <Text style={[styles.bodyText, { color: palette.text }]}>{job.description}</Text>
        </DetailCard>

        <DetailCard title="Requirements">
          <View style={styles.bulletList}>
            {job.requirements.map((requirement) => (
              <Text key={requirement} style={[styles.bodyText, { color: palette.text }]}>
                • {requirement}
              </Text>
            ))}
          </View>
        </DetailCard>

        {/* Two-Column Grid for Comp & Frequency */}
        <View style={styles.gridRow}>
          <DetailCard title="Compensation" customStyle={styles.gridItem}>
            <Text style={[styles.bodyText, { color: palette.text }]}>
              {getConnectServeCompensationLabel(job.compensationAmount, job.compensationFrequency)}
            </Text>
          </DetailCard>
          <DetailCard title="Frequency" customStyle={styles.gridItem}>
            <Text style={[styles.bodyText, { color: palette.text }]}>
              {job.compensationFrequency.replace('per_', 'Per ') || 'Not specified'}
            </Text>
          </DetailCard>
        </View>

        <DetailCard title="Opportunity Type">
          <Text style={[styles.bodyText, { color: palette.text }]}>{job.opportunityType}</Text>
        </DetailCard>

        <DetailCard title="Application Methods">
          <Text style={[styles.bodyText, { color: palette.text }]}>
            {job.applicationMethods.includes('in_app') ? 'Apply in One Body' : ''}
            {job.applicationMethods.includes('in_app') &&
            job.applicationMethods.includes('external_link')
              ? ' • '
              : ''}
            {job.applicationMethods.includes('external_link') ? 'External link' : ''}
          </Text>
        </DetailCard>

        {hasExternalLinkMethod ? (
          <DetailCard title="Application URL">
            <TouchableOpacity
              style={styles.urlRow}
              onPress={() => handleOpenLink(job.applicationUrl)}
            >
              <Text style={styles.linkIcon}>🔗</Text>
              <Text style={styles.linkText}>{job.applicationUrl}</Text>
            </TouchableOpacity>
          </DetailCard>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  jobHeader: {
    marginTop: 10,
    marginBottom: 24,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  metaText: {
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12, // Requires newer RN, fallback to margin on child if needed
  },
  applyButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  applyButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.grays[100],
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND_COLORS.grays[600],
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: 'Rubik-Medium',
  },
  cardContent: {
    marginTop: 4,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  subText: {
    fontSize: 13,
    marginTop: 4,
  },
  linkText: {
    fontSize: 15,
    color: BRAND_COLORS.primaryDark,
    fontWeight: '500',
  },
  bulletList: {
    paddingLeft: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    flex: 1,
    marginBottom: 16,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 40,
  },
});
