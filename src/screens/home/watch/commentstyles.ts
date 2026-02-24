import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#13ecc8',
  bgDark: '#0f1419',
  white: '#f6f6f7',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  white10: 'rgba(255, 255, 255, 0.1)',
  white5: 'rgba(255, 255, 255, 0.05)',
  primary20: 'rgba(19, 236, 200, 0.2)',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.slate100,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerCount: {
    color: COLORS.slate400,
    fontSize: 17,
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 18,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyStateText: {
    color: COLORS.slate400,
    fontSize: 14,
  },
  loadingMoreWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  composerArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.white10,
    backgroundColor: COLORS.bgDark,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  replyingBanner: {
    backgroundColor: COLORS.white5,
    borderWidth: 1,
    borderColor: COLORS.white10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyingText: {
    color: COLORS.slate300,
    fontSize: 12,
    fontWeight: '600',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputAvatarWrap: {
    marginRight: 8,
  },
  inputAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.primary20,
    backgroundColor: COLORS.white5,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.white10,
    backgroundColor: '#171d24',
    color: COLORS.slate100,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 16,
    marginRight: 8,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#00221b',
    fontWeight: '700',
    fontSize: 19,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  emoji: {
    fontSize: 28,
    marginRight: 16,
  },
});
