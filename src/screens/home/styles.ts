import { StyleSheet } from 'react-native';
import { getFontSize } from '@/utils/ResponsiveFun';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

// BRAND COLORS
const BRAND = {
  gray100: '#e6eaec',
  gray200: '#cdd5d8',
  gray400: '#9aacb1',
  gray800: '#355963',
  primary: '#126b87',
  primaryBase: '#41899f',
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
    paddingTop: spacing.x10,
    paddingBottom: spacing.x8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[800],
    backgroundColor: Colors.neutral[900],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.x8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemSelected: {
    borderBottomColor: Colors.primarySapphire.brand,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: Colors.neutral[300],
  },
  tabTextSelected: {
    color: Colors.primarySapphire.brand,
    fontWeight: '700',
  },

  // --- "What's on your mind?" Input ---
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.x13,
    marginHorizontal: spacing.x16,
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
  discoveryCard: {
    width: 150,
    padding: spacing.x13,
    marginRight: spacing.x13,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginTop: spacing.x5,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
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
});

export default styles;
