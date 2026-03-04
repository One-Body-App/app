import { StyleSheet } from 'react-native';
import { spacing } from '@/src/styles/spacing';
import { containFrame } from '@/src/styles/colors';

// BRAND COLORS
const BRAND = {
  gray100: '#e6eaec',
  gray200: '#cdd5d8',
  gray400: '#9aacb1',
  gray800: '#355963',
  primary: '#41899f',
  primaryDark: '#126b87',
  primaryBase: '#41899f',
  accentBase: '#41dbe1',
  accentDark: '#12d2d9',
  black: '#032f3c',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // --- New Tab Navigation Styles ---
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.x16,
    paddingTop: spacing.x5,
    paddingBottom: spacing.x8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.gray100,
    backgroundColor: BRAND.white,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tabItemSelected: {},
  tabLabelUnderline: {
    paddingBottom: spacing.x8,
    paddingHorizontal: 5,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabLabelUnderlineSelected: {
    borderBottomColor: BRAND.primaryDark,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: BRAND.gray400,
  },
  tabTextSelected: {
    color: BRAND.primaryDark,
    fontWeight: '700',
  },

  // --- "What's on your mind?" Input ---
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.x13,
    marginHorizontal: 7,
    marginVertical: spacing.x16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.x13,
    backgroundColor: BRAND.gray200,
  },
  promptInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
  },
  promptIcon: {
    padding: 8,
    borderRadius: 20,
  },

  // --- Discovery Section ---
  discoveryContainer: {
    paddingVertical: spacing.x16,
    marginBottom: spacing.x8,
  },
  discoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    marginBottom: spacing.x13,
  },
  discoveryScrollContent: {
    paddingHorizontal: spacing.x16,
  },
  discoveryCard: {
    width: 150,
    padding: spacing.x13,
    marginRight: spacing.x13,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryProfileTouch: {
    alignItems: 'center',
    width: '100%',
  },
  discoveryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.gray200,
  },
  discoveryMeta: {
    fontSize: 11,
    color: BRAND.gray400,
    marginBottom: 8,
  },
  discoveryConnectButton: {
    backgroundColor: BRAND.accentBase,
    paddingVertical: 6,
    width: '100%',
    alignItems: 'center',
    borderRadius: 20,
  },
  discoveryConnectButtonText: {
    color: BRAND.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  discoverySeeAllCard: {
    width: 55,
    marginRight: spacing.x13,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.x16,
    paddingHorizontal: spacing.x10,
    backgroundColor: 'rgba(18, 210, 217, 0.08)',
  },
  discoverySeeAllText: {
    color: BRAND.primaryDark,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  // --- Modern Feed Card ---
  cardContainer: {
    marginBottom: spacing.x16,
    paddingVertical: spacing.x16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    marginBottom: spacing.x13,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeAgo: {
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    paddingHorizontal: spacing.x16,
    marginBottom: spacing.x13,
    fontSize: 14,
    lineHeight: 20,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: containFrame,
    marginTop: spacing.x5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    paddingTop: spacing.x13,
    marginTop: spacing.x5,
    borderTopWidth: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Loading
  loading: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endOfFeedContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    paddingTop: spacing.x8,
    paddingBottom: spacing.x24,
  },
  endOfFeedText: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '100',
    textShadowColor: 'rgba(18, 210, 217, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default styles;
