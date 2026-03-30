import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
  APP_HEADER_TITLE_LINE_HEIGHT,
} from '@/src/styles/headerLayout';

export const BRAND_COLORS = {
  white: '#FFFFFF',
  black: '#032f3c',
  primaryDark: '#126b87',
  infoDark: '#12d2d9',
  successBg: '#EDFFF9',
  successText: '#12AC7B',
  overlay: 'rgba(3, 47, 60, 0.6)',
  grays: {
    100: '#e6eaec',
    200: '#cdd5d8',
    300: '#b3c1c5',
    400: '#9aacb1',
    500: '#81979e',
    600: '#68828a',
    700: '#4f6d77',
    800: '#355963',
    900: '#000015',
  },
} as const;

export type ServePalette = {
  isDark: boolean;
  background: string;
  text: string;
  subText: string;
  inputBg: string;
  inputBorder: string;
  borderColor: string;
  cardBg: string;
  tabInactive: string;
  accent: string;
};

export type ServeJob = {
  id: string;
  title: string;
  date: string;
  category: string;
  location: string;
  status: 'Public' | 'Private' | 'Open';
  organization: string;
  denomination: string;
  description: string;
  requirements: string[];
  compensation: string;
  frequency: string;
  opportunityType: string;
  applicationUrl: string;
  applicationSubmittedAt?: string;
};

export type ServeApplicant = {
  id: string;
  jobId: string;
  name: string;
  date: string;
  email: string;
  phone: string;
  location: string;
};

export const SERVE_JOBS: ServeJob[] = [
  {
    id: '1',
    title: 'Community manager for an accounting firm',
    date: '24 June, 23',
    category: 'Accounting',
    location: 'Toronto',
    status: 'Public',
    organization: 'Nick Crawford',
    denomination: 'Non-Denominational',
    description:
      'Support a growing accounting practice by leading client communication, coordinating team updates, and keeping internal systems organized.',
    requirements: ['Accounting skills', 'Tech skills', 'Strong communication'],
    compensation: '$50,000',
    frequency: 'Per year',
    opportunityType: 'Full time',
    applicationUrl: 'https://nickcrawford.com/apply',
    applicationSubmittedAt: '25 June, 23',
  },
  {
    id: '2',
    title: 'Youth program coordinator',
    date: '26 June, 23',
    category: 'Ministry',
    location: 'Atlanta',
    status: 'Private',
    organization: 'Grace Chapel',
    denomination: 'Baptist',
    description:
      'Coordinate weekly youth gatherings, volunteer schedules, and family communication for a growing student ministry.',
    requirements: ['Volunteer leadership', 'Event planning', 'Pastoral care'],
    compensation: '$22',
    frequency: 'Per hour',
    opportunityType: 'Part time',
    applicationUrl: 'https://gracechapel.org/jobs/youth',
  },
  {
    id: '3',
    title: 'Worship operations assistant',
    date: '28 June, 23',
    category: 'Worship',
    location: 'Nashville',
    status: 'Public',
    organization: 'River Church',
    denomination: 'Pentecostal',
    description:
      'Help prepare rehearsals, maintain worship planning files, and coordinate communication between worship and production teams.',
    requirements: ['Production coordination', 'Planning Center experience', 'Reliability'],
    compensation: '$36,000',
    frequency: 'Per year',
    opportunityType: 'Full time',
    applicationUrl: 'https://riverchurch.com/serve/worship-ops',
    applicationSubmittedAt: '30 June, 23',
  },
];

export const SERVE_APPLICANTS: ServeApplicant[] = [
  {
    id: 'a1',
    jobId: '1',
    name: 'Adam Smith',
    date: '24 June, 23',
    email: 'adamsmith@gmail.com',
    phone: '+1 234 3454 543',
    location: 'Toronto',
  },
  {
    id: 'a2',
    jobId: '1',
    name: 'Jade Ellis',
    date: '25 June, 23',
    email: 'jadeellis@gmail.com',
    phone: '+1 647 555 0190',
    location: 'Mississauga',
  },
  {
    id: 'a3',
    jobId: '2',
    name: 'Marcus Reed',
    date: '27 June, 23',
    email: 'marcusreed@gmail.com',
    phone: '+1 404 555 0107',
    location: 'Atlanta',
  },
  {
    id: 'a4',
    jobId: '3',
    name: 'Claire Watson',
    date: '29 June, 23',
    email: 'clairewatson@gmail.com',
    phone: '+1 615 555 0172',
    location: 'Franklin',
  },
];

export const SERVE_SAVED_JOB_IDS = ['1', '3'];
export const SERVE_APPLIED_JOB_IDS = ['1', '3'];
export const SERVE_MY_JOB_IDS = ['1', '2', '3'];

