import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { launchCamera } from 'react-native-image-picker';
import ImagePicker from 'react-native-image-crop-picker';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import type { StackScreenProps } from '@react-navigation/stack';
import StyledText from '@/components/styled/Text';
import useMountEffect from '@/src/hooks/useMountEffect';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { creatorBlogService, type CreatorBlogDraftInput } from '@/src/services/creatorBlogs';
import {
  countWords,
  estimateReadTimeMinutes,
  validateCreatorBlog,
} from '@/src/services/creatorBlogs/markdown';
import type { CreatorBlogInlineFormat } from '@/src/services/creatorBlogs/types';
import isCreatorBlogEligible from '@/src/utils/creatorBlogAccess';
import { requestExternalWritePermission } from '@/utils/ImageAndCamera';

type Props = StackScreenProps<MainStackParamList, 'BlogComposer'>;
type BlogComposerIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TAG_OPTIONS = [
  'Faith',
  'Prayer',
  'Discipleship',
  'Leadership',
  'Church',
  'Testimony',
  'Community',
  'Devotional',
];

const EMPTY_ERRORS = {
  title: '',
  subtitle: '',
  coverImage: '',
  tags: '',
  body: '',
};

function ToolbarButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: BlogComposerIconName;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minWidth: 44,
        height: 42,
        paddingHorizontal: spacing.x10,
        borderRadius: borderRadius.base,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? 'rgba(18,107,135,0.12)' : 'transparent',
      }}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={active ? Colors.primarySapphire.brand : colors.text}
        />
      ) : (
        <StyledText
          style={{
            color: active ? Colors.primarySapphire.brand : colors.text,
            fontFamily: 'Rubik-Medium',
            fontSize: 13,
          }}
        >
          {label}
        </StyledText>
      )}
    </TouchableOpacity>
  );
}

const getSelectionRange = (selection: { start: number; end: number }) => {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  return { start, end };
};

