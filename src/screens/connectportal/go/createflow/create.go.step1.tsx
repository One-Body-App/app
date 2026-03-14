import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureStepOneDraftRecord } from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep1'>;

function BasicInfoScreen({ navigation, route }: Props): React.JSX.Element {
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');

  useEffect(() => {
    let isActive = true;

    (async () => {
      const draft = await ensureStepOneDraftRecord(route.params?.draftId);
      if (!isActive) {
        return;
      }

      if (!draft) {
        navigation.navigate('ConnectGoMyEvents', {
          initialFilter: 'Draft',
          resumeError:
            'This draft is no longer available. Open a saved draft from My Events or start again.',
        });
        return;
      }

      setDraftId(draft.id);
      setTitle(draft.title);
      setEventType(draft.eventType);
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, [navigation, route.params?.draftId]);

  const persistDraft = async (completedStep?: 0 | 1) => {
    if (!draftId) {
      return null;
    }

    return saveConnectPortalDraft(
      draftId,
      {
        title,
        eventType,
        category: (eventType || 'EVENT').toUpperCase(),
      },
      completedStep !== undefined ? { completedStep } : undefined
    );
  };

  return (
    <CreateFlowLayout
      title="Basic Info"
      step={1}
      loading={loading}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }
        navigation.navigate('ConnectGoEventDash');
      }}
      onSave={async () => {
        await persistDraft(0);
        navigation.navigate('ConnectGoMyEvents', { initialFilter: 'Draft' });
      }}
      saveLabel="Save Draft"
      onNext={async () => {
        const draft = await persistDraft(1);
        if (draft) {
          navigation.navigate('ConnectGoCreateStep2', { draftId: draft.id });
        }
      }}
      nextLabel="Next Step"
      nextDisabled={!draftId}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tell people what this event is.</Text>
        <Text style={styles.sectionBody}>
          Start with a clear title and a simple event type so your draft has a strong summary.
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter the name of your event"
          placeholderTextColor="#8AA0A8"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Event Type</Text>
        <TextInput
          style={styles.input}
          value={eventType}
          onChangeText={setEventType}
          placeholder="Worship night, workshop, mixer..."
          placeholderTextColor="#8AA0A8"
        />
      </View>

      <TouchableOpacity style={styles.photoCard} activeOpacity={0.85}>
        <Text style={styles.photoCardTitle}>Event Photo</Text>
        <Text style={styles.photoCardBody}>
          Image upload is reserved for a later pass. The draft will keep a placeholder hero for now.
        </Text>
      </TouchableOpacity>
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
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#032f3c',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E1E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#032f3c',
  },
  photoCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9FB6BE',
    backgroundColor: '#FBFDFD',
    padding: 20,
    gap: 8,
  },
  photoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032f3c',
  },
  photoCardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4F6D77',
  },
});

export default BasicInfoScreen;
