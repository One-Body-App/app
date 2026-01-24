import { StyleSheet } from 'react-native';

export default function createLoginStyles(isDark: boolean) {
  const palette = {
    background: isDark ? '#202328' : '#F7F7F7',
    card: isDark ? '#0D0D0D' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F3F3',
    textMain: isDark ? '#FFFFF7' : '#032F3C',
    textSecondary: isDark ? '#999DA1' : '#5A5C5B',
    primary: '#126B87',
    divider: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F3F3',
    inputBg: isDark ? '#202328' : '#F2F3F3',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F3F3',
    placeholder: isDark ? '#999DA1' : '#838584',
    successBg: isDark ? 'rgba(18, 172, 123, 0.15)' : '#EDFFF9',
    successText: '#12AC7B',
    error: '#DC2C10',
    footer: '#126B87',
  };

  return StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    headerFrame: {
      marginTop: 18,
      paddingHorizontal: 16,
    },
    welcomeText: {
      fontFamily: 'Rubik',
      fontWeight: '600',
      fontSize: 40,
      lineHeight: 48,
      color: palette.textMain,
      marginBottom: 8,
    },
    subHeaderText: {
      fontFamily: 'Lato',
      fontSize: 16,
      lineHeight: 24,
      color: palette.textSecondary,
    },
    cardContainer: {
      marginTop: 30,
      marginHorizontal: 12,
      backgroundColor: palette.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      padding: 16,
    },
    newAccountRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    newAccountText: {
      fontFamily: 'Lato',
      fontSize: 16,
      color: palette.textSecondary,
    },
    newAccountLink: {
      fontFamily: 'Lato',
      fontSize: 16,
      color: palette.primary,
    },
    inputLabel: {
      fontFamily: 'Lato',
      fontSize: 16,
      color: palette.textMain,
      marginBottom: 8,
    },
    inputWrapper: {
      backgroundColor: palette.inputBg,
      borderColor: palette.inputBorder,
      borderRadius: 12,
    },
    inputSpacer: {
      marginBottom: 18,
    },
    primaryBtn: {
      backgroundColor: palette.primary,
      height: 56,
      width: '100%',
      borderRadius: 999,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    primaryBtnText: {
      fontFamily: 'Lato',
      fontWeight: '600',
      fontSize: 18,
      color: '#FFFFFF',
    },
    successAlertBox: {
      backgroundColor: palette.successBg,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(18, 172, 123, 0.25)',
    },
    successAlertText: {
      fontFamily: 'Rubik',
      fontSize: 14,
      color: palette.successText,
      lineHeight: 22,
    },
    socialSection: {
      marginTop: 22,
      alignItems: 'center',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      width: '100%',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: palette.divider,
    },
    orText: {
      marginHorizontal: 10,
      fontFamily: 'Lato',
      fontSize: 16,
      color: palette.textSecondary,
    },
    socialIconsRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      width: '100%',
      marginTop: 8,
      marginBottom: 12,
    },
    socialBtn: {
      width: 64,
      height: 56,
      borderWidth: 1,
      borderColor: palette.inputBorder,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.card,
    },
    socialIcon: {
      width: 28,
      height: 28,
      resizeMode: 'contain',
    },
    forgotPasswordText: {
      marginTop: 8,
      fontFamily: 'Lato',
      fontSize: 16,
      color: palette.primary,
      textAlign: 'center',
    },
    scriptureFooter: {
      marginTop: 50,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    unifyText: {
      fontFamily: 'Lato',
      fontWeight: '500',
      fontSize: 14,
      color: palette.footer,
      marginRight: 10,
    },
    referenceText: {
      fontFamily: 'Open Sans',
      fontSize: 14,
      color: palette.footer,
    },
    fieldError: {
      color: palette.error,
      fontSize: 12,
      marginBottom: 10,
      fontFamily: 'Lato',
      textAlign: 'center',
    },
    placeholderColor: {
      color: palette.placeholder,
    },
  });
}