export function getServeJobById(jobId?: string): ServeJob {
  const fallbackJob = SERVE_JOBS[0];

  if (!fallbackJob) {
    throw new Error('Serve job seed data is unavailable.');
  }

  return SERVE_JOBS.find((job) => job.id === jobId) ?? fallbackJob;
}

export function getServeApplicantsByJobId(jobId?: string): ServeApplicant[] {
  const fallbackJobId = getServeJobById(jobId).id;

  return SERVE_APPLICANTS.filter((applicant) => applicant.jobId === fallbackJobId);
}

export const useServePalette = (): ServePalette => {
  const { dark } = useTheme();

  return {
    isDark: dark,
    background: dark ? BRAND_COLORS.grays[900] : BRAND_COLORS.white,
    text: dark ? BRAND_COLORS.white : BRAND_COLORS.black,
    subText: dark ? BRAND_COLORS.grays[300] : BRAND_COLORS.grays[600],
    inputBg: dark ? BRAND_COLORS.grays[800] : BRAND_COLORS.grays[100],
    inputBorder: dark ? BRAND_COLORS.grays[700] : BRAND_COLORS.grays[200],
    borderColor: dark ? BRAND_COLORS.grays[800] : BRAND_COLORS.grays[100],
    cardBg: dark ? BRAND_COLORS.grays[800] : BRAND_COLORS.white,
    tabInactive: dark ? BRAND_COLORS.grays[400] : BRAND_COLORS.grays[500],
    accent: dark ? BRAND_COLORS.infoDark : BRAND_COLORS.primaryDark,
  };
};

type ServeHeaderProps = {
  title: string;
  titleColor?: string;
  onBack: () => void;
  rightAccessory?: React.ReactNode;
};

export function ServeHeader({
  title,
  titleColor,
  onBack,
  rightAccessory,
}: ServeHeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View style={styles.headerSideSlot}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons
            name="chevron-left"
            size={32}
            color={titleColor || BRAND_COLORS.primaryDark}
          />
        </TouchableOpacity>
      </View>
      {Platform.OS === 'ios' ? (
        <View style={styles.headerCenterWrap} pointerEvents="none">
          <Text style={[styles.headerTitle, titleColor ? { color: titleColor } : null]}>
            {title}
          </Text>
        </View>
      ) : (
        <View style={styles.headerTitleAndroidWrap}>
          <Text style={[styles.headerTitle, titleColor ? { color: titleColor } : null]}>
            {title}
          </Text>
        </View>
      )}
      <View style={[styles.headerSideSlot, styles.headerRight]}>{rightAccessory}</View>
    </View>
  );
}

type ServeHubTab = 'Created' | 'Applied' | 'Saved';

const HUB_TAB_CONFIG: Array<{
  label: ServeHubTab;
  route: 'ConnectServeHome' | 'ConnectServeSaved' | 'ConnectServeApplied';
}> = [
  { label: 'Applied', route: 'ConnectServeApplied' },
  { label: 'Saved', route: 'ConnectServeSaved' },
  { label: 'Created', route: 'ConnectServeHome' },
];

type ServeHubTabsProps = {
  activeTab: ServeHubTab;
  navigation: NavigationProp<ConnectStackParamsList>;
  palette: ServePalette;
};

export function ServeHubTabs({
  activeTab,
  navigation,
  palette,
}: ServeHubTabsProps): React.JSX.Element {
  const activeIndex = HUB_TAB_CONFIG.findIndex((t) => t.label === activeTab);

  return (
    <View style={[styles.tabContainer, { borderBottomColor: palette.borderColor }]}>
      <View style={styles.tabScroll}>
        {HUB_TAB_CONFIG.map((tab, index) => {
          const isActive = tab.label === activeTab;

          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tab, isActive ? { borderBottomColor: palette.text } : null]}
              onPress={() => {
                const animation = index > activeIndex ? 'slide_from_right' : 'slide_from_left';
                navigation.navigate(tab.route, { _animation: animation });
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? palette.text : palette.tabInactive },
                  isActive ? styles.tabTextActive : null,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: APP_HEADER_ROW_HEIGHT,
    transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
  },
  headerSideSlot: {
    minWidth: APP_HEADER_SIDE_WIDTH,
    minHeight: APP_HEADER_ROW_HEIGHT,
    justifyContent: 'center',
  },
  backButton: {
    width: APP_HEADER_SIDE_WIDTH,
    minHeight: APP_HEADER_ROW_HEIGHT,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenterWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 16 + APP_HEADER_SIDE_WIDTH,
    right: 16 + APP_HEADER_SIDE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleAndroidWrap: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  headerTitle: {
    color: BRAND_COLORS.black,
    fontSize: 24,
    lineHeight: APP_HEADER_TITLE_LINE_HEIGHT,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.3,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tabContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 10,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Rubik-Medium',
  },
  tabTextActive: {
    fontWeight: '600',
    fontFamily: 'Rubik-Bold',
  },
});
