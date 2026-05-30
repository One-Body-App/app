/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import WatchComments from './watchComments';

const mockMentionInput = jest.fn((props: any) =>
  React.createElement('MockMentionInput', { testID: 'mock-mention-input', ...props })
);

const mockComposer = {
  activeMention: null,
  deleteMentionBeforeCursor: jest.fn(),
  hydrate: jest.fn(),
  mentionedUserIds: [],
  mentions: [],
  reset: jest.fn(),
  selectMention: jest.fn(),
  selection: { start: 0, end: 0 },
  setSelection: jest.fn(),
  setText: jest.fn(),
  text: '',
};

const mockApiCall = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetFlatList: ({ data, renderItem, ListEmptyComponent }: any) =>
    require('react').createElement(
      require('react').Fragment,
      null,
      Array.isArray(data) && data.length > 0
        ? data.map((item, index) =>
            require('react').createElement(
              require('react').Fragment,
              { key: item?.id ?? String(index) },
              renderItem({ item, index })
            )
          )
        : ListEmptyComponent
    ),
  BottomSheetTextInput: 'BottomSheetTextInput',
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector: (state: any) => unknown) =>
    selector({
      auth: {
        userToken: 'token-1',
        getProfileData: {
          _id: 'viewer-1',
          name: 'Viewer',
          username: 'viewer',
          profileImage: '',
        },
      },
    })
  ),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('react-native-toast-notifications', () => ({
  useToast: jest.fn(() => ({
    show: jest.fn(),
  })),
}));

jest.mock('@/src/services/api', () => ({
  ApiCall: (...args: any[]) => mockApiCall(...args),
}));

jest.mock('@/services/constants', () => ({
  NO_PROFILE_IMAGE: 'https://example.com/fallback.png',
}));

jest.mock('@/src/services/notification/taggedNotificationDispatch', () => ({
  queueTaggedNotificationDemo: jest.fn(() => Promise.resolve()),
  resolveNewTaggedUserIds: jest.fn(() => []),
}));

jest.mock('@/components/mentions', () => ({
  MentionInput: (props: any) => mockMentionInput(props),
  useMentionComposer: jest.fn(() => mockComposer),
  useMentionSuggestions: jest.fn(() => ({
    suggestions: [],
    isLoading: false,
    isError: false,
  })),
}));

jest.mock('./WatchCommentRow', () => {
  return function MockWatchCommentRow({
    item,
    onReply,
    onMentionPress,
  }: {
    item: any;
    onReply: (comment: any) => void;
    onMentionPress?: (handle: string) => void;
  }) {
    const mockReact = require('react');
    const { Pressable: MockPressable, Text: MockText } = require('react-native');
    return mockReact.createElement(
      mockReact.Fragment,
      null,
      mockReact.createElement(
        MockPressable,
        {
          testID: `reply-${item.id}`,
          onPress: () => onReply(item.comment),
        },
        mockReact.createElement(MockText, null, 'Reply')
      ),
      mockReact.createElement(
        MockPressable,
        {
          testID: `mention-${item.id}`,
          onPress: () => onMentionPress?.('first'),
        },
        mockReact.createElement(MockText, null, 'Mention')
      )
    );
  };
});

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('WatchComments', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockApiCall.mockResolvedValue({
      status: 200,
      response: {
        content: [
          {
            _id: 'comment-1',
            commentId: 'comment-1',
            content: 'Hello @first',
            date: '2026-03-07T10:00:00.000Z',
            created: '2026-03-07T10:00:00.000Z',
            updated: '2026-03-07T10:00:00.000Z',
            dateSeconds: 1709805600,
            objectId: 'watch-1',
            objectType: 'watch',
            mentions: [
              {
                userId: 'user-1',
                username: 'first',
                displayName: 'First Person',
              },
            ],
            mentionedUserIds: ['user-1'],
            reactions: [],
            response: [],
            userData: {
              _id: 'author-1',
              name: 'Author',
              username: 'author',
              profileImage: '',
            },
          },
        ],
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without a NavigationContainer and forwards thread and mention actions after dismiss', async () => {
    const onClose = jest.fn();
    const onOpenCommentThread = jest.fn();
    const onOpenMentionProfile = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <WatchComments
          postId="watch-1"
          initialCommentCount={1}
          onClose={onClose}
          onCountChange={jest.fn()}
          onOpenCommentThread={onOpenCommentThread}
          onOpenMentionProfile={onOpenMentionProfile}
        />
      );
    });
    await flushPromises();

    const replyButton = tree!.root.findByProps({ testID: 'reply-comment-1' });
    const mentionButton = tree!.root.findByProps({ testID: 'mention-comment-1' });

    act(() => {
      replyButton.props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenCommentThread).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(onOpenCommentThread).toHaveBeenCalledWith(
      expect.objectContaining({
        commentId: 'comment-1',
      })
    );

    act(() => {
      mentionButton.props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onOpenMentionProfile).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(onOpenMentionProfile).toHaveBeenCalledWith('first');
  });

  it('renders the composer with mention suggestions above the bottom field', async () => {
    await act(async () => {
      TestRenderer.create(
        <WatchComments
          postId="watch-1"
          initialCommentCount={0}
          onClose={jest.fn()}
          onCountChange={jest.fn()}
          onOpenCommentThread={jest.fn()}
          onOpenMentionProfile={jest.fn()}
        />
      );
    });
    await flushPromises();

    const mentionInputProps =
      mockMentionInput.mock.calls[mockMentionInput.mock.calls.length - 1][0];
    expect(mentionInputProps.suggestionsPlacement).toBe('above');
  });
});
