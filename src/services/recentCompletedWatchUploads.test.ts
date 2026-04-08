import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';
import { AccountType, type User, type WatchPost } from '@/utils/types';
import {
  buildRecentCompletedWatchUpload,
  clearRecentCompletedWatchUploadsForTests,
  mergeRecentCompletedWatchUploads,
  publishRecentCompletedWatchUpload,
  getRecentCompletedWatchUploadsSnapshot,
} from './recentCompletedWatchUploads';

const createPendingUpload = (overrides: Partial<PendingVideoUpload> = {}): PendingVideoUpload => ({
  id: 'pending-watch-1',
  status: 'complete',
  retryCount: 0,
  createdAt: '2026-04-08T01:29:06.079Z',
  updatedAt: '2026-04-08T01:29:21.004Z',
  recipe: {
    sourceUri: 'file:///tmp/source.mp4',
    caption: 'Fresh upload',
    trimStartMs: 0,
    trimEndMs: 5667,
    trimDurationMs: 5667,
    ratioId: '9:16',
    cropRect: {
      x: 0,
      y: 0,
      width: 720,
      height: 1280,
    },
    transform: {
      scale: 1,
      translateX: 0,
      translateY: 0,
    },
    sourceWidth: 1080,
    sourceHeight: 1920,
    outputWidth: 1080,
    outputHeight: 1920,
    videoBitrate: 5_000_000,
    audioBitrate: 128_000,
  },
  processedWidth: 1080,
  processedHeight: 1920,
  watchId: 'watch-1',
  ...overrides,
});

const currentUser: User = {
  _id: 'user-1',
  userId: 'user-1',
  name: 'Test User',
  username: 'tester',
  accountType: AccountType.individual,
  email: 'test@example.com',
  badges: [],
  badgesData: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deactivated: { isDeactivated: false },
  interests: [],
  isInfluencer: false,
  isProfileCompleted: true,
  gender: 'Female',
  token: '',
  following: [],
  pushNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  subscribedToNewsletter: false,
  website: '',
  profile: {
    dateOfBirth: '2000-01-01',
    gender: 'Female',
    location: {},
  },
};

describe('recentCompletedWatchUploads', () => {
  afterEach(() => {
    clearRecentCompletedWatchUploadsForTests();
  });

  it('builds and stores a recent completed upload snapshot', () => {
    const upload = buildRecentCompletedWatchUpload({
      item: createPendingUpload(),
      playBackId: 'playback-1',
      ownerUserId: 'user-1',
    });

    expect(upload).toMatchObject({
      itemId: 'pending-watch-1',
      ownerUserId: 'user-1',
      watchId: 'watch-1',
      playBackId: 'playback-1',
      content: 'Fresh upload',
      aspectRatio: 1080 / 1920,
    });

    publishRecentCompletedWatchUpload(upload!);

    expect(getRecentCompletedWatchUploadsSnapshot()).toEqual([upload]);
  });

  it('merges a recent completed upload into a watch list for the current user', () => {
    const upload = buildRecentCompletedWatchUpload({
      item: createPendingUpload(),
      playBackId: 'playback-1',
      ownerUserId: 'user-1',
    });
    publishRecentCompletedWatchUpload(upload!);

    const merged = mergeRecentCompletedWatchUploads({
      posts: [],
      recentUploads: getRecentCompletedWatchUploadsSnapshot(),
      user: currentUser,
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      playBackId: 'playback-1',
      content: 'Fresh upload',
      userData: {
        _id: 'user-1',
        username: 'tester',
      },
    });
  });

  it('does not duplicate a watch post that is already present from the backend', () => {
    const upload = buildRecentCompletedWatchUpload({
      item: createPendingUpload(),
      playBackId: 'playback-1',
      ownerUserId: 'user-1',
    });

    const existingPost: WatchPost = {
      _id: 'watch-1',
      id: 'watch-1',
      postId: 'watch-1',
      playBackId: 'playback-1',
      content: 'Fresh upload',
      date: '2026-04-08T01:29:06.079Z',
      handler: 'tester',
      link: '',
      title: '',
      userData: {
        _id: 'user-1',
        name: 'Test User',
        username: 'tester',
        accountType: AccountType.individual,
        profileImage: '',
      },
      created: new Date('2026-04-08T01:29:06.079Z'),
      updated: new Date('2026-04-08T01:29:21.004Z'),
      reactions: [],
    };

    const merged = mergeRecentCompletedWatchUploads({
      posts: [existingPost],
      recentUploads: [upload!],
      user: currentUser,
    });

    expect(merged).toEqual([existingPost]);
  });
});
