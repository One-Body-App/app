import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleProp,
  TextLayoutEventData,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import Toast, { useToast } from 'react-native-toast-notifications';

import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { PostType, PrayerPost, PrayerWallCategory, SocialPostReaction } from '@/utils/types';
import {
  MainDrawerParamsList,
  MainBottomStackParamsList,
  PrayerWallStackParamsList,
} from '@/src/navigator/types';
import { borderRadius } from '@/src/styles/outlines';
import StyledText from '../styled/Text';
import { fontSize, header } from '@/src/styles/typography';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import BaseItem from './BaseItem';
import { RootState } from '@/src/redux/reducers/rootReducer';
import getPrayerWallWebClassName from './prayerWallWebClassName';
import { sanitizeComposerText } from '@/components/composer/composerText';

import { ApiCall } from '@/services/api';
import Anonymous from '@/assets/svg/anonymous.svg';
import Button from '../Button';
import { button } from '@/src/styles/buttons';
import StyledTextInput from '../styled/TextInput';
import CustomModal from '../CustomModal';

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<PrayerWallStackParamsList, 'index'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'ExploreTab'>
  >
>;
type PrayerItemProps = {
  item: PrayerPost;
  style?: StyleProp<ViewStyle>;
  onCommentsPress?: () => void;

  parentRefreshContent?: Function;
  fromSavedPosts?: boolean;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  limitContentLines?: boolean;
  originFeedType?: string;
};
function PrayerItem({
  removePost,
  editPost,
  item,
  style,
  parentRefreshContent,
  fromSavedPosts,
  onCommentsPress,
  limitContentLines = false,
  originFeedType,
}: PrayerItemProps) {
  const { colors, dark } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [collapsedPreview, setCollapsedPreview] = useState('');
  const toastRef = useRef<Toast>(null);
  const [testinomyContent, setTestinomyContent] = useState<string>('');
  const navigation = useNavigation<ScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();
  const entryProgress = useRef(new Animated.Value(0)).current;
  const isAnsweredPrayer =
    Boolean(item.answered) || item.category === PrayerWallCategory.AnsweredPrayer;
  const isExhortation = item.category === PrayerWallCategory.Exhortation && !isAnsweredPrayer;
  const isTestimony = item.category === PrayerWallCategory.Testimony && !isAnsweredPrayer;
  const webPrayerCardClassName = getPrayerWallWebClassName(item.category, item.answered);

  const answeredPrayer = async () => {
    try {
      setIsLoading(true);
      const res = await ApiCall({
        route: `prayer/answered/${item.postId}`,
        verb: 'patch',
        token,
        params: {
          testimony: testinomyContent,
          reactions: [],
        },
      });

      if (res?.status === 200) {
        setShowModal(false);

        toast.show('Prayer marked as answered', {
          id: 'successMessage',
          type: 'success',
          placement: 'bottom',
        });
      }
      throw res.response;
    } catch (e: any) {
      console.log('saga error -- ', e.toString());

      toastRef.current?.show('Error updating prayer. Please try again later.', {
        type: 'danger',
        placement: 'bottom',
      });
    }
    setIsLoading(false);
  };

  let myReaction: SocialPostReaction | undefined;

  item.reactions?.forEach((reaction) => {
    if (reaction.userId === user?._id) {
      myReaction = reaction;
    }
  });

  const postId = item.postId ?? item.id;
  const navigateToSinglePrayer = () => {
    if (!postId) return;

    const state = navigation.getState() as { routeNames?: string[] } | undefined;
    const hasSingleInCurrentNavigator = state?.routeNames?.includes('Single');

    if (hasSingleInCurrentNavigator) {
      navigation.navigate('Single', { postId } as any);
      return;
    }

    (navigation as any).navigate('PrayerWall', {
      screen: 'Single',
      params: { postId },
    });
  };

  const handleCommentsPress =
    onCommentsPress ||
    (postId
      ? () => {
          navigateToSinglePrayer();
        }
      : undefined);

  useLayoutEffect(() => {
    setIsContentExpanded(false);
    setShowSeeMore(false);
    setCollapsedPreview('');
  }, [item.content, item.postId, item.id, limitContentLines]);

  useLayoutEffect(() => {
    entryProgress.setValue(0);

    const easing = isExhortation
      ? Easing.bezier(0.175, 0.885, 0.32, 1.275)
      : Easing.out(Easing.cubic);
    const animation = Animated.timing(entryProgress, {
      toValue: 1,
      duration: 620,
      easing,
      useNativeDriver: true,
    });

    animation.start();
  }, [entryProgress, isExhortation, item.answered, item.category, item.id, item.postId]);

  const prayerVariantStyle = (() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

    if (isAnsweredPrayer) {
      return {
        borderWidth: 2,
        borderColor: '#12d2d9',
        borderStyle: Platform.OS === 'android' ? ('dashed' as const) : ('solid' as const),
      };
    }

    if (isExhortation) {
      return {
        borderWidth: dark ? 0 : 1,
        borderColor: dark ? 'transparent' : '#e6eaec',
        borderLeftWidth: 5,
        borderLeftColor: '#126b87',
      };
    }

    if (isTestimony) {
      return {
        borderWidth: 2,
        borderColor: '#12d2d9',
      };
    }

    return {
      borderWidth: dark ? 0 : 1,
      borderColor: dark ? 'transparent' : '#e6eaec',
    };
  })();

  const entryAnimationStyle = (() => {
    if (isAnsweredPrayer) {
      return {
        opacity: entryProgress,
        transform: [
          {
            translateY: entryProgress.interpolate({
              inputRange: [0, 0.76, 1],
              outputRange: [-20, 2, 0],
            }),
          },
          {
            rotate: entryProgress.interpolate({
              inputRange: [0, 0.76, 1],
              outputRange: ['0deg', '2deg', '0deg'],
            }),
          },
        ],
      };
    }

    if (isExhortation) {
      return {
        opacity: entryProgress.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [
          {
            translateX: entryProgress.interpolate({
              inputRange: [0, 0.72, 1],
              outputRange: [32, -4, 0],
            }),
          },
        ],
      };
    }

    if (isTestimony) {
      return {
        opacity: entryProgress,
        transform: [
          {
            scale: entryProgress.interpolate({
              inputRange: [0, 0.65, 1],
              outputRange: [0.8, 1.03, 1],
            }),
          },
        ],
      };
    }

    return {
      opacity: entryProgress,
    };
  })();

  const showMarkAnsweredAction =
    item?.userData?._id === user?._id &&
    !item.answered &&
    item.category === PrayerWallCategory.Request;

  const onContentMeasure = (event: { nativeEvent: TextLayoutEventData }) => {
    if (!limitContentLines) {
      return;
    }

    const measuredLines = event.nativeEvent.lines;
    if (measuredLines.length > 3) {
      setShowSeeMore(true);
      const firstThreeLines = measuredLines
        .slice(0, 3)
        .map((line) => line.text)
        .join('');
      const reserveCharsForLink = 12;
      const trimmedPreview =
        firstThreeLines.length > reserveCharsForLink
          ? firstThreeLines.slice(0, -reserveCharsForLink).trimEnd()
          : firstThreeLines.trimEnd();
      setCollapsedPreview(trimmedPreview);
    } else {
      setShowSeeMore(false);
      setCollapsedPreview('');
    }
  };

  return (
    <Animated.View style={entryAnimationStyle}>
      <BaseItem
        webClassName={webPrayerCardClassName}
        removePost={removePost}
        editPost={editPost}
        edited={item.edited}
        updated={item.updated}
        fromSavedPosts={fromSavedPosts}
        postData={{
          id: item.postId ?? item.id,
          type: PostType.prayer,
          image: undefined,
          reactions: item.reactions ?? [],
          myReaction,
          prayerCategory: item.category,
          answered: item.answered,
          location: item.location,
          locationName: item.locationName,
          edited: item.edited,
          isPrivate: item.private,
          comments: item.comments,
          commentNumber: item.commentNumber,
          repostCount: item.repostCount,
        }}
        repostPayload={{
          sourceType: 'prayer',
          sourceId: String(item.postId ?? item.id ?? ''),
          sourcePreview: {
            content: item.content,
            category: item.category,
            isPrivate: item.private,
          },
          originFeedType,
        }}
        parentRefreshContent={parentRefreshContent}
        created={item?.created}
        userData={
          item.private
            ? {
                name: 'Anonymous',
                profileIcon: <Anonymous color={Colors.main.black} />,
              }
            : {
                ...item.userData,
                profileImage:
                  item?.userData?.profileImage && item?.userData?.profileImage !== ''
                    ? item?.userData?.profileImage
                    : NO_PROFILE_IMAGE,
              }
        }
        isApprovedInfluencer={item.userData?.isApprovedInfluencer ?? false}
        onCommentsPress={handleCommentsPress}
        onPress={() => {
          if (!item.private && item?.userData._id && item.userData._id !== user?._id) {
            navigation.navigate('UserProfile', {
              id: item?.userData._id,
            });
          }
        }}
        actionBarRightAccessory={
          showMarkAnsweredAction ? (
            <Button
              text="Mark as answered"
              onPress={() => {
                setShowModal(true);
              }}
              btnStyle={{
                ...button.primary,
                paddingHorizontal: spacing.x10,
                paddingVertical: spacing.x5,
              }}
              btnTextStyle={{
                color: 'white',
                fontSize: 10,
              }}
            />
          ) : null
        }
        style={[prayerVariantStyle, style]}
      >
        <View style={{ flexGrow: 1 }}>
          {item?.content && (
            <View style={{ flexGrow: 1, position: 'relative' }}>
              {limitContentLines ? (
                <StyledText
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    opacity: 0,
                    zIndex: -1,
                  }}
                  onTextLayout={onContentMeasure}
                >
                  {item?.content}
                </StyledText>
              ) : null}
              <StyledText
                style={{
                  color: colors.text,
                  marginBottom: spacing.x8,
                  flexGrow: 1,
                }}
              >
                {limitContentLines && showSeeMore && !isContentExpanded
                  ? `${collapsedPreview}... `
                  : item?.content}
                {limitContentLines && showSeeMore && !isContentExpanded ? (
                  <StyledText
                    style={{ color: '#12d2d9' }}
                    onPress={(event: any) => {
                      event?.stopPropagation?.();
                      setIsContentExpanded(true);
                    }}
                  >
                    See More
                  </StyledText>
                ) : null}
              </StyledText>
            </View>
          )}
        </View>

        {item.answered && item.testimony ? (
          <View
            style={{
              backgroundColor: Colors.neutral[700],
              padding: spacing.x16,
              marginVertical: spacing.x10,
              borderRadius: borderRadius.small,
            }}
          >
            <StyledText style={header.h4}>Prayer Answered</StyledText>
            <StyledText style={{ marginTop: spacing.x5, color: Colors.neutral[200] }}>
              {item.testimony.content}
            </StyledText>
          </View>
        ) : null}

        <CustomModal modalVisible={showModal} onclose={() => setShowModal(false)}>
          <View
            style={{
              backgroundColor: colors.background,
              padding: spacing.x20,
              borderRadius: borderRadius.base,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  flexGrow: 1,
                  flexDirection: 'row',
                }}
              >
                <View style={{ flexGrow: 1 }} />
                <StyledText style={[header.h3, { flexGrow: 1 }]}>Answered Prayer</StyledText>
                <TouchableOpacity
                  onPress={() => {
                    // setModalVisible(false);
                    setShowModal(false);
                  }}
                  style={{
                    alignSelf: 'center',

                    // justifyContent: 'flex-end',
                    // alignItems: 'flex-end',
                  }}
                >
                  <MaterialCommunityIcons
                    name="window-close"
                    size={18}
                    color={Colors.primary.brand}
                  />
                </TouchableOpacity>
              </View>
              <StyledText style={[fontSize.x3, { marginTop: spacing.x16 }]}>
                Share what the Lord has done!
              </StyledText>
              <StyledText
                style={{ textAlign: 'center', marginTop: spacing.x10, color: Colors.neutral[300] }}
              >
                This will be public on Testimonies and your prayer will automatically be marked as
                answered.
              </StyledText>
            </View>

            <StyledTextInput
              label="Testify"
              multiline
              showCharCounter
              maxLength={150}
              enforceMaxLength
              value={testinomyContent}
              placeholder="Write something"
              inputStyle={{
                flexGrow: 1,
                height: 100,
                marginVertical: 10,
                color: colors.text,
                textAlignVertical: 'top',
              }}
              wrapperStyle={{ marginVertical: spacing.x10 }}
              onChangeText={(content) => {
                setTestinomyContent(sanitizeComposerText(content, 150));
              }}
              counterContainerStyle={{
                position: 'absolute',
                bottom: 10,
                right: 10,
              }}
              counterTextStyleStyle={{
                color: Colors.neutral[300],
              }}
              placeholderTextColor={Colors.neutral[300]}
            />
            <Button
              text={isLoading ? '' : 'Share Testimony'}
              content={
                isLoading ? (
                  <View style={{ justifyContent: 'center' }}>
                    <ActivityIndicator
                      animating={isLoading}
                      size="small"
                      color={Colors.main.white}
                      style={{ marginRight: spacing.x10 }}
                    />
                  </View>
                ) : undefined
              }
              onPress={() => {
                if (item?.userData?._id === user?._id) {
                  answeredPrayer();
                }
              }}
              disabled={!testinomyContent}
              disabledBtnStyle={[
                button.primary,

                {
                  flexGrow: 1,
                  marginVertical: spacing.x10,
                  paddingVertical: spacing.x16,
                  opacity: 0.5,
                },
              ]}
              btnTextStyle={{ color: colors.text }}
              btnStyle={[
                button.primary,
                { flexGrow: 1, marginVertical: spacing.x10, paddingVertical: spacing.x16 },
              ]}
            />
          </View>
          <Toast ref={toastRef} />
        </CustomModal>
      </BaseItem>
    </Animated.View>
  );
}

export default PrayerItem;
