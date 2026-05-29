import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { ServeHeader, useServePalette, BRAND_COLORS, getServeJobById } from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeAppliedJobView'>;

// Reusable Detail Card Component
function DetailCard({
  title,
  children,
  customStyle,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  customStyle?: object;
  theme: { cardBg: string; borderColor: string; subText: string };
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
        customStyle,
      ]}
    >
      <Text style={[styles.cardTitle, { color: theme.subText }]}>{title}</Text>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

export default function ServeAppliedJobPage({ navigation, route }: Props) {
  const palette = useServePalette();
  const job = getServeJobById(route.params.jobId);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <SafeAreaView edges={['top']}>
        <ServeHeader
          title="Application"
          titleColor={palette.text}
          onBack={() => navigation.navigate('ConnectServeApplied')}
        />
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContainer}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Job Header Info */}
        <View style={styles.jobHeader}>
          <Text style={[styles.jobTitle, { color: palette.text }]}>{job.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={[styles.metaText, { color: palette.subText }]}>{job.date}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>🏷️</Text>
            <Text style={[styles.metaText, { color: palette.subText }]}>{job.category}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={[styles.metaText, { color: palette.subText }]}>{job.location}</Text>
          </View>
        </View>

        {/* ENHANCEMENT: Application Status Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: palette.isDark ? palette.cardBg : '#F0F8FA',
              borderColor: palette.borderColor,
            },
          ]}
        >
          <View style={styles.statusRow}>
            <Text style={styles.statusCheck}>✓</Text>
            <Text style={[styles.statusBannerTitle, { color: BRAND_COLORS.primaryDark }]}>
              Application Submitted
            </Text>
          </View>
          <Text style={[styles.statusBannerDesc, { color: palette.subText }]}>
            You applied on {job.applicationSubmittedAt || job.date}. We&#39;re praying for God&#39;s
            will in this process!
          </Text>
        </View>

        {/* Details Section */}
        <DetailCard title="Posted by" theme={palette}>
          <Pressable>
            <Text style={styles.linkText}>{job.organization}</Text>
          </Pressable>
        </DetailCard>

        <DetailCard title="Status" theme={palette}>
          <Text style={[styles.bodyText, { color: palette.text }]}>{job.status}</Text>
        </DetailCard>

        <DetailCard title="Description" theme={palette}>
          <Text style={[styles.bodyText, { color: palette.text }]}>{job.description}</Text>
        </DetailCard>

        <DetailCard title="Requirements" theme={palette}>
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
          <DetailCard title="Compensation" customStyle={styles.gridItem} theme={palette}>
            <Text style={[styles.bodyText, { color: palette.text }]}>{job.compensation}</Text>
          </DetailCard>
          <DetailCard title="Frequency" customStyle={styles.gridItem} theme={palette}>
            <Text style={[styles.bodyText, { color: palette.text }]}>{job.frequency}</Text>
          </DetailCard>
        </View>

        <DetailCard title="Opportunity Type" theme={palette}>
          <Text style={[styles.bodyText, { color: palette.text }]}>{job.opportunityType}</Text>
        </DetailCard>

        <DetailCard title="Application URL" theme={palette}>
          <Pressable style={styles.urlRow} onPress={() => handleOpenLink(job.applicationUrl)}>
            <Text style={styles.linkIcon}>🔗</Text>
            <Text style={styles.linkText}>{job.applicationUrl}</Text>
          </Pressable>
        </DetailCard>

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
    paddingHorizontal: 20,
  },
  jobHeader: {
    marginTop: 10,
    marginBottom: 20,
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
  statusBanner: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusCheck: {
    fontSize: 16,
    color: BRAND_COLORS.successText,
    marginRight: 8,
    fontWeight: 'bold',
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBannerDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
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
