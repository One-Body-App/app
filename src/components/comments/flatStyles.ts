import { StyleSheet } from 'react-native';

export const flatStyles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterButton: {
    marginRight: 20,
    paddingVertical: 4,
  },
  filterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterTextActive: {
    fontWeight: '700',
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
  },
  authorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  authorHandle: {
    fontSize: 13,
    flexShrink: 1,
  },
  dot: {
    marginHorizontal: 6,
    fontSize: 12,
    opacity: 0.8,
  },
  time: {
    fontSize: 13,
    flexShrink: 1,
  },
  replyContext: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
  },
  contentText: {
    marginTop: 4,
    fontSize: 17,
    lineHeight: 24,
  },
  imageWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  gif: {
    width: '100%',
    minHeight: 180,
    borderRadius: 12,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionCount: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  commentThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentThreadCount: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  reactionPicker: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101214',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#262a30',
    alignSelf: 'flex-start',
  },
  reactionPickerButton: {
    marginHorizontal: 4,
  },
  reactionPickerIcon: {
    width: 24,
    height: 24,
  },
});
