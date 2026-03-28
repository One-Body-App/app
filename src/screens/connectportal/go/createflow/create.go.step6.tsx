import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  formatConnectPortalDate,
  getConnectPortalEventById,
  getEventCapacityLabel,
  publishConnectPortalDraft,
} from '@/src/services/connectPortal';
import type { ConnectPortalEventDraft } from '@/src/services/connectPortal';
import {
  CreateFlowLayout,
  ensureExistingDraftRecord,
  getReviewBackRouteName,
  useCreateFlowPalette,
} from './shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep6Review'>;

const getScheduleSummary = (draft: ConnectPortalEventDraft) => {
  const startLine = `${formatConnectPortalDate(draft.startDate)}${
    draft.startTime ? ` • ${draft.startTime}` : ''
  }`;
  const isSingleDay = draft.isSingleDayEvent || !draft.endDate || draft.endDate === draft.startDate;

  if (isSingleDay) {
    return {
      startLine,
      endLine: draft.endTime ? `Ends ${draft.endTime}` : '',
    };
  }

  return {
    startLine,
    endLine: `${formatConnectPortalDate(draft.endDate)}${draft.endTime ? ` • ${draft.endTime}` : ''}`,
  };
};

const getTicketingSummary = (draft: ConnectPortalEventDraft) => {
  if (draft.ticketType === 'external') {
    return {
      title: 'External Link',
      supporting: draft.externalEventUrl || 'Link TBD',
      detail:
        'Attendees will be redirected directly to this event link. No One Body registration flow will appear.',
    };
  }

  if (draft.ticketType === 'paid') {
    return {
      title: 'Legacy paid event',
      supporting: getEventCapacityLabel(draft),
      detail: `${draft.ticketTiers.length} ticket tier${draft.ticketTiers.length === 1 ? '' : 's'}`,
    };
  }

  return {
    title: 'Free event',
    supporting: getEventCapacityLabel(draft),
    detail: `${draft.ticketTiers.length} RSVP tier${draft.ticketTiers.length === 1 ? '' : 's'} in One Body`,
  };
};

function ReviewAndConfirmScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ConnectPortalEventDraft | null>(null);

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      const nextDraft = await ensureExistingDraftRecord(navigation, route.params?.draftId);
      if (!isActive) {
        return;
      }

      if (!nextDraft) {
        return;
      }

      setDraft(nextDraft);
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  });

  const scheduleSummary = draft ? getScheduleSummary(draft) : null;
  const ticketingSummary = draft ? getTicketingSummary(draft) : null;

  return (
    <CreateFlowLayout
      title="Review & Confirm"
      step={6}
      loading={loading}
      onBack={() => {
        if (!draft) {
          navigation.navigate('ConnectGoCreateStep5', { draftId: route.params.draftId });
          return;
        }

        navigation.navigate(getReviewBackRouteName(draft), { draftId: draft.id });
      }}
      onNext={async () => {
        if (!draft) {
          return;
        }

        const publishedEvent = await publishConnectPortalDraft(draft.id);
        if (publishedEvent) {
          navigation.navigate('ConnectGoCreateStep7Success', { draftId: publishedEvent.id });
        } else {
          const latestDraft = await getConnectPortalEventById(route.params.draftId);
          if (latestDraft?.status === 'published') {
            navigation.navigate('ConnectGoCreateStep7Success', { draftId: latestDraft.id });
          }
        }
      }}
      nextLabel="Publish Event"
      nextDisabled={!draft}
    >
      {draft ? (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
              Review your event details.
            </Text>
            <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
              This summary becomes the source of truth for organizer screens and the public `Go!`
              event surfaces.
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.cardEyebrow, { color: palette.accent }]}>
              {draft.category || 'EVENT'}
            </Text>
            <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
              {draft.title || 'Untitled Event'}
            </Text>
            <Text style={[styles.cardBody, { color: palette.textSecondary }]}>
              {draft.description || 'No description yet.'}
            </Text>
          </View>

          <View
            style={[
              styles.detailCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.detailTitle, { color: palette.accent }]}>Schedule</Text>
            <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
              {scheduleSummary?.startLine}
            </Text>
            {scheduleSummary?.endLine ? (
              <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                {scheduleSummary.endLine}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.detailCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.detailTitle, { color: palette.accent }]}>Location</Text>
            <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
              {draft.isOnline ? 'Online Event' : draft.venueName || 'Location TBD'}
            </Text>
            <Text style={[styles.detailSubvalue, { color: palette.textSecondary }]}>
              {draft.isOnline
                ? draft.onlineEventUrl || 'Join link TBD'
                : draft.address || draft.locationQuery || 'TBD'}
            </Text>
          </View>

          <View
            style={[
              styles.detailCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.detailTitle, { color: palette.accent }]}>Registration</Text>
            <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
              {ticketingSummary?.title}
            </Text>
            <Text style={[styles.detailSubvalue, { color: palette.textSecondary }]}>
              {ticketingSummary?.supporting}
            </Text>
            <Text style={[styles.detailSubvalue, { color: palette.textSecondary }]}>
              {ticketingSummary?.detail}
            </Text>
          </View>
        </>
      ) : null}
    </CreateFlowLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  detailTitle: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  detailSubvalue: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ReviewAndConfirmScreen;
