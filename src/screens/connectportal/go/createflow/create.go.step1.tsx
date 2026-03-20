import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import ImagePickerModal from '@/components/ImagePickerModal';
import { requestExternalWritePermission } from '@/utils/ImageAndCamera';
import { CreateFlowLayout, ensureStepOneDraftRecord, useCreateFlowPalette } from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep1'>;

function BasicInfoScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [heroImageUri, setHeroImageUri] = useState<string | undefined>();
  const [pickerVisible, setPickerVisible] = useState(false);

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
      setHeroImageUri(draft.heroImageUri);
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
        heroImageUri,
      },
      completedStep !== undefined ? { completedStep } : undefined
    );
  };

  const screenWidth = Dimensions.get('screen').width;
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
    setPickerVisible(false);
  };

  const chooseFromGallery = async () => {
    try {
      const result = await ImagePicker.openPicker({
        mediaType: 'photo',
        compressImageQuality: 0.8,
        forceJpg: true,
      });
      await handleImageSelected(result.path);
    } catch {
      setPickerVisible(false);
    }
  };

  const openCamera = async () => {
    if (Platform.OS === 'android') {
      const permitted = await requestExternalWritePermission();
      if (!permitted) {
        setPickerVisible(false);
        return;
      }
    }
    try {
      const result = await ImagePicker.openCamera({
        mediaType: 'photo',
        compressImageQuality: 0.8,
        forceJpg: true,
      });
      await handleImageSelected(result.path);
    } catch {
      setPickerVisible(false);
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
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          Tell people what this event is.
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Start with a clear title and a simple event type so your draft has a strong summary.
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
          placeholder="Enter the name of your event"
          placeholderTextColor={palette.inputPlaceholder}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Event Type</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: palette.inputBg,
              borderColor: palette.inputBorder,
              color: palette.inputText,
            },
          ]}
          value={eventType}
          onChangeText={setEventType}
          placeholder="Worship night, workshop, mixer..."
          placeholderTextColor={palette.inputPlaceholder}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Event Photo</Text>
        <TouchableOpacity
          style={[
            styles.photoCard,
            {
              borderColor: heroImageUri ? palette.cardBorder : palette.dashedBorder,
              backgroundColor: heroImageUri ? palette.cardBg : palette.dashedBg,
              borderStyle: heroImageUri ? 'solid' : 'dashed',
            },
          ]}
          activeOpacity={0.85}
          onPress={() => setPickerVisible(true)}
        >
          {heroImageUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image
                source={{ uri: heroImageUri }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[styles.photoChangeBtn, { backgroundColor: palette.primaryBtnBg }]}
                onPress={() => setPickerVisible(true)}
              >
                <MaterialIcons name="edit" size={16} color={palette.primaryBtnText} />
                <Text style={[styles.photoChangeBtnText, { color: palette.primaryBtnText }]}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="add-a-photo" size={28} color={palette.accent} />
              <Text style={[styles.photoCardTitle, { color: palette.textPrimary }]}>
                Add a hero image
              </Text>
              <Text style={[styles.photoCardBody, { color: palette.textSecondary }]}>
                Tap to choose a photo from your gallery or camera.
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ImagePickerModal
        visible={pickerVisible}
        hideVisible={() => setPickerVisible(false)}
        galleryImage={chooseFromGallery}
        cameraImage={openCamera}
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
    aspectRatio: Dimensions.get('screen').width / 320,
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
