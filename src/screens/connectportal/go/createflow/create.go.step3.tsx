import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureExistingDraftRecord, useCreateFlowPalette } from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep3'>;

function DetailsAndCapacityScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');

  useEffect(() => {
    let isActive = true;

    (async () => {
      const draft = await ensureExistingDraftRecord(navigation, route.params?.draftId);
      if (!isActive) {
        return;
      }

      if (!draft) {
        return;
      }

      setDraftId(draft.id);
      setDescription(draft.description);
      setCapacity(draft.capacity);
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, [navigation, route.params?.draftId]);

  const persistDraft = async (completedStep?: 2 | 3) => {
    if (!draftId) {
      return null;
    }

    return saveConnectPortalDraft(
      draftId,
      {
        description,
        capacity,
      },
      completedStep !== undefined ? { completedStep } : undefined
    );
  };

  return (
    <CreateFlowLayout
      title="Details & Capacity"
      step={3}
      loading={loading}
      onBack={async () => {
        await persistDraft(2);
        navigation.navigate('ConnectGoCreateStep2', { draftId: draftId || route.params.draftId });
      }}
      onNext={async () => {
        const draft = await persistDraft(3);
        if (draft) {
          navigation.navigate('ConnectGoCreateStep4', { draftId: draft.id });
        }
      }}
      nextDisabled={!draftId}
      nextLabel="Continue"
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          What should people expect?
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Add the narrative that will also power the public event view and organizer summary cards.
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Event Description</Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: palette.inputBg,
              borderColor: palette.inputBorder,
              color: palette.inputText,
            },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the event, agenda, what to bring, and who this is for."
          placeholderTextColor={palette.inputPlaceholder}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Capacity</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: palette.inputBg,
              borderColor: palette.inputBorder,
              color: palette.inputText,
            },
          ]}
          value={capacity}
          onChangeText={setCapacity}
          placeholder="150"
          placeholderTextColor={palette.inputPlaceholder}
          keyboardType="number-pad"
        />
        <Text style={[styles.helperText, { color: palette.textMuted }]}>
          Leave blank if registration should stay open-ended.
        </Text>
      </View>
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
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 170,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 16,
    lineHeight: 22,
  },
  helperText: {
    fontSize: 13,
  },
});

export default DetailsAndCapacityScreen;
