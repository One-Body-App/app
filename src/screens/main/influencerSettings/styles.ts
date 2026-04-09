import { StyleSheet } from 'react-native';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

export const C = {
  sapphireDark: '#126B87',
  sapphireBase: '#41899F',
  cyan: '#12D2D9',
  cyanLight: '#D0F6F7',
  gray100: '#E6EAEC',
  gray200: '#CDD5D8',
  gray400: '#9AACB1',
  gray700: '#4F6D77',
  successBg: '#EDFFF9',
  successText: '#008359',
  errorBg: '#FCEAE7',
  errorText: '#DC2C10',
  warnText: '#D96A00',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 112,
  },

  // Outer wrapper with consistent horizontal margins
  inner: {
    marginHorizontal: spacing.x24,
    marginTop: spacing.x16,
  },

  // Status banner
  statusBanner: {
    borderRadius: borderRadius.base,
    paddingVertical: spacing.x12,
    paddingHorizontal: spacing.x16,
    marginBottom: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: borderRadius.max,
    marginRight: spacing.x10,
  },
  statusText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // Section card — matches editProfile inputGroup
  card: {
    borderColor: Colors.neutral[800],
    borderWidth: borderWidth.base,
    borderRadius: borderRadius.base,
    padding: spacing.x20,
    marginBottom: spacing.x16,
  },

  // Section header row (title + optional under-review tag)
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.x20,
  },
  cardTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  reviewTag: {
    backgroundColor: C.cyanLight,
    borderRadius: borderRadius.max,
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x2,
  },
  reviewTagText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 10,
    color: C.cyan,
    letterSpacing: 0.3,
  },

  // Field group: label + input
  fieldGroup: {
    marginBottom: spacing.x20,
  },
  fieldGroupLast: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontFamily: 'OpenSans-Regular',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: spacing.x8,
  },

  // Badge chips
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.x4,
  },
  badgeChip: {
    paddingHorizontal: spacing.x12,
    paddingVertical: spacing.x8,
    borderRadius: borderRadius.button,
    borderWidth: borderWidth.thin,
    borderColor: Colors.neutral[800],
    backgroundColor: Colors.neutral[700],
    marginRight: spacing.x8,
    marginBottom: spacing.x8,
  },
  badgeChipSelected: {
    backgroundColor: C.cyan,
    borderColor: C.cyan,
  },
  badgeText: {
    fontFamily: 'OpenSans-Regular',
    fontWeight: '600',
    fontSize: 13,
    color: Colors.neutral[300],
  },
  badgeTextSelected: {
    color: C.white,
  },
  badgeHint: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,
    color: Colors.neutral[400],
    marginTop: spacing.x6,
  },

  // Content source row
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.x12,
  },
  sourceInputWrap: {
    flex: 1,
  },
  sourceDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.max,
    borderWidth: borderWidth.thin,
    borderColor: Colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.x8,
    marginTop: spacing.x8,
  },
  sourceDeleteText: {
    fontSize: 18,
    lineHeight: 20,
    color: C.errorText,
    fontFamily: 'Rubik-Medium',
  },

  // Add source button
  addSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.x10,
    marginTop: spacing.x4,
  },
  addSourceCircle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.max,
    backgroundColor: C.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.x10,
  },
  addSourcePlus: {
    color: C.white,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: 'Rubik-Medium',
  },
  addSourceLabel: {
    fontFamily: 'OpenSans-Regular',
    fontWeight: '600',
    fontSize: 13,
    color: C.sapphireDark,
    letterSpacing: 0.2,
  },
  sourceCapMsg: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: C.gray400,
    marginTop: spacing.x8,
    fontStyle: 'italic',
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.x8,
  },
  toggleLeft: {
    flex: 1,
    paddingRight: spacing.x16,
  },
  toggleTitle: {
    fontFamily: 'OpenSans-Regular',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: spacing.x2,
  },
  toggleSub: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: C.gray400,
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.neutral[800],
    marginVertical: spacing.x4,
  },

  // Fixed save button
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.x24,
    paddingBottom: spacing.x32,
    paddingTop: spacing.x12,
  },
  saveBtn: {
    borderRadius: borderRadius.button,
    paddingVertical: spacing.x16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.sapphireBase,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 15,
    color: C.white,
    letterSpacing: 0.4,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 90,
    left: spacing.x24,
    right: spacing.x24,
    borderRadius: borderRadius.base,
    paddingVertical: spacing.x12,
    paddingHorizontal: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  toastText: {
    flex: 1,
    fontFamily: 'Rubik-Medium',
    fontSize: 13,
    color: C.white,
  },

  // Claim screen
  claimWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x32,
  },
  claimIconCircle: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.max,
    backgroundColor: C.cyanLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.x24,
  },
  claimTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: spacing.x10,
  },
  claimBody: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    color: C.gray700,
    marginBottom: spacing.x32,
  },
  claimBtn: {
    backgroundColor: C.cyan,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.x16,
    paddingHorizontal: spacing.x48,
    alignItems: 'center',
  },
  claimBtnText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 15,
    color: C.white,
    letterSpacing: 0.4,
  },
});

export default styles;
