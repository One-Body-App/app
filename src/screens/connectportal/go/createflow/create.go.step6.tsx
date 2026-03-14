import React, { useEffect, useState } from 'react';
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
import { CreateFlowLayout, ensureExistingDraftRecord, getReviewBackRouteName } from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep6Review'>;

function ReviewAndConfirmScreen({ navigation, route }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ConnectPortalEventDraft | null>(null);

  useEffect(() => {
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
  }, [navigation, route.params?.draftId]);

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
            <Text style={styles.sectionTitle}>Review your event details.</Text>
            <Text style={styles.sectionBody}>
              This summary becomes the source of truth for organizer screens and the public `Go!`
              event surfaces.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.cardEyebrow}>{draft.category || 'EVENT'}</Text>
            <Text style={styles.cardTitle}>{draft.title || 'Untitled Event'}</Text>
            <Text style={styles.cardBody}>{draft.description || 'No description yet.'}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Schedule</Text>
            <Text style={styles.detailValue}>
              {formatConnectPortalDate(draft.startDate)}
              {draft.startTime ? ` • ${draft.startTime}` : ''}
            </Text>
            {draft.endTime ? <Text style={styles.detailValue}>Ends {draft.endTime}</Text> : null}
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Location</Text>
            <Text style={styles.detailValue}>
              {draft.isOnline ? 'Online Event' : draft.venueName || 'Location TBD'}
            </Text>
            <Text style={styles.detailSubvalue}>
              {draft.address || draft.locationQuery || 'TBD'}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Tickets</Text>
            <Text style={styles.detailValue}>
              {draft.ticketType === 'free' ? 'Free event' : 'Paid event'}
            </Text>
            <Text style={styles.detailSubvalue}>{getEventCapacityLabel(draft)}</Text>
            <Text style={styles.detailSubvalue}>
              {draft.ticketTiers.length} ticket tier{draft.ticketTiers.length === 1 ? '' : 's'}
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
    color: '#032f3c',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4F6D77',
  },
  summaryCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 20,
    gap: 8,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#126b87',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#032f3c',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4F6D77',
  },
  detailCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 18,
    gap: 6,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#126b87',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#032f3c',
  },
  detailSubvalue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4F6D77',
  },
});

export default ReviewAndConfirmScreen;
