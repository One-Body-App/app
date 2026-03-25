import React, { useCallback, useState } from 'react';
import {
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { CommonActions, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomModal from '@/src/components/CustomModal';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { FeedTypes } from '@/src/screens/home';
import { Colors } from '@/src/styles';
import {
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
  APP_HEADER_TITLE_LINE_HEIGHT,
} from '@/src/styles/headerLayout';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerStepFour'>;
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type ContentTypeOption = {
  id: string;
  label: string;
  icon: IconName;
};

type ScreenPalette = {
  screen: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  subtleBorder: string;
  accent: string;
  primary: string;
  primaryActive: string;
  text: string;
  body: string;
  muted: string;
  buttonText: string;
  secondaryButtonBorder: string;
  secondaryButtonText: string;
  modalSurface: string;
};

const CONTENT_TYPES: ContentTypeOption[] = [
  { id: 'video', label: 'Video', icon: 'video' },
  { id: 'audio', label: 'Audio', icon: 'microphone' },
  { id: 'written', label: 'Written', icon: 'pencil-box-outline' },
  { id: 'images', label: 'Images', icon: 'image' },
];

const TOPICS = [
  { id: 'faith', label: 'Faith & Theology' },
  { id: 'marriage', label: 'Marriage & Family' },
  { id: 'youth', label: 'Youth Ministry' },
  { id: 'worship', label: 'Worship & Music' },
  { id: 'bible', label: 'Bible Study' },
  { id: 'apologetics', label: 'Apologetics' },
  { id: 'missions', label: 'Missions & Outreach' },
  { id: 'prayer', label: 'Prayer & Devotion' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'current_events', label: 'Current Events' },
];

function CreatorStepFour({ navigation, route }: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const palette: ScreenPalette = dark
    ? {
        screen: colors.background,
        surface: colors.card,
        surfaceAlt: '#121A1D',
        border: 'rgba(255, 255, 255, 0.08)',
        subtleBorder: 'rgba(255, 255, 255, 0.06)',
        accent: Colors.primarySapphire.brand,
        primary: Colors.primarySapphire.brand,
        primaryActive: 'rgba(18, 107, 135, 0.22)',
        text: colors.text,
        body: Colors.primary[600],
        muted: Colors.primary[500],
        buttonText: '#FFFFFF',
        secondaryButtonBorder: 'rgba(255, 255, 255, 0.12)',
        secondaryButtonText: colors.text,
        modalSurface: colors.card,
      }
    : {
        screen: colors.background,
        surface: '#FFFFFF',
        surfaceAlt: Colors.primarySapphire[900],
        border: Colors.primary[800],
        subtleBorder: 'rgba(3, 47, 60, 0.06)',
        accent: Colors.primarySapphire.brand,
        primary: Colors.primarySapphire.brand,
        primaryActive: Colors.primarySapphire[900],
        text: Colors.primary.brand,
        body: Colors.primary[500],
        muted: Colors.primary[500],
        buttonText: '#FFFFFF',
        secondaryButtonBorder: Colors.primary[800],
        secondaryButtonText: Colors.primary.brand,
        modalSurface: '#FFFFFF',
      };

  const styles = createStyles(palette, dark, insets.bottom);
  const previousData = route.params?.data || {};

  const toggleType = (id: string) => {
    setSelectedTypes((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 5) {
        return current;
      }

      return [...current, id];
    });
  };

  const handleQuit = useCallback(() => {
    setShowQuitModal(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main' as never,
            params: {
              screen: 'HomeTab',
              params: {
                screen: 'Home',
                params: {
                  selectedTab: FeedTypes.ForYou,
                  refreshToken: Date.now(),
                },
              },
            },
          } as never,
        ],
      })
    );
  }, [navigation]);

  const onReview = () => {
    navigation.navigate('CreatorReview', {
      data: {
        ...previousData,
        contentTypes: selectedTypes,
        topics: selectedTopics,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={32} color={palette.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Creator Application</Text>
          <View style={[styles.headerSide, styles.headerActionContainer]}>
            <TouchableOpacity
              onPress={() => setShowQuitModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.headerActionText}>Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.stepIndicator}>Final step</Text>
          <Text style={styles.mainHeading}>How do you share your message?</Text>
          <Text style={styles.subHeading}>
            Select the content types and topics you typically focus on to build community.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Content type</Text>
            <Text style={styles.sectionSub}>Select all that apply</Text>
          </View>

          <View style={styles.gridContainer}>
            {CONTENT_TYPES.map((type) => {
              const isActive = selectedTypes.includes(type.id);
              const contentColor = isActive ? palette.primary : palette.muted;

              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor: isActive ? palette.primaryActive : palette.surface,
                      borderColor: isActive ? palette.primary : palette.subtleBorder,
                    },
                  ]}
                  onPress={() => toggleType(type.id)}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={28}
                    color={contentColor}
                    style={styles.gridIcon}
                  />
                  <Text style={[styles.gridText, { color: contentColor }]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Topics</Text>
            <Text
              style={[
                styles.sectionSub,
                { color: selectedTopics.length === 5 ? palette.accent : palette.body },
              ]}
            >
              {selectedTopics.length} / 5 selected
            </Text>
          </View>

          <View style={styles.tagsContainer}>
            {TOPICS.map((topic) => {
              const isActive = selectedTopics.includes(topic.id);
              const isDisabled = !isActive && selectedTopics.length >= 5;

              return (
                <TouchableOpacity
                  key={topic.id}
                  activeOpacity={0.7}
                  disabled={isDisabled}
                  style={[
                    styles.tagButton,
                    {
                      backgroundColor: isActive ? palette.primary : palette.surface,
                      borderColor: isActive ? palette.primary : palette.subtleBorder,
                      opacity: isDisabled ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => toggleTopic(topic.id)}
                >
                  {isActive && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color="#FFFFFF"
                      style={styles.tagIcon}
                    />
                  )}
                  <Text style={[styles.tagText, { color: isActive ? '#FFFFFF' : palette.primary }]}>
                    {topic.label.toLowerCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.impactCardWrapper}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
            }}
            style={styles.impactCard}
            imageStyle={styles.impactImage}
          >
            <LinearGradient
              colors={['transparent', 'rgba(3, 47, 60, 0.9)']}
              style={styles.impactGradient}
            >
              <Text style={styles.impactTitle}>Message impact</Text>
              <Text style={styles.impactText}>Visual storytelling increases engagement by 4x.</Text>
            </LinearGradient>
          </ImageBackground>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={palette.secondaryButtonText}
          />
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={onReview}>
          <Text style={styles.continueButtonText}>REVIEW APPLICATION</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={palette.buttonText} />
        </TouchableOpacity>
      </View>

      <CustomModal
        modalVisible={showQuitModal}
        onclose={() => setShowQuitModal(false)}
        style={styles.quitModalContainer}
      >
        <View style={styles.quitModalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.quitModalTitle}>Quit Creator Application?</Text>
          <Text style={styles.quitModalBody}>
            If you leave now, the information you entered on this step will not be saved.
          </Text>

          <View style={styles.quitModalActions}>
            <TouchableOpacity
              style={styles.quitModalSecondaryButton}
              onPress={() => setShowQuitModal(false)}
            >
              <Text style={styles.quitModalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quitModalPrimaryButton} onPress={handleQuit}>
              <Text style={styles.quitModalPrimaryButtonText}>Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}

const createStyles = (palette: ScreenPalette, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.screen,
    },
    headerWrap: {
      paddingHorizontal: 20,
      paddingBottom: 6,
      backgroundColor: palette.screen,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: APP_HEADER_ROW_HEIGHT,
      backgroundColor: palette.screen,
      transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
    },
    headerSide: {
      width: APP_HEADER_SIDE_WIDTH,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerIconButton: {
      height: 40,
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      color: palette.text,
      fontSize: 24,
      lineHeight: APP_HEADER_TITLE_LINE_HEIGHT,
      fontFamily: 'Rubik-Bold',
      fontWeight: '600',
      letterSpacing: 0.3,
      textAlign: Platform.OS === 'android' ? 'left' : 'center',
    },
    headerActionContainer: {
      alignItems: 'flex-end',
    },
    headerActionText: {
      color: palette.accent,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'OpenSans-SemiBold',
      fontWeight: '600',
    },
    progressBarTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: palette.subtleBorder,
      overflow: 'hidden',
      marginTop: 4,
    },
    progressBarFill: {
      width: '100%',
      height: '100%',
      borderRadius: 999,
      backgroundColor: palette.primary,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 164 + Math.max(bottomInset, 16),
    },
    titleSection: {
      marginBottom: 24,
    },
    stepIndicator: {
      color: palette.accent,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: 'Rubik-Medium',
      marginBottom: 8,
    },
    mainHeading: {
      color: palette.text,
      fontSize: 28,
      lineHeight: 36,
      fontFamily: 'Rubik-Bold',
      marginBottom: 10,
    },
    subHeading: {
      color: palette.body,
      fontSize: 16,
      lineHeight: 28,
      fontFamily: 'OpenSans-Regular',
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 16,
      gap: 12,
    },
    sectionTitle: {
      color: palette.accent,
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Rubik-Bold',
      fontWeight: '700',
    },
    sectionSub: {
      color: palette.body,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'OpenSans-SemiBold',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    gridItem: {
      width: '48%',
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      marginBottom: 12,
      minHeight: 152,
      justifyContent: 'center',
    },
    gridIcon: {
      marginBottom: 14,
    },
    gridText: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'OpenSans-SemiBold',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    tagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      marginBottom: 12,
    },
    tagIcon: {
      marginRight: 6,
    },
    tagText: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'OpenSans-SemiBold',
    },
    impactCardWrapper: {
      marginTop: 4,
      borderRadius: 28,
      overflow: 'hidden',
      minHeight: 180,
      backgroundColor: palette.surfaceAlt,
      borderWidth: 1,
      borderColor: palette.subtleBorder,
    },
    impactCard: {
      width: '100%',
      height: '100%',
      minHeight: 180,
      backgroundColor: palette.surfaceAlt,
    },
    impactImage: {
      opacity: dark ? 0.5 : 0.62,
    },
    impactGradient: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: 22,
    },
    impactTitle: {
      color: Colors.primarySapphire.brand,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: 'Rubik-Medium',
      marginBottom: 6,
    },
    impactText: {
      color: '#FFFFFF',
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'OpenSans-SemiBold',
      maxWidth: '72%',
    },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Math.max(bottomInset, 16),
      backgroundColor: palette.screen,
      borderTopWidth: 1,
      borderTopColor: palette.subtleBorder,
    },
    backButton: {
      minWidth: 116,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      paddingHorizontal: 22,
      borderWidth: 1,
      borderColor: palette.secondaryButtonBorder,
      borderRadius: 24,
      backgroundColor: palette.surface,
    },
    backButtonText: {
      color: palette.secondaryButtonText,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'OpenSans-SemiBold',
      letterSpacing: 2.2,
      marginLeft: 4,
    },
    continueButton: {
      minWidth: 208,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.primary,
      paddingVertical: 15,
      paddingHorizontal: 28,
      borderRadius: 28,
    },
    continueButtonText: {
      color: palette.buttonText,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'OpenSans-SemiBold',
      letterSpacing: 1.8,
      marginRight: 4,
    },
    quitModalContainer: {
      minHeight: 280,
      backgroundColor: palette.modalSurface,
    },
    quitModalContent: {
      backgroundColor: palette.modalSurface,
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: Math.max(bottomInset, 20) + 8,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 999,
      backgroundColor: palette.border,
      marginBottom: 24,
    },
    quitModalTitle: {
      color: palette.text,
      fontSize: 22,
      lineHeight: 32,
      fontFamily: 'Rubik-Medium',
      marginBottom: 12,
    },
    quitModalBody: {
      color: palette.body,
      fontSize: 15,
      lineHeight: 24,
      fontFamily: 'OpenSans-Regular',
      marginBottom: 28,
    },
    quitModalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    quitModalSecondaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.secondaryButtonBorder,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.surface,
    },
    quitModalSecondaryButtonText: {
      color: palette.secondaryButtonText,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: 'OpenSans-SemiBold',
    },
    quitModalPrimaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 18,
      backgroundColor: palette.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quitModalPrimaryButtonText: {
      color: palette.buttonText,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: 'OpenSans-SemiBold',
    },
  });

export default CreatorStepFour;
