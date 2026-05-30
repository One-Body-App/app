import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import WatchOverlay from './WatchOverlay';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn((selector: (state: any) => unknown) =>
    selector({
      auth: {
        userToken: 'token-1',
        getProfileData: {
          _id: 'viewer-1',
          savedPost: [],
          following: [],
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

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('@fortawesome/free-solid-svg-icons', () => ({
  faEllipsis: {},
}));

jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');
jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialCommunityIcons');
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));
jest.mock('react-native-simple-toast', () => ({
  show: jest.fn(),
}));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('@/components/primitives/FastImage', () => 'FastImage');

jest.mock('@/src/components/styled/Text', () => 'StyledText');
jest.mock('@/src/components/listItems/OptionsModal', () => 'OptionsModal');
jest.mock('@/components/reactions/PostReactionsModal', () => 'PostReactionsModal');
jest.mock('@/src/components/CustomModal', () => 'CustomModal');
jest.mock('@/src/redux/actions/GeneralActions', () => ({
  setLoader: jest.fn(),
}));
jest.mock('@/src/redux/actions/UserAction', () => ({
  getuserGet: jest.fn(),
}));
jest.mock('@/services/api', () => ({
  ApiCall: jest.fn(),
}));
jest.mock('@/services/constants', () => ({
  NO_PROFILE_IMAGE: 'https://example.com/fallback.png',
}));
jest.mock('@/assets/icons/repeat.svg', () => 'RepeatIcon');
jest.mock('@/components/mentions/ParsedText', () => {
  return function MockParsedText(props: any) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    const mockReact = require('react');
    return mockReact.createElement('MockParsedText', {
      testID: 'watch-caption-parsed-text',
      ...props,
    });
  };
});

describe('WatchOverlay', () => {
  it('renders watch captions with ParsedText when mentions are present', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <WatchOverlay
          item={
            {
              id: 'watch-1',
              postId: 'watch-1',
              content: 'Hello @first',
              mentions: [
                {
                  userId: '507f1f77bcf86cd799439011',
                  username: 'first',
                  displayName: 'First Person',
                },
              ],
              date: '2026-03-07T10:00:00.000Z',
              handler: '',
              link: '',
              title: '',
              userData: {
                _id: 'creator-1',
                name: 'Creator',
                username: 'creator',
                accountType: 'individual',
                profileImage: '',
              },
              created: new Date('2026-03-07T10:00:00.000Z'),
              updated: new Date('2026-03-07T10:00:00.000Z'),
              reactions: [],
            } as any
          }
          commentCount={0}
          fromSavedPosts={false}
          onCommentsPress={jest.fn()}
          onProfilePress={jest.fn()}
          progress={0}
        />
      );
    });

    const parsedText = tree!.root.findByProps({
      testID: 'watch-caption-parsed-text',
    });

    expect(parsedText.props.text).toBe('Hello @first');
    expect(parsedText.props.mentions).toEqual([
      {
        userId: '507f1f77bcf86cd799439011',
        username: 'first',
        displayName: 'First Person',
      },
    ]);
  });
});
