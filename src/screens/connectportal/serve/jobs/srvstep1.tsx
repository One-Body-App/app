import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import MapBox, { MapBoxTypes, MapSuggestion } from '@/components/MapBox';
import type { Coordinate } from '@/src/screens/connectportal/data';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  createConnectServeJobDraft,
  formatConnectServeRequirementsText,
  getConnectServeJobDraftById,
  parseConnectServeRequirements,
  saveConnectServeJobDraft,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { CreateFlowLayout, useCreateFlowPalette } from '../../go/createflow/shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeCreateJobStep1'>;

type SelectOption = {
  label: string;
  value: string;
};

const VISIBILITY_OPTIONS: SelectOption[] = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
];

const SECTOR_OPTIONS: SelectOption[] = [
  { label: 'Administration', value: 'Administration' },
  { label: 'Ministry', value: 'Ministry' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Worship', value: 'Worship' },
  { label: 'Media', value: 'Media' },
  { label: 'Education', value: 'Education' },
];

const createAddressSuggestionFromDraft = (
  address: string,
  coordinate?: Coordinate
): MapSuggestion | null => {
  const trimmed = address.trim();
  if (!trimmed) {
    return null;
  }

  const center = coordinate ? [coordinate[0], coordinate[1]] : [0, 0];
  return {
    bbox: [],
    center,
    geometry: {
      type: 'Point',
      coordinates: center,
    },
    id: `serve-job-address-${trimmed}`,
    place_name: trimmed,
    place_type: ['address'],
    properties: {
      wikidata: '',
      short_code: '',
    },
    relevance: 1,
    text: trimmed,
    type: 'Feature',
  };
};

const showOptionPicker = (
  title: string,
  options: SelectOption[],
  onSelect: (value: string) => void
) => {
  if (options.length === 0) {
    return;
  }

  if (ActionSheetIOS?.showActionSheetWithOptions) {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: ['Cancel', ...options.map((option) => option.label)],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex > 0) {
          onSelect(options[buttonIndex - 1].value);
        }
      }
    );
    return;
  }

  Alert.alert(
    title,
    undefined,
    [
      ...options.map((option) => ({
        text: option.label,
        onPress: () => onSelect(option.value),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ],
    { cancelable: true }
  );
};

export default function ServeCreateJobStep1({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const { serve } = useConnectPortalData();
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [sector, setSector] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [address, setAddress] = useState('');
  const [coordinate, setCoordinate] = useState<Coordinate | undefined>();
  const [addressSuggestion, setAddressSuggestion] = useState<MapSuggestion | null>(null);
  const [addressPickerVisible, setAddressPickerVisible] = useState(false);

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      const draft = route.params?.draftId
        ? await getConnectServeJobDraftById(route.params.draftId)
        : await createConnectServeJobDraft();

      if (!isActive) {
        return;
      }

      if (!draft) {
        navigation.navigate('ConnectServeHome');
        return;
      }

      setDraftId(draft.id);
      setVisibility(draft.visibility);
      setSector(draft.sector);
      setTitle(draft.title);
      setDescription(draft.description);
      setRequirementsText(formatConnectServeRequirementsText(draft.requirements));
      setAddress(draft.address);
      setCoordinate(draft.coordinate);
      setAddressSuggestion(createAddressSuggestionFromDraft(draft.address, draft.coordinate));
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  });

  const handleAddressSelection = (value: React.SetStateAction<MapSuggestion | null>) => {
    const nextSuggestion =
      typeof value === 'function' ? value(addressSuggestion) : (value as MapSuggestion | null);

    setAddressSuggestion(nextSuggestion);
    setAddress(nextSuggestion?.place_name || '');

    if (nextSuggestion?.center && nextSuggestion.center.length >= 2) {
      setCoordinate([nextSuggestion.center[0], nextSuggestion.center[1]]);
      return;
    }

    setCoordinate(undefined);
  };

  const persistDraft = async (completedStep?: 0 | 1) => {
    if (!draftId) {
      return null;
    }

    return saveConnectServeJobDraft(draftId, {
      visibility,
      sector,
      title,
      description,
      requirements: parseConnectServeRequirements(requirementsText),
      address,
      coordinate,
      locationQuery: address,
      lastCompletedStep: completedStep,
    });
  };

  const nextDisabled =
    !draftId ||
    !sector.trim() ||
    !title.trim() ||
    !description.trim() ||
    parseConnectServeRequirements(requirementsText).length === 0 ||
    !address.trim();

  return (
    <>
      <CreateFlowLayout
        title="Create Job"
        step={1}
        totalSteps={2}
        loading={loading}
        onBack={() => navigation.navigate('ConnectServeHome')}
        onSave={async () => {
          await persistDraft(0);
          await serve.refresh();
          navigation.navigate('ConnectServeHome');
        }}
        saveLabel="Save Draft"
        onNext={async () => {
          const draft = await persistDraft(1);
          if (!draft) {
            return;
          }
          await serve.refresh();
          navigation.navigate('ConnectServeCreateJobStep2', { draftId: draft.id });
        }}
        nextLabel="Next Step"
        nextDisabled={nextDisabled}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            Share the role your organization needs to fill.
          </Text>
          <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
            Clear details help the right people find the opportunity and respond with confidence.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Visibility</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.inputButton,
              { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
            ]}
            onPress={() =>
              showOptionPicker('Visibility', VISIBILITY_OPTIONS, (value) =>
                setVisibility(value as 'public' | 'private')
              )
            }
          >
            <Text style={[styles.inputButtonText, { color: palette.inputText }]}>
              {VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.label || 'Public'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Sector</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.inputButton,
              { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
            ]}
            onPress={() => showOptionPicker('Sector', SECTOR_OPTIONS, setSector)}
          >
            <Text
              style={[
                styles.inputButtonText,
                { color: sector ? palette.inputText : palette.inputPlaceholder },
              ]}
            >
              {sector || 'Choose a sector'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Job Title</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter the role title"
            placeholderTextColor={palette.inputPlaceholder}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Description</Text>
          <TextInput
            style={[
              styles.textarea,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Summarize the responsibilities and who this role is for"
            placeholderTextColor={palette.inputPlaceholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Requirements</Text>
          <TextInput
            style={[
              styles.textarea,
              styles.requirementsInput,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={requirementsText}
            onChangeText={setRequirementsText}
            placeholder="Enter one requirement per line"
            placeholderTextColor={palette.inputPlaceholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.helperText, { color: palette.textSecondary }]}>
            One requirement per line. Bullets are optional.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Location</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.inputButton,
              { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
            ]}
            onPress={() => setAddressPickerVisible(true)}
          >
            <Text
              style={[
                styles.inputButtonText,
                { color: address ? palette.inputText : palette.inputPlaceholder },
              ]}
              numberOfLines={1}
            >
              {address || 'Search for an address'}
            </Text>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={20}
              color={palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>
      </CreateFlowLayout>

      <MapBox
        location={addressSuggestion}
        modalVisible={addressPickerVisible}
        setModalVisible={setAddressPickerVisible}
        setLocation={handleAddressSelection}
        types={[MapBoxTypes.address, MapBoxTypes.place, MapBoxTypes.locality]}
        modalTitle={<Text style={[styles.mapTitle, { color: palette.textPrimary }]}>Location</Text>}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'OpenSans-Regular',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Rubik-Medium',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
  },
  textarea: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'OpenSans-Regular',
  },
  requirementsInput: {
    minHeight: 160,
  },
  inputButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputButtonText: {
    flex: 1,
    fontSize: 15,
    paddingRight: 12,
    fontFamily: 'OpenSans-Regular',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'OpenSans-Regular',
  },
  mapTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
  },
});
