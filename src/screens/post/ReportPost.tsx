import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import StyledText from '@/components/styled/Text';
import { ApiCall } from '@/services/api';
import { MainStackParamList } from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { body, header } from '@/src/styles/typography';
import {
  emitFeedItemUnavailable,
  getFeedItemUnavailableMessage,
  isFeedItemUnavailableResponse,
  normalizeOwnedPostType,
} from '@/services/ownedPostDeletion';

type Props = NativeStackScreenProps<MainStackParamList, 'ReportPost'>;
type ReportReason = 'INAPPROPRIATE' | 'HARASSMENT' | 'SPAM' | 'NON_PROTESTANT' | 'OTHER';

type ReportOption = {
  key: string;
  label: string;
  reason: ReportReason;
  note?: string;
};

const REPORT_OPTIONS: ReportOption[] = [
  { key: 'spam', label: 'Spam', reason: 'SPAM', note: 'SPAM' },
  { key: 'harassment', label: 'Harassment', reason: 'HARASSMENT', note: 'HARASSMENT' },
  { key: 'hate_speech', label: 'Hate Speech', reason: 'HARASSMENT', note: 'HATE_SPEECH' },
  {
    key: 'false_information',
    label: 'False Information',
    reason: 'OTHER',
    note: 'FALSE_INFORMATION',
  },
  {
    key: 'inappropriate_content',
    label: 'Inappropriate Content',
    reason: 'INAPPROPRIATE',
    note: 'INAPPROPRIATE_CONTENT',
  },
  { key: 'violence', label: 'Violence', reason: 'INAPPROPRIATE', note: 'VIOLENCE' },
  { key: 'other', label: 'Other', reason: 'OTHER' },
];

