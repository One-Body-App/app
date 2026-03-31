import React from 'react';
import { Pressable } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { useSelector } from 'react-redux';
import SocialItem from '../SocialItem';
import { PostType } from '@/utils/types';

const mockReact = React;
const mockNavigate = jest.fn();
const mockImageSliderProps: any[] = [];
const mockFastImagePreload = jest.fn();

function mockFastImageComponent({
  children,
  ...props
}: {
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  return mockReact.createElement('FastImage', props, children);
}

(mockFastImageComponent as any).resizeMode = {
  contain: 'contain',
  cover: 'cover',
};
(mockFastImageComponent as any).preload = mockFastImagePreload;

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: mockNavigate,
    getParent: jest.fn(() => ({
      getParent: jest.fn(() => ({
        getParent: jest.fn(() => ({
          navigate: mockNavigate,
        })),
      })),
    })),
  })),
  useTheme: jest.fn(() => ({
    colors: {
      text: '#111111',
      border: '#cccccc',
      card: '#ffffff',
    },
  })),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-native-fast-image', () => mockFastImageComponent);

jest.mock('@/utils/ResponsiveFun', () => ({
  timeSince: jest.fn(() => '2 years'),
}));

jest.mock('@/components/comments/Thread', () => 'CommentThread');

jest.mock('@/components/mentions/ParsedText', () => {
  return function MockParsedText({ text, textStyle }: { text: string; textStyle?: object }) {
    return mockReact.createElement('Text', { style: textStyle }, text);
  };
});

jest.mock('../../styled/Text', () => {
  return function MockStyledText({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) {
    return mockReact.createElement('Text', props, children);
  };
});

jest.mock('../BaseItem', () => {
  return function MockBaseItem({ children }: { children?: React.ReactNode }) {
    return mockReact.createElement(mockReact.Fragment, null, children);
  };
});

jest.mock('../../imageSlider/ImageSlider', () => {
  return function MockImageSlider(props: any) {
    mockImageSliderProps.push(props);
    return mockReact.createElement('ImageSlider', props);
  };
});

jest.mock('../../CustomVideo', () => 'CustomVideo');
jest.mock('@/src/components/video/UniversalVideoCard', () => 'UniversalVideoCard');
jest.mock('@/src/components/video/universalVideoLayout', () => ({
  resolveVideoMetadata: jest.fn(() => ({
    aspectRatio: 16 / 9,
  })),
}));

jest.mock('@/services/repostSourceResolver', () => ({
  buildRepostSourceSnapshot: jest.fn((repost: any) => repost ?? null),
  isRepostSourceSnapshotMissing: jest.fn(() => false),
  resolveRepostSourceSnapshot: jest.fn(async () => null),
}));

const mockedUseSelector = useSelector as jest.Mock;

const buildPost = (overrides: Record<string, any> = {}) => ({
  postId: 'post-1',
  type: PostType.social,
  content: 'hello world',
  images: [],
  reactions: [],
  comments: [],
  userData: {
    _id: 'author-1',
    name: 'Author',
    username: 'author',
    profileImage: '',
  },
  ...overrides,
});

describe('SocialItem image interactions', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockFastImagePreload.mockReset();
    mockImageSliderProps.length = 0;
    mockedUseSelector.mockImplementation((selector) =>
      selector({
        auth: {
          getProfileData: { _id: 'viewer-1' },
          userToken: 'token-1',
        },
      })
    );
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      url: 'https://example.com/article',
      headers: {
        get: (name: string) => {
          if (name === 'content-type') {
            return 'text/html';
          }
          if (name === 'content-length') {
            return '128';
          }
          return null;
        },
      },
      text: async () =>
        '<html><head><title>Preview</title><meta property="og:description" content="Example" /></head></html>',
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens the full-screen viewer for top-level feed images without opening comments', async () => {
    const onCommentsPress = jest.fn();
    const onOpenImages = jest.fn();
    await act(async () => {
      TestRenderer.create(
        <SocialItem
          itemData={buildPost({
            images: [
              'https://cdn.example.com/post-image-1.jpg',
              'https://cdn.example.com/post-image-2.jpg',
            ],
          })}
          contentWidth={320}
          onOpenImages={onOpenImages}
          onCommentsPress={onCommentsPress}
        />
      );
      await Promise.resolve();
    });

    const topLevelSlider = mockImageSliderProps.find(
      (props) => typeof props.setImageModalIndexVisible === 'function'
    );

    act(() => {
      topLevelSlider.setImageModalIndexVisible(1);
    });

    expect(onCommentsPress).not.toHaveBeenCalled();
    expect(onOpenImages).toHaveBeenLastCalledWith(
      [
        { uri: 'https://cdn.example.com/post-image-1.jpg' },
        { uri: 'https://cdn.example.com/post-image-2.jpg' },
      ],
      1
    );
    expect(mockFastImagePreload).not.toHaveBeenCalled();
  });

  it('opens the full-screen viewer for repost source images without navigating away', async () => {
    const onCommentsPress = jest.fn();
    const onOpenImages = jest.fn();
    await act(async () => {
      TestRenderer.create(
        <SocialItem
          itemData={buildPost({
            content: 'repost wrapper',
            repost: {
              sourceType: 'social',
              sourceId: 'source-post-1',
              repostType: 'repost',
              sourceAuthorName: 'Source Author',
              sourceAuthorUsername: 'source_author',
              sourceContent: 'source post body',
              sourceImages: [
                'https://cdn.example.com/source-image-1.jpg',
                'https://cdn.example.com/source-image-2.jpg',
              ],
            },
          })}
          contentWidth={320}
          onOpenImages={onOpenImages}
          onCommentsPress={onCommentsPress}
        />
      );
      await Promise.resolve();
    });

    const sourceSlider = mockImageSliderProps.find(
      (props) =>
        typeof props.onImagePress === 'function' && props.images?.[0]?.url?.includes('source-image')
    );

    act(() => {
      sourceSlider.onImagePress(0);
    });

    expect(onCommentsPress).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(onOpenImages).toHaveBeenCalledWith(
      [
        { uri: 'https://cdn.example.com/source-image-1.jpg' },
        { uri: 'https://cdn.example.com/source-image-2.jpg' },
      ],
      0
    );
  });

  it('keeps source-card presses opening the source post when the card has no media', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <SocialItem
          itemData={buildPost({
            content: 'repost wrapper',
            repost: {
              sourceType: 'social',
              sourceId: 'source-post-2',
              repostType: 'repost',
              sourceAuthorName: 'Source Author',
              sourceAuthorUsername: 'source_author',
              sourceContent: 'text-only source post',
            },
          })}
        />
      );
      await Promise.resolve();
    });

    const pressables = renderer!.root.findAllByType(Pressable);

    act(() => {
      pressables[0].props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('SinglePost', {
      postId: 'source-post-2',
    });
  });

  it('does not fetch link previews for non-visible rows', async () => {
    await act(async () => {
      TestRenderer.create(
        <SocialItem
          itemData={buildPost({
            content: 'check this https://example.com/article',
          })}
          visible={false}
          contentWidth={320}
        />
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
