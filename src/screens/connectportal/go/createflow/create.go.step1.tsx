import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { launchImageLibrary, launchCamera as rnLaunchCamera } from 'react-native-image-picker';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  createConnectPortalEditDraftFromPublishedEvent,
  getConnectEventTypeOptions,
  getConnectPortalEventById,
  saveConnectPortalDraft,
  submitConnectEventTypeSuggestion,
} from '@/src/services/connectPortal';
import type { ConnectPlaceFilterOption } from '@/src/services/connectPortal/types';
import { CreateFlowLayout, ensureStepOneDraftRecord, useCreateFlowPalette } from './shared';
import EventTypeDropdown, { OTHER_VALUE } from './EventTypeDropdown';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep1'>;
const STEP_ONE_RESUME_ERROR =
  'This event is no longer available. Open a saved draft from My Events or start again.';

function BasicInfoScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const { width: screenWidth } = useWindowDimensions();
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [publishedEventId, setPublishedEventId] = useState(route.params?.eventId);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [isOtherEventType, setIsOtherEventType] = useState(false);
  const [eventTypeOptions, setEventTypeOptions] = useState<ConnectPlaceFilterOption[]>([]);
  const [heroImageUri, setHeroImageUri] = useState<string | undefined>();
  const trimmedTitle = title.trim();
  const titleError = !loading && !trimmedTitle ? 'Add an event title to continue.' : '';

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      const [record, options] = await Promise.all([
        route.params?.draftId
          ? ensureStepOneDraftRecord(route.params.draftId)
          : route.params?.eventId
            ? getConnectPortalEventById(route.params.eventId)
            : ensureStepOneDraftRecord(undefined),
        getConnectEventTypeOptions(),
      ]);
      if (!isActive) {
        return;
      }

      if (!record || (route.params?.eventId && record.status !== 'published')) {
        navigation.navigate('ConnectGoMyEvents', {
          initialFilter: 'Draft',
          resumeError: STEP_ONE_RESUME_ERROR,
        });
        return;
      }

      setEventTypeOptions(options);
      setDraftId(record.status === 'draft' ? record.id : undefined);
      setPublishedEventId(record.status === 'published' ? record.id : record.publishedEventId);
      setTitle(record.title);
      setEventType(record.eventType);
      setHeroImageUri(record.heroImageUri);

      if (
        record.eventType &&
        options.length > 0 &&
        !options.some((o) => o.value === record.eventType)
      ) {
        setIsOtherEventType(true);
      }

      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  });

  const persistDraft = async (completedStep?: 0 | 1) => {
    let nextDraftId = draftId;

    if (!nextDraftId && publishedEventId) {
      const seededDraft = await createConnectPortalEditDraftFromPublishedEvent(publishedEventId);
      if (!seededDraft) {
        return null;
      }
      nextDraftId = seededDraft.id;
      setDraftId(seededDraft.id);
      setPublishedEventId(seededDraft.publishedEventId || publishedEventId);
    }

    if (!nextDraftId) {
      return null;
    }

    if (isOtherEventType && eventType.trim()) {
      submitConnectEventTypeSuggestion(eventType.trim());
    }

    return saveConnectPortalDraft(
      nextDraftId,
      {
        title,
        eventType,
        category: (eventType || 'EVENT').toUpperCase(),
        heroImageUri,
      },
      completedStep !== undefined ? { completedStep } : undefined
    );
  };

  const cropWidth = screenWidth;
  const cropHeight = 320;

  const handleImageSelected = async (uri: string) => {
    try {
      const cropped = await ImagePicker.openCropper({
        path: uri,
        width: cropWidth,
        height: cropHeight,
        mediaType: 'photo',
        forceJpg: true,
        compressImageQuality: 0.8,
      });
      setHeroImageUri(cropped.path);
    } catch {
      // user cancelled cropper
    }
  };

  const pickImageFromIosLibrary = async () => {
    try {
      const selected = await ImagePicker.openPicker({
        mediaType: 'photo',
        width: cropWidth,
        height: cropHeight,
        cropping: true,
        forceJpg: true,
        compressImageQuality: 0.8,
      });
      setHeroImageUri(selected.path);
    } catch {
      // user cancelled picker/cropper
    }
  };

  const captureImageOnIos = async () => {
    try {
      const captured = await ImagePicker.openCamera({
        mediaType: 'photo',
        width: cropWidth,
        height: cropHeight,
        cropping: true,
        forceJpg: true,
        compressImageQuality: 0.8,
      });
      setHeroImageUri(captured.path);
    } catch {
      // user cancelled camera/cropper
    }
  };

  const chooseFromGallery = async () => {
    if (Platform.OS === 'ios') {
      await pickImageFromIosLibrary();
      return;
    }
    const response = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (response.didCancel || response.errorCode) return;
    const uri = response.assets?.[0]?.uri;
    if (uri) await handleImageSelected(uri);
  };

  const takePhoto = async () => {
    if (Platform.OS === 'ios') {
      await captureImageOnIos();
      return;
    }
    const response = await rnLaunchCamera({ mediaType: 'photo', quality: 0.8 });
    if (response.didCancel || response.errorCode) return;
    const uri = response.assets?.[0]?.uri;
    if (uri) await handleImageSelected(uri);
  };

  const showImageOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Choose From Gallery', 'Open Camera'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) chooseFromGallery();
          else if (index === 2) takePhoto();
        }
      );
    } else {
      Alert.alert('Event Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose From Gallery', onPress: chooseFromGallery },
        { text: 'Open Camera', onPress: takePhoto },
      ]);
    }
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
        const draft = await persistDraft(0);
        if (draft) {
          navigation.navigate('ConnectGoMyEvents', { initialFilter: 'Draft' });
        }
      }}
      saveLabel="Save Draft"
      onNext={async () => {
        if (!trimmedTitle) {
          return;
        }

        const draft = await persistDraft(1);
        if (draft) {
          navigation.navigate('ConnectGoCreateStep2', { draftId: draft.id });
        }
      }}
      nextLabel="Next Step"
      nextDisabled={!trimmedTitle || (!draftId && !publishedEventId)}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          Let&apos;s create your event.
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Start by sharing the basic details of your gathering to help believers in your area find
          and connect with your event.
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Event Title</Text>
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
          placeholder="e.g., Young Adult Worship Night, Fall Retreat"
          placeholderTextColor={palette.inputPlaceholder}
        />
        {titleError ? (
          <Text style={[styles.validationMessage, { color: '#D46A6A' }]}>{titleError}</Text>
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Event Type</Text>
        <EventTypeDropdown
          items={eventTypeOptions.map((o) => ({ label: o.label, value: o.value }))}
          selectedValue={isOtherEventType ? OTHER_VALUE : eventType}
          customValue={isOtherEventType ? eventType : ''}
          onSelect={(value) => {
            if (value === OTHER_VALUE) {
              setIsOtherEventType(true);
              setEventType('');
            } else {
              setIsOtherEventType(false);
              setEventType(value);
            }
          }}
          onCustomChange={setEventType}
          palette={palette}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Event Photo</Text>
        <Pressable
          style={[
            styles.photoCard,
            {
              borderColor: heroImageUri ? palette.cardBorder : palette.dashedBorder,
              backgroundColor: heroImageUri ? palette.cardBg : palette.dashedBg,
              borderStyle: heroImageUri ? 'solid' : 'dashed',
            },
          ]}
          onPress={showImageOptions}
        >
          {heroImageUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image
                source={{ uri: heroImageUri }}
                style={[styles.photoPreview, { aspectRatio: screenWidth / 320 }]}
                resizeMode="cover"
              />
              <Pressable
                style={[styles.photoChangeBtn, { backgroundColor: palette.primaryBtnBg }]}
                onPress={showImageOptions}
              >
                <MaterialIcons name="edit" size={16} color={palette.primaryBtnText} />
                <Text style={[styles.photoChangeBtnText, { color: palette.primaryBtnText }]}>
                  Change
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="add-a-photo" size={28} color={palette.accent} />
              <Text style={[styles.photoCardTitle, { color: palette.textPrimary }]}>
                Add a featured photo
              </Text>
              <Text style={[styles.photoCardBody, { color: palette.textSecondary }]}>
                Tap to upload an image that captures the heart of your event.
              </Text>
            </View>
          )}
        </Pressable>
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
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.15,
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
  },
  validationMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Rubik-Medium',
  },
  photoCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photoPreviewWrap: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
  },
  photoChangeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  photoChangeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  photoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  photoCardBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default BasicInfoScreen;
