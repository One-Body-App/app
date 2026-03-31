import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { format, isValid, parse, parseISO } from 'date-fns';
import type { StackScreenProps } from '@react-navigation/stack';
import MapBox, { MapBoxTypes, MapSuggestion } from '@/components/MapBox';
import type { Coordinate } from '@/src/screens/connectportal/data';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import type {
  ConnectPortalRecurrenceEndType,
  ConnectPortalRecurrenceFrequency,
} from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureExistingDraftRecord, useCreateFlowPalette } from './shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep2'>;

type PickerField = 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'recurrenceEndDate';

const formatStoredDate = (value: Date) => format(value, 'yyyy-MM-dd');

const formatDisplayedDate = (value: string) => {
  if (!value) {
    return '';
  }

  try {
    return format(parseISO(`${value}T12:00:00`), 'MM/dd/yy');
  } catch {
    return value;
  }
};

const parseStoredDate = (value: string) => {
  if (!value) {
    return new Date();
  }

  const parsed = parseISO(`${value}T12:00:00`);
  return isValid(parsed) ? parsed : new Date();
};

const formatStoredTime = (value: Date) => format(value, 'h:mm a');

const parseStoredTime = (value: string) => {
  if (!value) {
    return new Date();
  }

  const parsed = parse(value, 'h:mm a', new Date());
  return isValid(parsed) ? parsed : new Date();
};

const isValidOnlineEventUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

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
    id: `draft-address-${trimmed}`,
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

function DateLocationScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSingleDayEvent, setIsSingleDayEvent] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerField | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineEventUrl, setOnlineEventUrl] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [addressPickerVisible, setAddressPickerVisible] = useState(false);
  const [coordinate, setCoordinate] = useState<Coordinate | undefined>();
  const [addressSuggestion, setAddressSuggestion] = useState<MapSuggestion | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<
    ConnectPortalRecurrenceFrequency | undefined
  >();
  const [recurrenceEndType, setRecurrenceEndType] = useState<
    ConnectPortalRecurrenceEndType | undefined
  >();
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceOccurrenceCount, setRecurrenceOccurrenceCount] = useState('');

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      const draft = await ensureExistingDraftRecord(navigation, route.params?.draftId);
      if (!isActive) {
        return;
      }

      if (!draft) {
        return;
      }

      const hydratedSingleDay =
        draft.isSingleDayEvent ||
        (Boolean(draft.startDate) &&
          (draft.endDate || draft.startDate || '') === (draft.startDate || ''));

      setDraftId(draft.id);
      setStartDate(draft.startDate);
      setEndDate(draft.endDate || draft.startDate);
      setStartTime(draft.startTime);
      setEndTime(draft.endTime);
      setIsSingleDayEvent(hydratedSingleDay);
      setIsOnline(draft.isOnline);
      setOnlineEventUrl(draft.onlineEventUrl || '');
      setVenueName(draft.venueName);
      setAddress(draft.address);
      setCoordinate(draft.coordinate);
      setAddressSuggestion(createAddressSuggestionFromDraft(draft.address, draft.coordinate));
      setIsRecurring(draft.isRecurring || false);
      setRecurrenceFrequency(draft.recurrenceFrequency);
      setRecurrenceEndType(draft.recurrenceEndType);
      setRecurrenceEndDate(draft.recurrenceEndDate || '');
      setRecurrenceOccurrenceCount(draft.recurrenceOccurrenceCount || '');
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

  const persistDraft = async (completedStep?: 1 | 2) => {
    if (!draftId) {
      return null;
    }

    const nextVenueName = isOnline ? 'Online Event' : venueName.trim();
    const nextAddress = isOnline ? 'Online' : address.trim();
    const nextLocationQuery = isOnline
      ? onlineEventUrl.trim()
      : [venueName.trim(), address.trim()].filter(Boolean).join(', ');

    return saveConnectPortalDraft(
      draftId,
      {
        startDate,
        endDate: isSingleDayEvent ? startDate : endDate || startDate,
        startTime,
        endTime,
        isSingleDayEvent,
        isOnline,
        onlineEventUrl: onlineEventUrl.trim(),
        venueName: nextVenueName,
        address: nextAddress,
        coordinate: isOnline ? undefined : coordinate,
        locationQuery: nextLocationQuery,
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
        recurrenceEndType: isRecurring ? recurrenceEndType : undefined,
        recurrenceEndDate:
          isRecurring && recurrenceEndType === 'on_date' ? recurrenceEndDate : undefined,
        recurrenceOccurrenceCount:
          isRecurring && recurrenceEndType === 'after_occurrences'
            ? recurrenceOccurrenceCount
            : undefined,
      },
      completedStep !== undefined ? { completedStep } : undefined
    );
  };

  const handleDateConfirm = (value: Date) => {
    const nextDate = formatStoredDate(value);

    if (activePicker === 'startDate') {
      setStartDate(nextDate);

      if (isSingleDayEvent || !endDate || endDate < nextDate) {
        setEndDate(nextDate);
      }
    }

    if (activePicker === 'endDate') {
      setEndDate(nextDate);
    }

    if (activePicker === 'recurrenceEndDate') {
      setRecurrenceEndDate(nextDate);
    }

    if (activePicker === 'startTime') {
      setStartTime(formatStoredTime(value));
    }

    if (activePicker === 'endTime') {
      setEndTime(formatStoredTime(value));
    }

    setActivePicker(null);
  };

  const toggleSingleDayEvent = () => {
    const nextValue = !isSingleDayEvent;
    setIsSingleDayEvent(nextValue);

    if (nextValue) {
      setEndDate(startDate);
    }
  };

  const recurringIncomplete =
    isRecurring &&
    (!recurrenceFrequency ||
      !recurrenceEndType ||
      (recurrenceEndType === 'on_date' && !recurrenceEndDate) ||
      (recurrenceEndType === 'after_occurrences' &&
        (!recurrenceOccurrenceCount || Number(recurrenceOccurrenceCount) < 1)));

  const nextDisabled =
    !draftId ||
    !startDate ||
    !startTime ||
    !endTime ||
    (!isSingleDayEvent && !endDate) ||
    (isOnline ? !isValidOnlineEventUrl(onlineEventUrl) : !venueName.trim() || !address.trim()) ||
    recurringIncomplete;

  const handleNext = async () => {
    if (isOnline && !isValidOnlineEventUrl(onlineEventUrl)) {
      Alert.alert('Add a valid event URL', 'Enter an `http://` or `https://` link for the event.');
      return;
    }

    const draft = await persistDraft(2);
    if (draft) {
      navigation.navigate('ConnectGoCreateStep3', { draftId: draft.id });
    }
  };

  let pickerDate = parseStoredTime(endTime);
  if (activePicker === 'startDate') {
    pickerDate = parseStoredDate(startDate);
  } else if (activePicker === 'endDate') {
    pickerDate = parseStoredDate(endDate || startDate);
  } else if (activePicker === 'recurrenceEndDate') {
    pickerDate = parseStoredDate(recurrenceEndDate || startDate);
  } else if (activePicker === 'startTime') {
    pickerDate = parseStoredTime(startTime);
  }

  const pickerMode =
    activePicker === 'startDate' ||
    activePicker === 'endDate' ||
    activePicker === 'recurrenceEndDate'
      ? 'date'
      : 'time';
  let endDateTextColor = palette.inputPlaceholder;
  if (endDate) {
    endDateTextColor = isSingleDayEvent ? palette.textMuted : palette.inputText;
  }

  return (
    <CreateFlowLayout
      title="Date & Location"
      step={2}
      loading={loading}
      onBack={async () => {
        await persistDraft(1);
        navigation.navigate('ConnectGoCreateStep1', { draftId: draftId || route.params.draftId });
      }}
      onNext={handleNext}
      nextDisabled={nextDisabled}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          When and where are we gathering?
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Let people know exactly when and where to join the fellowship. Whether it&apos;s in person
          or online, every detail helps believers connect.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Start Date</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.inputButton,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
              },
            ]}
            onPress={() => setActivePicker('startDate')}
          >
            <Text
              style={[
                styles.inputButtonText,
                { color: startDate ? palette.inputText : palette.inputPlaceholder },
              ]}
            >
              {startDate ? formatDisplayedDate(startDate) : 'MM/DD/YY'}
            </Text>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={20}
              color={palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldHalf}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>End Date</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={toggleSingleDayEvent}
              style={styles.checkboxRow}
            >
              <MaterialCommunityIcons
                name={isSingleDayEvent ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                color={isSingleDayEvent ? palette.accent : palette.inputPlaceholder}
              />
              <Text style={[styles.checkboxLabel, { color: palette.textSecondary }]}>
                1 day event
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSingleDayEvent}
            style={[
              styles.inputButton,
              {
                backgroundColor: isSingleDayEvent ? palette.disabledInputBg : palette.inputBg,
                borderColor: palette.inputBorder,
              },
            ]}
            onPress={() => setActivePicker('endDate')}
          >
            <Text style={[styles.inputButtonText, { color: endDateTextColor }]}>
              {endDate ? formatDisplayedDate(endDate) : 'MM/DD/YY'}
            </Text>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={20}
              color={isSingleDayEvent ? palette.textMuted : palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Start Time</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.inputButton,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
              },
            ]}
            onPress={() => setActivePicker('startTime')}
          >
            <Text
              style={[
                styles.inputButtonText,
                { color: startTime ? palette.inputText : palette.inputPlaceholder },
              ]}
            >
              {startTime || 'e.g., 7:00 PM'}
            </Text>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>End Time</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.inputButton,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
              },
            ]}
            onPress={() => setActivePicker('endTime')}
          >
            <Text
              style={[
                styles.inputButtonText,
                { color: endTime ? palette.inputText : palette.inputPlaceholder },
              ]}
            >
              {endTime || 'e.g., 9:00 PM'}
            </Text>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.toggleRow,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        <View style={styles.toggleCopy}>
          <Text style={[styles.toggleTitle, { color: palette.textPrimary }]}>Online Event</Text>
          <Text style={[styles.toggleBody, { color: palette.textSecondary }]}>
            Hosting a digital fellowship? Turn this on to let the community know they can join from
            anywhere.
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: palette.inputBorder, true: palette.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {isOnline ? (
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Event URL</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={onlineEventUrl}
            onChangeText={setOnlineEventUrl}
            placeholder="https://example.com/join"
            placeholderTextColor={palette.inputPlaceholder}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ) : (
        <>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>Venue Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                  color: palette.inputText,
                },
              ]}
              value={venueName}
              onChangeText={setVenueName}
              placeholder="e.g., Grace Church Fellowship Hall"
              placeholderTextColor={palette.inputPlaceholder}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>Address</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.inputButton,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                },
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
                {address || 'e.g., 123 Main St, Atlanta, GA'}
              </Text>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={20}
                color={palette.inputPlaceholder}
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      <View
        style={[
          styles.toggleRow,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        <View style={styles.toggleCopy}>
          <Text style={[styles.toggleTitle, { color: palette.textPrimary }]}>Recurring Event</Text>
          <Text style={[styles.toggleBody, { color: palette.textSecondary }]}>
            Will this gathering happen on a regular schedule? Turn this on to set the frequency and
            end date for the series.
          </Text>
        </View>
        <Switch
          value={isRecurring}
          onValueChange={(next) => {
            setIsRecurring(next);
            if (!next) {
              setRecurrenceFrequency(undefined);
              setRecurrenceEndType(undefined);
              setRecurrenceEndDate('');
              setRecurrenceOccurrenceCount('');
            }
          }}
          trackColor={{ false: palette.inputBorder, true: palette.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {isRecurring && (
        <>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>Frequency</Text>
            <View style={styles.frequencyGrid}>
              {(
                [
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'biweekly', label: 'Bi-weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ] as { value: ConnectPortalRecurrenceFrequency; label: string }[]
              ).map((option) => {
                const isSelected = recurrenceFrequency === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.85}
                    style={[
                      styles.frequencyChip,
                      {
                        backgroundColor: isSelected ? palette.cardActiveBg : palette.inputBg,
                        borderColor: isSelected ? palette.cardActiveBorder : palette.inputBorder,
                      },
                    ]}
                    onPress={() => setRecurrenceFrequency(option.value)}
                  >
                    <Text
                      style={[
                        styles.frequencyChipText,
                        { color: isSelected ? palette.accent : palette.textSecondary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>Series Ends</Text>
            <View style={styles.endConditionRow}>
              {(
                [
                  { value: 'on_date', label: 'On a date' },
                  { value: 'after_occurrences', label: 'After occurrences' },
                ] as { value: ConnectPortalRecurrenceEndType; label: string }[]
              ).map((option) => {
                const isSelected = recurrenceEndType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.85}
                    style={[
                      styles.endConditionOption,
                      {
                        backgroundColor: isSelected ? palette.cardActiveBg : palette.inputBg,
                        borderColor: isSelected ? palette.cardActiveBorder : palette.inputBorder,
                      },
                    ]}
                    onPress={() => setRecurrenceEndType(option.value)}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: isSelected ? palette.radioActiveBorder : palette.radioBorder,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[styles.radioInner, { backgroundColor: palette.radioActiveBg }]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.endConditionLabel,
                        { color: isSelected ? palette.accent : palette.textSecondary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {recurrenceEndType === 'on_date' && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: palette.textPrimary }]}>End Date</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.inputButton,
                  {
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                  },
                ]}
                onPress={() => setActivePicker('recurrenceEndDate')}
              >
                <Text
                  style={[
                    styles.inputButtonText,
                    {
                      color: recurrenceEndDate ? palette.inputText : palette.inputPlaceholder,
                    },
                  ]}
                >
                  {recurrenceEndDate ? formatDisplayedDate(recurrenceEndDate) : 'MM/DD/YY'}
                </Text>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={20}
                  color={palette.inputPlaceholder}
                />
              </TouchableOpacity>
            </View>
          )}

          {recurrenceEndType === 'after_occurrences' && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: palette.textPrimary }]}>
                Number of Occurrences
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    color: palette.inputText,
                  },
                ]}
                value={recurrenceOccurrenceCount}
                onChangeText={setRecurrenceOccurrenceCount}
                placeholder="e.g., 12"
                placeholderTextColor={palette.inputPlaceholder}
                keyboardType="number-pad"
              />
            </View>
          )}
        </>
      )}

      <MapBox
        location={addressSuggestion}
        modalVisible={addressPickerVisible}
        setModalVisible={setAddressPickerVisible}
        setLocation={handleAddressSelection}
        modalTitle={<Text style={[styles.mapTitle, { color: palette.textPrimary }]}>Address</Text>}
        types={[MapBoxTypes.address, MapBoxTypes.poi, MapBoxTypes.place]}
      />

      <DatePicker
        modal
        open={activePicker !== null}
        date={pickerDate}
        mode={pickerMode}
        androidVariant="nativeAndroid"
        minimumDate={
          (activePicker === 'endDate' || activePicker === 'recurrenceEndDate') && startDate
            ? parseStoredDate(startDate)
            : undefined
        }
        onConfirm={handleDateConfirm}
        onCancel={() => setActivePicker(null)}
      />
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
    gap: 8,
  },
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.15,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  checkboxLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'OpenSans-SemiBold',
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
  },
  inputButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  inputButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyChip: {
    flex: 1,
    minWidth: '45%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  frequencyChipText: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
  },
  endConditionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  endConditionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  endConditionLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'OpenSans-SemiBold',
  },
});

export default DateLocationScreen;