function ReportPost({ navigation, route }: Props) {
  const { dark } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [reportComment, setReportComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = REPORT_OPTIONS.find((option) => option.key === selectedOptionKey) ?? null;
  const isOtherSelected = selectedOption?.key === 'other';
  const normalizedComment = reportComment.trim();
  const canSubmit =
    Boolean(selectedOption) && !isSubmitting && (!isOtherSelected || normalizedComment.length > 0);

  const screenBackground = dark ? '#111d21' : '#ffffff';
  const surfaceColor = dark ? '#111d21' : '#ffffff';
  const brandDark = '#032f3c';
  const titleColor = dark ? '#ffffff' : brandDark;
  const descriptionColor = '#4f8596';
  const rowDividerColor = dark ? '#273941' : '#e5e7eb';
  const selectedRowColor = dark ? 'rgba(18,107,135,0.24)' : 'rgba(18,107,135,0.12)';
  const primaryButton = '#126b87';
  const disabledButtonBg = dark ? '#2c3f45' : '#e5e7eb';
  const buttonBackground = canSubmit ? primaryButton : disabledButtonBg;
  const disabledButtonText = dark ? '#8aa1aa' : '#9ca3af';
  const buttonTextColor = canSubmit ? '#ffffff' : disabledButtonText;
  const inputBackground = dark ? '#1a2c32' : '#f6f7f8';
  const inputBorder = dark ? '#273941' : '#e5e7eb';
  const footerSafeInset = spacing.x24 + spacing.x16 + 56 + spacing.x20;
  const reportScrollInsets = { top: spacing.x8, bottom: footerSafeInset };
  const reportScrollAndroidPadding =
    Platform.OS === 'android' ? { paddingTop: spacing.x8, paddingBottom: footerSafeInset } : {};

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }
      StatusBar.setBarStyle(dark ? 'light-content' : 'dark-content');
      StatusBar.setBackgroundColor(screenBackground);
      StatusBar.setTranslucent(false);
      return undefined;
    }, [dark, screenBackground])
  );

  const submitReport = async () => {
    if (!selectedOption) return;
    if (isOtherSelected && !normalizedComment) {
      toast.show('Please add a comment for Other.', { placement: 'bottom' });
      return;
    }

    const metadataComment = normalizedComment || selectedOption.note;

    setIsSubmitting(true);
    try {
      const result = await ApiCall({
        route: 'content/flag',
        verb: 'post',
        token,
        params: {
          targetId: route.params.targetId,
          targetType: route.params.targetType,
          reason: selectedOption.reason,
          ...(metadataComment ? { note: metadataComment, comment: metadataComment } : {}),
        },
      });

      if (result.status === 200) {
        if (isFeedItemUnavailableResponse(result.status, result.response)) {
          const normalizedType = normalizeOwnedPostType(route.params.targetType);
          if (normalizedType) {
            emitFeedItemUnavailable({
              type: normalizedType,
              id: route.params.targetId,
            });
          }

          toast.show(getFeedItemUnavailableMessage(result.response), {
            placement: 'bottom',
          });
          navigation.goBack();
          return;
        }

        if (__DEV__) {
          const state = navigation.getState();
          const currentRouteName = state.routes[state.index]?.name;
          console.log(
            '[ReportPost] Report submitted successfully. Replacing route from:',
            currentRouteName
          );
        }
        navigation.replace('ReportStatus', {
          reportedUserId: route.params.reportedUserId,
        });
        return;
      }

      if (isFeedItemUnavailableResponse(result.status, result.response)) {
        const normalizedType = normalizeOwnedPostType(route.params.targetType);
        if (normalizedType) {
          emitFeedItemUnavailable({
            type: normalizedType,
            id: route.params.targetId,
          });
        }

        toast.show(getFeedItemUnavailableMessage(result.response), {
          placement: 'bottom',
        });
        navigation.goBack();
        return;
      }

      toast.show(result?.response?.message ?? 'Unable to submit report. Please try again.', {
        placement: 'bottom',
      });
    } catch (error) {
      toast.show('Unable to submit report. Please try again.', { placement: 'bottom' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBackground }}>
      {Platform.OS === 'android' ? (
        <StatusBar
          barStyle={dark ? 'light-content' : 'dark-content'}
          backgroundColor={screenBackground}
        />
      ) : null}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.x20 : 0}
      >
        <View
          style={{
            backgroundColor: surfaceColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.x20,
            paddingTop: spacing.x8,
            paddingBottom: spacing.x16,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ width: 40, height: 40, justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="chevron-left" size={30} color={titleColor} />
          </Pressable>
          <StyledText style={[header.h2, { color: titleColor }]}>Report Post</StyledText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.x20,
            ...reportScrollAndroidPadding,
          }}
          contentInset={reportScrollInsets}
          scrollIndicatorInsets={reportScrollInsets}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <StyledText style={[header.h1, { color: titleColor, marginBottom: spacing.x10 }]}>
            Why are you reporting this post?
          </StyledText>
          <StyledText
            style={[
              body.x2,
              {
                color: descriptionColor,
                lineHeight: 42 / 2,
                marginBottom: spacing.x20,
              },
            ]}
          >
            Your feedback helps us keep the community safe. Choose a reason that best describes this
            content.
          </StyledText>

          <View>
            {REPORT_OPTIONS.map((option) => {
              const isSelected = selectedOptionKey === option.key;
              const rowStyle = isSelected
                ? {
                    backgroundColor: selectedRowColor,
                    borderRadius: borderRadius.base,
                    borderBottomColor: 'transparent',
                    paddingHorizontal: spacing.x13,
                  }
                : {
                    backgroundColor: 'transparent',
                    paddingHorizontal: spacing.x5,
                  };
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedOptionKey(option.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: spacing.x16,
                    borderBottomWidth: 1,
                    borderBottomColor: rowDividerColor,
                    marginBottom: spacing.x8,
                    ...rowStyle,
                  }}
                >
                  <StyledText style={[body.x1, { color: titleColor, fontSize: 18 }]}>
                    {option.label}
                  </StyledText>
                  {isSelected ? (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: primaryButton,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#ffffff" />
                    </View>
                  ) : (
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: spacing.x8 }}>
            <StyledText style={[body.x2, { color: titleColor, marginBottom: spacing.x8 }]}>
              Comment {isOtherSelected ? '(required)' : '(optional)'}
            </StyledText>
            <TextInput
              value={reportComment}
              onChangeText={setReportComment}
              multiline
              numberOfLines={4}
              maxLength={400}
              placeholder={
                isOtherSelected
                  ? 'Please tell us why you are reporting this post.'
                  : 'Add any additional context (optional).'
              }
              placeholderTextColor={dark ? '#8aa1aa' : '#9ca3af'}
              style={{
                minHeight: 100,
                borderWidth: 1,
                borderColor: isOtherSelected && !normalizedComment ? '#ef4444' : inputBorder,
                borderRadius: borderRadius.base,
                backgroundColor: inputBackground,
                color: titleColor,
                paddingHorizontal: spacing.x13,
                paddingVertical: spacing.x10,
                textAlignVertical: 'top',
                ...body.x2,
              }}
            />
            {isOtherSelected && !normalizedComment ? (
              <StyledText style={[body.x4, { color: '#ef4444', marginTop: spacing.x5 }]}>
                Tell us more about why you are reporting this.
              </StyledText>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: rowDividerColor,
            paddingHorizontal: spacing.x20,
            paddingTop: spacing.x16,
            paddingBottom: spacing.x24,
            backgroundColor: surfaceColor,
          }}
        >
          <Pressable
            disabled={!canSubmit}
            onPress={submitReport}
            style={{
              height: 56,
              borderRadius: borderRadius.button,
              backgroundColor: buttonBackground,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" style={{ marginRight: spacing.x8 }} />
            ) : null}
            <StyledText
              style={[
                body.x2,
                {
                  color: buttonTextColor,
                  fontWeight: '700',
                },
              ]}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </StyledText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ReportPost;
