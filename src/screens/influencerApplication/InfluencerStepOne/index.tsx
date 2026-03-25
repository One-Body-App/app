import React from 'react';
import {
  Platform,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { StackScreenProps } from '@react-navigation/stack';

import { SettingsStackParamsList } from '@/src/navigator/types';
import {
  APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
} from '@/src/styles/headerLayout';

// --- One Body Brand Palette ---
const OBPalette = {
  grays: {
    100: '#e6eaec',
    500: '#81979e',
    black: '#032f3c',
  },
  primary: {
    dark: '#126b87',
    base: '#41899f',
    50: '#71a6b7',
    25: '#a0c4cf',
    lightest: '#E7F0F3', // Mapped from design for the inner circle
  },
};

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerStepOne'>;

function InfluencerStepOne({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color={OBPalette.primary.dark} />
        </TouchableOpacity>
        {Platform.OS === 'ios' ? (
          <Text style={styles.headerTitle}>Creator Application</Text>
        ) : (
          <View style={styles.headerTitleAndroidWrap}>
            <Text style={styles.headerTitle}>Creator Application</Text>
          </View>
        )}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Banner with Concentric Circles */}
        <View style={styles.bannerContainer}>
          <View style={styles.circleOuter} />
          <View style={styles.circleMiddle} />
          <View style={styles.circleInner} />
          <View style={styles.circleWhite}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={32}
              color={OBPalette.primary.dark}
            />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>Creator Requirements</Text>
          <Text style={styles.subText}>
            Please read the necessary requirements for a Creator account on One Body.
          </Text>

          {/* Requirements Card */}
          <View style={styles.card}>
            <Text style={styles.cardText}>
              In order for you or your Organization to be a Creator, you must meet ONE of the
              following criteria:
            </Text>

            <Text style={[styles.cardText, styles.paragraphSpacing]}>
              A. You must be a Church, Pastor or clergy member in a local community.{' '}
              <Text style={styles.italic}>Confirmed through account review process.</Text>
            </Text>

            <Text style={[styles.cardText, styles.paragraphSpacing]}>
              B. You must be a non-clergy public figure or non-church Christian organization with a
              platform based on Christian values as defined by One Body.{' '}
              <Text style={styles.italic}>Confirmed through account review process.</Text>
            </Text>

            <Text style={[styles.cardText, styles.paragraphSpacing]}>
              *Your RSS feed must be publicly available. For News or Blog publishers.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('InfluencerStepTwo', {})}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: APP_HEADER_ROW_HEIGHT,
    transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
  },
  closeButton: {
    width: APP_HEADER_SIDE_WIDTH,
    height: APP_HEADER_ROW_HEIGHT,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleAndroidWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  headerTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    fontWeight: '500',
    color: OBPalette.grays.black,
    textAlign: Platform.OS === 'android' ? 'left' : 'center',
  },
  headerSpacer: {
    width: APP_HEADER_SIDE_WIDTH,
    height: APP_HEADER_ROW_HEIGHT,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  bannerContainer: {
    height: 140,
    backgroundColor: OBPalette.primary.dark,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circleOuter: {
    position: 'absolute',
    width: 375,
    height: 375,
    borderRadius: 187.5,
    backgroundColor: OBPalette.primary.base, // Approximating #89B5C3
    opacity: 0.8,
  },
  circleMiddle: {
    position: 'absolute',
    width: 241,
    height: 241,
    borderRadius: 120.5,
    backgroundColor: OBPalette.primary[25],
  },
  circleInner: {
    position: 'absolute',
    width: 121,
    height: 121,
    borderRadius: 60.5,
    backgroundColor: OBPalette.primary.lightest,
  },
  circleWhite: {
    position: 'absolute',
    width: 67,
    height: 67,
    borderRadius: 33.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heading: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 20,
    fontWeight: '600',
    color: OBPalette.grays.black,
    marginBottom: 8,
  },
  subText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: OBPalette.grays[500],
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: OBPalette.grays[100],
    borderRadius: 14,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  cardText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: OBPalette.grays.black,
  },
  paragraphSpacing: {
    marginTop: 16,
  },
  italic: {
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  startButton: {
    backgroundColor: OBPalette.primary.dark,
    borderRadius: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default InfluencerStepOne;
