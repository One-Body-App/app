import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import FeedAvatar from '../FeedAvatar';

jest.mock('@/services/constants', () => ({
  NO_PROFILE_IMAGE: 'https://cdn.onebodyapp.com/user/no-image.png',
}));

jest.mock('@/assets/svg/ProfileFill.svg', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const mockReact = require('react');

  return function MockProfileFill(props: Record<string, unknown>) {
    return mockReact.createElement('ProfileFill', props);
  };
});

describe('FeedAvatar', () => {
  it('renders the historical placeholder image when the uri is missing', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<FeedAvatar uri="" size={40} testID="feed-avatar" />);
    });

    const image = renderer!.root.findByProps({ testID: 'feed-avatar-image' });
    expect(image.props.source).toEqual({ uri: 'https://cdn.onebodyapp.com/user/no-image.png' });
  });

  it('renders the historical placeholder image when the uri is the configured placeholder', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <FeedAvatar
          uri="https://cdn.onebodyapp.com/user/no-image.png"
          size={40}
          testID="feed-avatar"
        />
      );
    });

    const image = renderer!.root.findByProps({ testID: 'feed-avatar-image' });
    expect(image.props.source).toEqual({ uri: 'https://cdn.onebodyapp.com/user/no-image.png' });
  });

  it('renders an image for a real avatar url and falls back to the placeholder image on load error', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <FeedAvatar uri="https://cdn.example.com/real-avatar.png" size={40} testID="feed-avatar" />
      );
    });

    const image = renderer!.root.findByProps({ testID: 'feed-avatar-image' });
    expect(image.props.source).toEqual({ uri: 'https://cdn.example.com/real-avatar.png' });

    act(() => {
      image.props.onError();
    });

    const fallbackImage = renderer!.root.findByProps({ testID: 'feed-avatar-image' });
    expect(fallbackImage.props.source).toEqual({
      uri: 'https://cdn.onebodyapp.com/user/no-image.png',
    });
  });

  it('renders the branded shell only if the placeholder image itself also fails', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<FeedAvatar uri="" size={40} testID="feed-avatar" />);
    });

    const placeholderImage = renderer!.root.findByProps({ testID: 'feed-avatar-image' });
    act(() => {
      placeholderImage.props.onError();
    });

    expect(renderer!.root.findByProps({ testID: 'feed-avatar-fallback' })).toBeTruthy();
  });
});
