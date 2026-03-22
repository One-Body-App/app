import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ImageBackground,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { StackScreenProps } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerStepFour'>;
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type ContentTypeOption = {
  id: string;
  label: string;
  icon: IconName;
};

// --- Dynamic Brand Palette ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#032F3C' : '#FFFFFF',
  surface: isDark ? '#0B3C4A' : '#F2F3F3',
  surfaceBorder: isDark ? 'rgba(53, 89, 99, 0.3)' : '#E6EAEC',
  primary: '#126B87',
  primaryActive: isDark ? '#126B87' : '#E7F0F3',
  accent: '#12D2D9',
  textMain: isDark ? '#FFFFFF' : '#032F3C',
  textMuted: isDark ? '#81979E' : '#68828A',
  headerBg: isDark ? 'rgba(3, 47, 60, 0.9)' : 'rgba(255, 255, 255, 0.9)',
});

// --- Mock Data ---
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
  const isDark = useColorScheme() === 'dark';
  const colors = getThemeColors(isDark);

  // Bring over previous steps' data
  const previousData = route.params?.data || {};

  // --- State Management ---
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Toggle helpers
  const toggleType = (id: string) => {
    if (selectedTypes.includes(id)) {
      setSelectedTypes(selectedTypes.filter((item) => item !== id));
    } else {
      setSelectedTypes([...selectedTypes, id]);
    }
  };

  const toggleTopic = (id: string) => {
    if (selectedTopics.includes(id)) {
      // Allow deselection
      setSelectedTopics(selectedTopics.filter((item) => item !== id));
    } else if (selectedTopics.length < 5) {
      // Enforce max 5 limit
      setSelectedTopics([...selectedTopics, id]);
    } else {
      // Optional: Trigger a toast here saying "Maximum 5 topics allowed"
      console.log('Max 5 topics reached');
    }
  };

  const onReview = () => {
    // Navigate to the final Review/Summary screen
    navigation.navigate('CreatorReview', {
      data: {
        ...previousData,
        contentTypes: selectedTypes,
        topics: selectedTopics, // Updated from formats to topics
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.headerBg, borderBottomColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creator Application</Text>
        </View>
        <Text style={[styles.headerStepText, { color: colors.textMuted }]}>STEP 4 OF 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.stepIndicator}>FINAL STEP</Text>
          <Text style={[styles.mainHeading, { color: colors.textMain }]}>
            How do you share your message?
          </Text>
          <Text style={[styles.subHeading, { color: colors.textMuted }]}>
            Select the content types and topics you typically focus on to build community.
          </Text>
        </View>

        {/* Category 1: Content Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>CONTENT TYPE</Text>
            <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
              SELECT ALL THAT APPLY
            </Text>
          </View>

          <View style={styles.gridContainer}>
            {CONTENT_TYPES.map((type) => {
              const isActive = selectedTypes.includes(type.id);
              const activeContentColor = isDark ? '#FFF' : colors.primary;
              const contentColor = isActive ? activeContentColor : colors.textMuted;

              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor: isActive ? colors.primaryActive : colors.surface,
                      borderColor: isActive ? colors.accent : colors.surfaceBorder,
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

        {/* Category 2: Topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>TOPICS</Text>
            <Text
              style={[
                styles.sectionSub,
                { color: selectedTopics.length === 5 ? colors.accent : colors.textMuted },
              ]}
            >
              {selectedTopics.length} / 5 SELECTED
            </Text>
          </View>

          <View style={styles.tagsContainer}>
            {TOPICS.map((topic) => {
              const isActive = selectedTopics.includes(topic.id);
              // Disable unselected buttons if max limit is reached to guide the user
              const isDisabled = !isActive && selectedTopics.length >= 5;

              return (
                <TouchableOpacity
                  key={topic.id}
                  activeOpacity={0.7}
                  disabled={isDisabled}
                  style={[
                    styles.tagButton,
                    {
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      borderColor: isActive ? colors.primary : colors.surfaceBorder,
                      opacity: isDisabled ? 0.4 : 1, // Dim if they can't select more
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
                  <Text style={[styles.tagText, { color: isActive ? '#FFFFFF' : colors.primary }]}>
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Visual Decorative Element */}
        <View style={styles.impactCardWrapper}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
            }}
            style={styles.impactCard}
            imageStyle={{ opacity: 0.6 }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(3, 47, 60, 0.9)']}
              style={styles.impactGradient}
            >
              <Text style={styles.impactTitle}>MESSAGE IMPACT</Text>
              <Text style={styles.impactText}>Visual storytelling increases engagement by 4x.</Text>
            </LinearGradient>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>BACK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.accent }]}
          onPress={onReview}
        >
          <Text style={[styles.continueButtonText, { color: '#032F3C' }]}>REVIEW APPLICATION</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#032F3C" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 64,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#12D2D9',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  headerStepText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120, // Space for bottom nav
  },
  titleSection: {
    marginBottom: 32,
  },
  stepIndicator: {
    color: '#12D2D9',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  mainHeading: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 12,
  },
  subHeading: {
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  sectionSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
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
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  gridIcon: {
    marginBottom: 12,
  },
  gridText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 12,
    marginRight: 12,
  },
  tagIcon: {
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  impactCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    marginBottom: 32,
  },
  impactCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#032F3C',
  },
  impactGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  impactTitle: {
    color: '#12D2D9',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  impactText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  continueButtonText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginRight: 6,
  },
});

export default CreatorStepFour;
