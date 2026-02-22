import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  iconContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#126b871a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginLeft: 12,
  },
  notificationBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderCol: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#126b87',
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },

  // Trending
  trendingCard: {
    width: 280,
    marginRight: 16,
  },
  trendingImage: {
    aspectRatio: 16 / 9,
    marginBottom: 12,
    justifyContent: 'flex-end',
    padding: 12,
  },
  liveBadge: {
    backgroundColor: '#126b87',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  trendingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendingMetaText: {
    fontSize: 14,
    marginLeft: 4,
  },

  // Creators
  creatorsSection: {
    paddingVertical: 24,
  },
  creatorCard: {
    width: 128,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 16,
  },
  creatorImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#126b87',
    marginBottom: 12,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  followBtn: {
    width: '100%',
    paddingVertical: 6,
    backgroundColor: '#126b87',
    borderRadius: 8,
    alignItems: 'center',
  },
  followBtnText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Serve
  serveCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  serveImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  serveContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  serveTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  serveSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  serveFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  serveLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serveLocationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#126b87',
    marginLeft: 4,
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#126b87',
  },
  joinBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#126b87',
  },

  // Events
  eventsSection: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  calendarBtn: {
    padding: 8,
    backgroundColor: '#126b87',
    borderRadius: 8,
  },
  eventImage: {
    aspectRatio: 16 / 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 12,
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 107, 135, 0.7)',
  },
  eventContent: {
    padding: 16,
    zIndex: 1,
  },
  eventDate: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
  },
  registerBtn: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  registerBtnText: {
    color: '#126b87',
    fontSize: 14,
    fontWeight: '700',
  },

  // Topics
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  topicCard: {
    width: '48%',
    height: 96,
    marginBottom: 12,
  },
  topicImage: {
    width: '100%',
    height: '100%',
  },
  topicOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  topicText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default styles;