export default function BlogComposer({ navigation, route }: Props) {
  const { colors, dark } = useTheme();
  const toast = useToast();
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const eligible = isCreatorBlogEligible(currentUser as any);
  const bodyInputRef = useRef<TextInput>(null);
  const bypassUnsavedPromptRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [blogId, setBlogId] = useState(route.params?.blogId);
  const [isHydrating, setIsHydrating] = useState(Boolean(route.params?.blogId));
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeFormat, setActiveFormat] = useState<CreatorBlogInlineFormat | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [validationErrors, setValidationErrors] = useState(EMPTY_ERRORS);

  const syncValidationErrors = useCallback((input: CreatorBlogDraftInput) => {
    const nextErrors = validateCreatorBlog(input);
    setValidationErrors({
      title: nextErrors.title || '',
      subtitle: nextErrors.subtitle || '',
      coverImage: nextErrors.coverImage || '',
      tags: nextErrors.tags || '',
      body: nextErrors.body || '',
    });
    return nextErrors;
  }, []);

  const wordCount = useMemo(() => countWords(body), [body]);
  const estimatedReadTime = useMemo(() => estimateReadTimeMinutes(body), [body]);
  const hasUnsavedChanges = saveState === 'dirty' || saveState === 'error';

  const publishState = useMemo(() => {
    const errors = validateCreatorBlog({ title, subtitle, coverImage, tags, body });
    if (status === 'published') {
      return 'published' as const;
    }
    return Object.keys(errors).length > 0 ? ('invalid' as const) : ('ready' as const);
  }, [body, coverImage, status, subtitle, tags, title]);

  const editorInput: CreatorBlogDraftInput = useMemo(
    () => ({
      id: blogId,
      title,
      subtitle,
      coverImage,
      tags,
      body,
      status,
    }),
    [blogId, title, subtitle, coverImage, tags, body, status]
  );

  const markDirty = useCallback(() => {
    setSaveState((current) => (current === 'saving' ? current : 'dirty'));
  }, []);

  const statusLabel = useMemo(() => {
    if (status === 'published') {
      return 'Published';
    }
    if (status === 'archived') {
      return 'Archived';
    }
    return 'Draft';
  }, [status]);

  const saveLabel = useMemo(() => {
    if (saveState === 'saving') {
      return 'Saving...';
    }
    if (saveState === 'error') {
      return 'Save failed';
    }
    if (saveState === 'dirty') {
      return 'Unsaved changes';
    }
    if (lastSavedAt) {
      return `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }
    return 'Saved';
  }, [lastSavedAt, saveState]);

  const publishButtonLabel = useMemo(() => {
    if (status === 'published') {
      return 'Update article';
    }
    if (publishState === 'invalid') {
      return 'Complete details';
    }
    return 'Publish';
  }, [publishState, status]);

  const publishButtonColor = useMemo(() => {
    if (publishState === 'invalid') {
      return Colors.neutral[600];
    }
    return status === 'published' ? Colors.primary.brand : Colors.primarySapphire.brand;
  }, [publishState, status]);

  const closeComposer = useCallback(() => {
    bypassUnsavedPromptRef.current = true;
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('MainRoot', {
      screen: 'Main',
      params: {
        screen: 'HomeTab',
        params: {
          screen: 'Home',
        },
      },
    } as any);
  }, [navigation]);

  const saveDraft = useCallback(async () => {
    if (!currentUser) {
      return null;
    }

    try {
      setSaveState('saving');
      const saved = await creatorBlogService.saveDraft(currentUser, editorInput);
      setBlogId(saved.id);
      setStatus(saved.status);
      setLastSavedAt(saved.updatedAt);
      setSaveState('saved');
      return saved;
    } catch {
      setSaveState('error');
      toast.show('Unable to save your draft right now.', {
        type: 'danger',
        placement: 'bottom',
      });
      return null;
    }
  }, [currentUser, editorInput, toast]);

  const handlePublish = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    const nextErrors = syncValidationErrors(editorInput);
    if (Object.keys(nextErrors).length > 0) {
      toast.show('Complete the required article details before publishing.', {
        type: 'danger',
        placement: 'bottom',
      });
      return;
    }

    setSaveState('saving');
    const published = await creatorBlogService.publishBlog(currentUser, editorInput);
    if (!published.blog) {
      setSaveState('error');
      setValidationErrors({
        title: published.validationErrors.title || '',
        subtitle: published.validationErrors.subtitle || '',
        coverImage: published.validationErrors.coverImage || '',
        tags: published.validationErrors.tags || '',
        body: published.validationErrors.body || '',
      });
      return;
    }

    setBlogId(published.blog.id);
    setStatus('published');
    setLastSavedAt(published.blog.updatedAt);
    setSaveState('saved');
    toast.show('Article published.', {
      type: 'success',
      placement: 'bottom',
    });
  }, [currentUser, editorInput, syncValidationErrors, toast]);

  const applyFormat = useCallback(
    (format: CreatorBlogInlineFormat) => {
      setActiveFormat(format);
      setBody((previous) => {
        const range = getSelectionRange(selection);
        const selected = previous.slice(range.start, range.end);
        const before = previous.slice(0, range.start);
        const after = previous.slice(range.end);

        const wrap = (prefix: string, suffix = prefix, placeholder = '') => {
          const inserted = `${prefix}${selected || placeholder}${suffix}`;
          return `${before}${inserted}${after}`;
        };

        if (format === 'heading1') {
          return `${before}${selected ? `# ${selected}` : '# Heading'}${after}`;
        }
        if (format === 'heading2') {
          return `${before}${selected ? `## ${selected}` : '## Heading'}${after}`;
        }
        if (format === 'bold') {
          return wrap('**', '**', 'bold text');
        }
        if (format === 'italic') {
          return wrap('_', '_', 'italic text');
        }
        if (format === 'underline') {
          return wrap('<u>', '</u>', 'underlined text');
        }
        if (format === 'bulleted') {
          return `${before}${selected ? `- ${selected}` : '- List item'}${after}`;
        }
        if (format === 'numbered') {
          return `${before}${selected ? `1. ${selected}` : '1. List item'}${after}`;
        }
        if (format === 'quote') {
          return `${before}${selected ? `> ${selected}` : '> Quoted text'}${after}`;
        }
        if (format === 'link') {
          return wrap('[', '](https://example.com)', 'Link text');
        }
        if (format === 'image') {
          return `${before}![Image](https://example.com/image.jpg)${after}`;
        }
        if (format === 'divider') {
          return `${before}\n---\n${after}`;
        }
        return previous;
      });
      markDirty();
      requestAnimationFrame(() => bodyInputRef.current?.focus());
    },
    [markDirty, selection]
  );

  const handleTagToggle = useCallback(
    (tag: string) => {
      setTags((current) => {
        if (current.includes(tag)) {
          return current.filter((item) => item !== tag);
        }
        if (current.length >= 5) {
          toast.show('You can add up to five tags.', {
            type: 'danger',
            placement: 'bottom',
          });
          return current;
        }
        return [...current, tag];
      });
      markDirty();
    },
    [markDirty, toast]
  );

  const handleCoverImage = useCallback(async () => {
    const chooseFromLibrary = async () => {
      const selectionResult = await ImagePicker.openPicker({
        mediaType: 'photo',
        forceJpg: true,
      }).catch(() => null);

      if (!selectionResult || Array.isArray(selectionResult) || !selectionResult.path) {
        return;
      }

      const nextUri = selectionResult.path.startsWith('file://')
        ? selectionResult.path
        : `file://${selectionResult.path}`;
      setCoverImage(nextUri);
      markDirty();
    };

    const openCamera = async () => {
      const hasPermission = await requestExternalWritePermission();
      if (!hasPermission) {
        return;
      }
      const result = await launchCamera({ mediaType: 'photo', quality: 1 });
      const nextUri = result.assets?.[0]?.uri;
      if (!nextUri) {
        return;
      }
      setCoverImage(nextUri);
      markDirty();
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Gallery', 'Use Camera', 'Remove Image'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: coverImage ? 3 : undefined,
        },
        (index) => {
          if (index === 1) {
            chooseFromLibrary().catch(() => undefined);
          }
          if (index === 2) {
            openCamera().catch(() => undefined);
          }
          if (index === 3) {
            setCoverImage(null);
            markDirty();
          }
        }
      );
      return;
    }

    Alert.alert('Cover image', 'Choose how to set your cover image.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose from Gallery', onPress: () => chooseFromLibrary().catch(() => undefined) },
      { text: 'Use Camera', onPress: () => openCamera().catch(() => undefined) },
      ...(coverImage
        ? [
            {
              text: 'Remove Image',
              style: 'destructive' as const,
              onPress: () => {
                setCoverImage(null);
                markDirty();
              },
            },
          ]
        : []),
    ]);
  }, [coverImage, markDirty]);

  const handleImportText = useCallback(async () => {
    try {
      const selectionResult = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.plainText],
        copyTo: 'cachesDirectory',
        mode: 'import',
      });
      const uri = selectionResult.fileCopyUri || selectionResult.uri;
      if (!uri) {
        return;
      }
      const normalizedPath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      const imported = await RNFS.readFile(normalizedPath, 'utf8');
      if (!imported.trim()) {
        return;
      }
      setBody((current) => `${current.trim() ? `${current.trim()}\n\n` : ''}${imported.trim()}`);
      markDirty();
      toast.show('Text imported into your draft.', {
        type: 'success',
        placement: 'bottom',
      });
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return;
      }
      toast.show('Unable to import text right now.', {
        type: 'danger',
        placement: 'bottom',
      });
    }
  }, [markDirty, toast]);

  const openMenu = useCallback(() => {
    const openPreview = async () => {
      const saved = blogId ? await saveDraft() : await saveDraft();
      if (!saved?.id) {
        return;
      }
      navigation.navigate('SingleRss', { postId: saved.id });
    };

    const goToDashboard = () => navigation.navigate('CreatorBlogDashboard');
    const archiveCurrent = async () => {
      if (!blogId) {
        return;
      }
      await creatorBlogService.archiveBlog(blogId);
      setStatus('archived');
      setLastSavedAt(new Date().toISOString());
      setSaveState('saved');
    };
    const deleteCurrent = async () => {
      if (!blogId) {
        closeComposer();
        return;
      }
      await creatorBlogService.deleteDraft(blogId);
      closeComposer();
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            'Cancel',
            'Preview',
            'Manage Blogs',
            status === 'published' ? 'Archive' : 'Delete Draft',
          ],
          cancelButtonIndex: 0,
          destructiveButtonIndex: status === 'published' ? undefined : 3,
        },
        (index) => {
          if (index === 1) openPreview().catch(() => undefined);
          if (index === 2) goToDashboard();
          if (index === 3) {
            if (status === 'published') {
              archiveCurrent().catch(() => undefined);
            } else {
              deleteCurrent().catch(() => undefined);
            }
          }
        }
      );
      return;
    }

    Alert.alert('Article actions', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Preview', onPress: () => openPreview().catch(() => undefined) },
      { text: 'Manage Blogs', onPress: goToDashboard },
      status === 'published'
        ? { text: 'Archive', onPress: () => archiveCurrent().catch(() => undefined) }
        : {
            text: 'Delete Draft',
            style: 'destructive',
            onPress: () => deleteCurrent().catch(() => undefined),
          },
    ]);
  }, [blogId, closeComposer, navigation, saveDraft, status]);

  useMountEffect(() => {
    if (!route.params?.blogId) {
      return;
    }

    creatorBlogService
      .getBlogById(route.params.blogId)
      .then((blog) => {
        if (!blog) {
          return;
        }

        setBlogId(blog.id);
        setTitle(blog.title);
        setSubtitle(blog.subtitle);
        setCoverImage(blog.coverImage);
        setTags(blog.tags);
        setBody(blog.body);
        setStatus(blog.status);
        setLastSavedAt(blog.updatedAt);
      })
      .finally(() => setIsHydrating(false));
  });

  useMountEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  });

  useLayoutEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!hasUnsavedChanges || bypassUnsavedPromptRef.current) {
        return;
      }

      event.preventDefault();
      Alert.alert('Discard changes?', 'You have unsaved blog edits.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            bypassUnsavedPromptRef.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [hasUnsavedChanges, navigation]);

  useLayoutEffect(() => {
    if (!eligible || !currentUser) {
      return undefined;
    }

    autosaveTimerRef.current = setInterval(() => {
      if (saveState === 'dirty') {
        saveDraft().catch(() => undefined);
      }
    }, 15000);

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [eligible, currentUser, saveDraft, saveState]);

  if (!eligible) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.x24,
          }}
        >
          <StyledText style={{ fontFamily: 'Rubik-Bold', fontSize: 26 }}>
            Creator access required
          </StyledText>
          <StyledText
            style={{ marginTop: spacing.x10, textAlign: 'center', color: Colors.neutral[300] }}
          >
            This writer is available to approved creators only.
          </StyledText>
        </View>
      </SafeAreaView>
    );
  }

  if (isHydrating) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <MaterialCommunityIcons
          name="progress-clock"
          size={32}
          color={Colors.primarySapphire.brand}
        />
        <StyledText style={{ marginTop: spacing.x12, color: Colors.neutral[300] }}>
          Loading draft...
        </StyledText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'android' ? (
        <StatusBar
          barStyle={dark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingHorizontal: spacing.x24, paddingTop: spacing.x12, flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.x13,
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close editor"
              onPress={closeComposer}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="close" size={26} color={colors.text} />
            </TouchableOpacity>

            <View
              style={{
                paddingHorizontal: spacing.x12,
                paddingVertical: spacing.x6,
                borderRadius: borderRadius.button,
                backgroundColor: dark ? Colors.neutral[900] : Colors.neutral[800],
              }}
            >
              <StyledText
                style={{
                  color: Colors.primary.brand,
                  fontFamily: 'Rubik-Medium',
                  fontSize: 12,
                  textTransform: 'uppercase',
                }}
              >
                {statusLabel}
              </StyledText>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Save draft"
                onPress={() => {
                  saveDraft().catch(() => undefined);
                }}
                style={{ paddingHorizontal: spacing.x10, paddingVertical: spacing.x8 }}
              >
                <StyledText
                  style={{ color: Colors.primarySapphire.brand, fontFamily: 'Rubik-Medium' }}
                >
                  Save
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="More actions"
                onPress={openMenu}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: spacing.x12,
              borderBottomWidth: borderWidth.thin,
              borderBottomColor: Colors.neutral[800],
            }}
          >
            <StyledText
              style={{
                color:
                  saveState === 'error' ? Colors.errorFeedback.background : Colors.neutral[300],
                fontSize: 12,
              }}
            >
              {saveLabel}
            </StyledText>
            <StyledText style={{ color: Colors.neutral[300], fontSize: 12 }}>
              {wordCount} words • {estimatedReadTime} min read
            </StyledText>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: spacing.x16, paddingBottom: spacing.x24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                markDirty();
              }}
              placeholder="Article Title"
              placeholderTextColor={Colors.neutral[300]}
              multiline
              style={{
                color: dark ? '#FFFFFF' : Colors.primary.brand,
                fontFamily: 'Rubik-Bold',
                fontSize: 34,
                lineHeight: 40,
                paddingVertical: 0,
              }}
            />
            {validationErrors.title ? (
              <StyledText style={{ marginTop: spacing.x8, color: Colors.errorFeedback.background }}>
                {validationErrors.title}
              </StyledText>
            ) : null}

            <TextInput
              value={subtitle}
              onChangeText={(value) => {
                setSubtitle(value);
                markDirty();
              }}
              placeholder="Add a subtitle or summary"
              placeholderTextColor={Colors.neutral[300]}
              multiline
              style={{
                marginTop: spacing.x13,
                color: Colors.neutral[200],
                fontFamily: 'OpenSans-Regular',
                fontSize: 17,
                lineHeight: 25,
                paddingVertical: 0,
              }}
            />
            {validationErrors.subtitle ? (
              <StyledText style={{ marginTop: spacing.x8, color: Colors.errorFeedback.background }}>
                {validationErrors.subtitle}
              </StyledText>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.x16 }}>
              <Image
                source={{
                  uri:
                    currentUser?.profileImage ||
                    currentUser?.profileHeader ||
                    'https://cdn.onebodyapp.com/user/no-image.png',
                }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: borderRadius.max,
                  backgroundColor: Colors.neutral[800],
                }}
              />
              <StyledText
                style={{
                  marginLeft: spacing.x10,
                  color: Colors.neutral[300],
                  fontFamily: 'Rubik-Medium',
                  fontSize: 14,
                }}
              >
                By {currentUser?.name || 'Creator'}
              </StyledText>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  marginLeft: spacing.x12,
                  backgroundColor: Colors.neutral[800],
                }}
              />
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add cover image"
              onPress={() => handleCoverImage().catch(() => undefined)}
              style={{
                marginTop: spacing.x16,
                minHeight: 180,
                borderRadius: borderRadius.base,
                borderWidth: borderWidth.thin,
                borderColor: validationErrors.coverImage
                  ? Colors.errorFeedback.background
                  : Colors.neutral[800],
                backgroundColor: dark ? Colors.neutral[900] : colors.card,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {coverImage ? (
                <Image
                  source={{ uri: coverImage }}
                  style={{ width: '100%', height: 220 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ alignItems: 'center', paddingHorizontal: spacing.x20 }}>
                  <MaterialCommunityIcons
                    name="image-plus"
                    size={36}
                    color={Colors.primarySapphire.brand}
                  />
                  <StyledText
                    style={{ marginTop: spacing.x10, fontFamily: 'Rubik-Medium', fontSize: 16 }}
                  >
                    Add cover image
                  </StyledText>
                  <StyledText
                    style={{
                      marginTop: spacing.x6,
                      textAlign: 'center',
                      color: Colors.neutral[300],
                    }}
                  >
                    Choose the image that will lead your article card and reader view.
                  </StyledText>
                </View>
              )}
            </TouchableOpacity>
            {validationErrors.coverImage ? (
              <StyledText style={{ marginTop: spacing.x8, color: Colors.errorFeedback.background }}>
                {validationErrors.coverImage}
              </StyledText>
            ) : null}

            <View style={{ marginTop: spacing.x16 }}>
              <StyledText style={{ fontFamily: 'Rubik-Medium', fontSize: 15 }}>Tags</StyledText>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.x10,
                  marginTop: spacing.x10,
                }}
              >
                {TAG_OPTIONS.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      accessibilityRole="button"
                      accessibilityLabel={`Tag ${tag}`}
                      onPress={() => handleTagToggle(tag)}
                      style={{
                        paddingHorizontal: spacing.x12,
                        paddingVertical: spacing.x8,
                        borderRadius: borderRadius.button,
                        borderWidth: borderWidth.thin,
                        borderColor: active ? Colors.primarySapphire.brand : Colors.neutral[800],
                        backgroundColor: active ? 'rgba(18,107,135,0.12)' : colors.card,
                      }}
                    >
                      <StyledText
                        style={{
                          color: active ? Colors.primarySapphire.brand : colors.text,
                          fontFamily: 'Rubik-Medium',
                          fontSize: 13,
                        }}
                      >
                        {tag}
                      </StyledText>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {validationErrors.tags ? (
                <StyledText
                  style={{ marginTop: spacing.x8, color: Colors.errorFeedback.background }}
                >
                  {validationErrors.tags}
                </StyledText>
              ) : null}
            </View>

            <TextInput
              ref={bodyInputRef}
              value={body}
              onChangeText={(value) => {
                setBody(value);
                markDirty();
              }}
              onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
              placeholder="Start your story..."
              placeholderTextColor={Colors.neutral[300]}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 320,
                marginTop: spacing.x16,
                color: colors.text,
                fontFamily: 'OpenSans-Regular',
                fontSize: 18,
                lineHeight: 31,
                paddingVertical: 0,
              }}
            />
            {validationErrors.body ? (
              <StyledText style={{ marginTop: spacing.x8, color: Colors.errorFeedback.background }}>
                {validationErrors.body}
              </StyledText>
            ) : null}
          </ScrollView>
        </View>

        <View
          style={{
            borderTopWidth: borderWidth.thin,
            borderTopColor: Colors.neutral[800],
            backgroundColor: colors.background,
            paddingTop: spacing.x12,
            paddingBottom: isKeyboardVisible ? spacing.x16 : spacing.x24,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.x16, gap: spacing.x8 }}
          >
            <ToolbarButton
              label="H1"
              active={activeFormat === 'heading1'}
              onPress={() => applyFormat('heading1')}
            />
            <ToolbarButton
              label="H2"
              active={activeFormat === 'heading2'}
              onPress={() => applyFormat('heading2')}
            />
            <ToolbarButton
              icon="format-bold"
              label="Bold"
              active={activeFormat === 'bold'}
              onPress={() => applyFormat('bold')}
            />
            <ToolbarButton
              icon="format-italic"
              label="Italic"
              active={activeFormat === 'italic'}
              onPress={() => applyFormat('italic')}
            />
            <ToolbarButton
              icon="format-underline"
              label="Underline"
              active={activeFormat === 'underline'}
              onPress={() => applyFormat('underline')}
            />
            <ToolbarButton
              icon="format-list-bulleted"
              label="Bullets"
              active={activeFormat === 'bulleted'}
              onPress={() => applyFormat('bulleted')}
            />
            <ToolbarButton
              icon="format-list-numbered"
              label="Numbered"
              active={activeFormat === 'numbered'}
              onPress={() => applyFormat('numbered')}
            />
            <ToolbarButton
              icon="format-quote-close"
              label="Quote"
              active={activeFormat === 'quote'}
              onPress={() => applyFormat('quote')}
            />
            <ToolbarButton
              icon="link-variant"
              label="Link"
              active={activeFormat === 'link'}
              onPress={() => applyFormat('link')}
            />
            <ToolbarButton
              icon="image-outline"
              label="Image"
              active={activeFormat === 'image'}
              onPress={() => applyFormat('image')}
            />
            <ToolbarButton
              icon="minus"
              label="Divider"
              active={activeFormat === 'divider'}
              onPress={() => applyFormat('divider')}
            />
            <ToolbarButton
              icon="file-import-outline"
              label="Import"
              onPress={() => handleImportText().catch(() => undefined)}
            />
          </ScrollView>

          <View
            style={{
              marginTop: spacing.x12,
              marginHorizontal: spacing.x20,
              padding: spacing.x13,
              borderRadius: borderRadius.base,
              borderWidth: borderWidth.thin,
              borderColor: Colors.neutral[800],
              backgroundColor: dark ? Colors.neutral[900] : colors.card,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <StyledText style={{ color: Colors.neutral[300], fontSize: 12 }}>
                {wordCount} words
              </StyledText>
              <StyledText
                style={{ marginTop: spacing.x4, color: Colors.neutral[300], fontSize: 12 }}
              >
                {estimatedReadTime} min read
              </StyledText>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={publishButtonLabel}
              disabled={publishState === 'invalid' || saveState === 'saving'}
              onPress={() => handlePublish().catch(() => undefined)}
              style={{
                minWidth: 170,
                paddingHorizontal: spacing.x20,
                paddingVertical: spacing.x13,
                borderRadius: borderRadius.max,
                backgroundColor: publishButtonColor,
                opacity: saveState === 'saving' ? 0.8 : 1,
              }}
            >
              <StyledText
                style={{
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontFamily: 'Rubik-Bold',
                  fontSize: 16,
                }}
              >
                {publishButtonLabel}
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
