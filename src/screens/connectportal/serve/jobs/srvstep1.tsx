import React, { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import CustomModal from '@/src/components/CustomModal';
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
import { CONNECT_DEFAULT_SERVE_ROLE_OPTIONS } from '@/src/services/connectPortal/defaultServeRoles';
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

const OTHER_ROLE_VALUE = '__other__';

type RolePickerSheetProps = {
  visible: boolean;
  options: SelectOption[];
  selectedValue: string;
  searchText: string;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelect: (value: string) => void;
  palette: ReturnType<typeof useCreateFlowPalette>;
};

function RolePickerSheet({
  visible,
  options,
  selectedValue,
  searchText,
  onClose,
  onSearchChange,
  onSelect,
  palette,
}: RolePickerSheetProps) {
  return (
    <CustomModal
      modalVisible={visible}
      onclose={onClose}
      style={[
        styles.roleSheetModal,
        {
          backgroundColor: palette.cardBg,
        },
      ]}
      avoidKeyboard
    >
      <View style={[styles.roleSheetContent, { backgroundColor: palette.cardBg }]}>
        <View style={styles.roleSheetHandleWrap}>
          <View
            style={[
              styles.roleSheetHandle,
              { backgroundColor: palette.isDark ? '#3a4a50' : '#d1d5db' },
            ]}
          />
        </View>

        <View style={[styles.roleSheetHeader, { borderBottomColor: palette.inputBorder }]}>
          <Text style={[styles.roleSheetTitle, { color: palette.textPrimary }]}>Role</Text>
          <TouchableOpacity
            testID="role-sheet-close"
            onPress={onClose}
            style={[
              styles.roleSheetCloseButton,
              { backgroundColor: palette.isDark ? '#032f3c' : '#f3f4f6' },
            ]}
          >
            <MaterialCommunityIcons name="close" size={20} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.roleSearchWrap,
            {
              backgroundColor: palette.inputBg,
              borderColor: palette.inputBorder,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={palette.inputPlaceholder} />
          <TextInput
            testID="role-search-input"
            style={[styles.roleSearchInput, { color: palette.inputText }]}
            value={searchText}
            onChangeText={onSearchChange}
            placeholder="Search roles"
            placeholderTextColor={palette.inputPlaceholder}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        <ScrollView
          style={styles.roleOptionsScroll}
          contentContainerStyle={styles.roleOptionsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {options.length > 0 ? (
            options.map((option) => {
              const isSelected = option.value === selectedValue;

              return (
                <TouchableOpacity
                  key={option.value}
                  testID={`role-option-${option.value}`}
                  activeOpacity={0.85}
                  style={[
                    styles.roleOptionButton,
                    {
                      backgroundColor: isSelected ? palette.cardActiveBg : 'transparent',
                    },
                  ]}
                  onPress={() => onSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.roleOptionLabel,
                      { color: isSelected ? palette.accent : palette.textPrimary },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <MaterialCommunityIcons name="check" size={18} color={palette.accent} />
                  ) : null}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.roleEmptyState}>
              <Text style={[styles.roleEmptyStateText, { color: palette.textSecondary }]}>
                No roles found.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </CustomModal>
  );
}

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

  if (Platform.OS === 'ios') {
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
  const [selectedRoleValue, setSelectedRoleValue] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [address, setAddress] = useState('');
  const [coordinate, setCoordinate] = useState<Coordinate | undefined>();
  const [addressSuggestion, setAddressSuggestion] = useState<MapSuggestion | null>(null);
  const [addressPickerVisible, setAddressPickerVisible] = useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = useState(false);
  const [roleSearchText, setRoleSearchText] = useState('');

  const roleOptions = useMemo(() => {
    const seenValues = new Set<string>();
    const baseOptions =
      serve.roleTypeOptions && serve.roleTypeOptions.length > 0
        ? serve.roleTypeOptions
        : CONNECT_DEFAULT_SERVE_ROLE_OPTIONS;
    const mergedOptions = baseOptions.filter((option) => {
      const normalizedValue = option.value.trim().toLowerCase();
      if (!normalizedValue || seenValues.has(normalizedValue)) {
        return false;
      }

      seenValues.add(normalizedValue);
      return true;
    });

    return [...mergedOptions, { label: 'Other', value: OTHER_ROLE_VALUE }];
  }, [serve.roleTypeOptions]);

  const filteredRoleOptions = useMemo(() => {
    const normalizedSearch = roleSearchText.trim().toLowerCase();
    if (!normalizedSearch) {
      return roleOptions;
    }

    return roleOptions.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [roleOptions, roleSearchText]);

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      try {
        if (!route.params?.draftId) {
          setLoading(false);
          return;
        }

        const draft = await getConnectServeJobDraftById(route.params.draftId);

        if (!isActive) {
          return;
        }

        if (!draft) {
          Alert.alert(
            'Unable to start opportunity',
            'Please try again in a moment.',
            [{ text: 'OK', onPress: () => navigation.navigate('ConnectServeHome') }],
            { cancelable: false }
          );
          return;
        }

        setDraftId(draft.id);
        setVisibility(draft.visibility);
        const matchingRole = roleOptions.find(
          (option) =>
            option.value !== OTHER_ROLE_VALUE &&
            option.value.trim().toLowerCase() === draft.title.trim().toLowerCase()
        );
        if (matchingRole) {
          setSelectedRoleValue(matchingRole.value);
          setCustomRole('');
        } else if (draft.title.trim()) {
          setSelectedRoleValue(OTHER_ROLE_VALUE);
          setCustomRole(draft.title);
        }
        setTitle(draft.title);
        setDescription(draft.description);
        setRequirementsText(formatConnectServeRequirementsText(draft.requirements));
        setAddress(draft.address);
        setCoordinate(draft.coordinate);
        setAddressSuggestion(createAddressSuggestionFromDraft(draft.address, draft.coordinate));
        setLoading(false);
      } catch {
        if (!isActive) {
          return;
        }

        Alert.alert(
          'Unable to start opportunity',
          'Please try again in a moment.',
          [{ text: 'OK', onPress: () => navigation.navigate('ConnectServeHome') }],
          { cancelable: false }
        );
      }
    })();

    return () => {
      isActive = false;
    };
  });

  const ensureDraftId = async (completedStep: 0 | 1) => {
    if (draftId) {
      return draftId;
    }

    const createdDraft = await createConnectServeJobDraft({
      visibility,
      title,
      description,
      requirements: parseConnectServeRequirements(requirementsText),
      address,
      coordinate,
      locationQuery: address,
      lastCompletedStep: completedStep,
    });

    setDraftId(createdDraft.id);
    return createdDraft.id;
  };

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
    const nextDraftId = await ensureDraftId(completedStep ?? 0);

    return saveConnectServeJobDraft(nextDraftId, {
      visibility,
      title,
      description,
      requirements: parseConnectServeRequirements(requirementsText),
      address,
      coordinate,
      locationQuery: address,
      lastCompletedStep: completedStep,
    });
  };

  const closeRoleSheet = () => {
    setRoleSheetVisible(false);
    setRoleSearchText('');
  };

  const handleRoleSelection = (value: string) => {
    setSelectedRoleValue(value);
    if (value === OTHER_ROLE_VALUE) {
      setTitle(customRole);
      closeRoleSheet();
      return;
    }

    setTitle(value);
    closeRoleSheet();
  };

  const nextDisabled =
    !title.trim() ||
    !description.trim() ||
    parseConnectServeRequirements(requirementsText).length === 0 ||
    !address.trim();

  const isOtherRoleSelected = selectedRoleValue === OTHER_ROLE_VALUE;
  const roleDisplayValue = isOtherRoleSelected ? customRole : title;
  const roleDisplayColor = roleDisplayValue ? palette.inputText : palette.inputPlaceholder;

  return (
    <>
      <CreateFlowLayout
        title="Create an Opportunity"
        step={1}
        totalSteps={2}
        loading={loading}
        onBack={() => navigation.navigate('ConnectServeHome')}
        onSave={async () => {
          try {
            await persistDraft(0);
            await serve.refresh();
            navigation.navigate('ConnectServeHome');
          } catch (error) {
            Alert.alert(
              'Unable to save opportunity',
              error instanceof Error ? error.message : 'Please try again in a moment.'
            );
          }
        }}
        saveLabel="Save Draft"
        onNext={async () => {
          try {
            const draft = await persistDraft(1);
            if (!draft) {
              return;
            }
            await serve.refresh();
            navigation.navigate('ConnectServeCreateJobStep2', { draftId: draft.id });
          } catch (error) {
            Alert.alert(
              'Unable to continue',
              error instanceof Error ? error.message : 'Please try again in a moment.'
            );
          }
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
          <Text style={[styles.label, { color: palette.textPrimary }]}>Role</Text>
          <TouchableOpacity
            testID="role-picker-trigger"
            activeOpacity={0.85}
            style={[
              styles.inputButton,
              { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
            ]}
            onPress={() => setRoleSheetVisible(true)}
          >
            <Text style={[styles.inputButtonText, { color: roleDisplayColor }]}>
              {roleDisplayValue || (isOtherRoleSelected ? 'Enter a custom role' : 'Choose a role')}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>

        {isOtherRoleSelected ? (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>Other Role</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                  color: palette.inputText,
                },
              ]}
              value={customRole}
              onChangeText={(value) => {
                setCustomRole(value);
                setTitle(value);
              }}
              placeholder="Enter the role"
              placeholderTextColor={palette.inputPlaceholder}
            />
          </View>
        ) : null}

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
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            Role & Responsibilities
          </Text>
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

      <RolePickerSheet
        visible={roleSheetVisible}
        options={filteredRoleOptions}
        selectedValue={selectedRoleValue}
        searchText={roleSearchText}
        onClose={closeRoleSheet}
        onSearchChange={setRoleSearchText}
        onSelect={handleRoleSelection}
        palette={palette}
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
  roleSheetModal: {
    justifyContent: 'flex-end',
    margin: 0,
    height: '88%',
    minHeight: 420,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  roleSheetContent: {
    flex: 1,
  },
  roleSheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  roleSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
  roleSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  roleSheetTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
  },
  roleSheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSearchWrap: {
    minHeight: 52,
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    opacity: 0.96,
  },
  roleSearchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
    fontFamily: 'OpenSans-Regular',
  },
  roleOptionsScroll: {
    flex: 1,
    marginTop: 12,
  },
  roleOptionsContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  roleOptionButton: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  roleOptionLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Rubik-Medium',
    paddingRight: 12,
  },
  roleEmptyState: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleEmptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'OpenSans-Regular',
  },
  mapTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
  },
});
