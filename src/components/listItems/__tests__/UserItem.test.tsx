import React from 'react';
import { Pressable, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import UserItem from '../UserItem';
import type { User } from '@/utils/types';

const mockReact = React;
const mockApiCall = jest.fn();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockToastShow = jest.fn();

let mockState = {
  auth: {
    userToken: 'token-1',
    getProfileData: {
      following: [] as string[],
    },
  },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: mockNavigate,
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
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

jest.mock('react-native-simple-toast', () => ({
  LONG: 'long',
  show: (...args: unknown[]) => mockToastShow(...args),
}));

jest.mock('@/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));

jest.mock('@/src/redux/actions/AuthActions', () => ({
  getProfile: {
    Request: jest.fn((payload) => ({ type: 'GET_PROFILE_REQUEST', payload })),
  },
}));

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

jest.mock('@/components/primitives/FastImage', () => mockFastImageComponent);
jest.mock('@react-native-vector-icons/entypo', () => 'Entypo');
jest.mock('react-native-paper', () => ({
  Caption: 'Caption',
  Button: 'PaperButton',
}));

const buildUser = (overrides: Partial<User> = {}) =>
  ({
    _id: 'canonical-user-id',
    id: 'search-doc-id',
    userId: 'legacy-user-id',
    name: 'Nick Example',
    username: 'nick',
    profileImage: '',
    profile: {},
    following: [],
    badges: [],
    badgesData: [],
    interests: [],
    deactivated: { isDeactivated: false },
    accountType: 'individual',
    createdAt: '',
    updatedAt: '',
    email: '',
    isInfluencer: false,
    isProfileCompleted: true,
    website: '',
    gender: '',
    token: '',
    pushNotificationsEnabled: false,
    emailNotificationsEnabled: false,
    subscribedToNewsletter: false,
    ...overrides,
  }) as User;

const pressConnectionButton = async (renderer: TestRenderer.ReactTestRenderer) => {
  const buttonPressable = renderer.root.findAllByType(Pressable)[1];
  await act(async () => {
    buttonPressable.props.onPress({});
    await Promise.resolve();
    await Promise.resolve();
  });
};

const getRenderedText = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map((node) => node.props.children);

const renderUserItem = async (item: User) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    renderer = TestRenderer.create(<UserItem item={item} />);
  });
  return renderer!;
};

describe('UserItem follow actions', () => {
  beforeEach(() => {
    mockApiCall.mockReset();
    mockDispatch.mockReset();
    mockNavigate.mockReset();
    mockToastShow.mockReset();
    mockState = {
      auth: {
        userToken: 'token-1',
        getProfileData: {
          following: [],
        },
      },
    };
  });

  it('uses the canonical user id when connecting from a search result', async () => {
    mockApiCall.mockResolvedValue({ status: 200, response: 1 });
    const renderer = await renderUserItem(buildUser());

    await pressConnectionButton(renderer);

    expect(mockApiCall).toHaveBeenCalledWith({
      route: 'user/subscribe/canonical-user-id',
      token: 'token-1',
      verb: 'patch',
    });
    expect(getRenderedText(renderer)).toContain('Connected');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'GET_PROFILE_REQUEST',
      payload: { token: 'token-1' },
    });
  });

  it('uses the canonical user id when disconnecting an existing connection', async () => {
    mockState.auth.getProfileData.following = ['canonical-user-id'];
    mockApiCall.mockResolvedValue({ status: 200, response: 1 });
    const renderer = await renderUserItem(buildUser());

    await pressConnectionButton(renderer);

    expect(mockApiCall).toHaveBeenCalledWith({
      route: 'user/unsubscribe/canonical-user-id',
      token: 'token-1',
      verb: 'patch',
    });
    expect(getRenderedText(renderer)).toContain('Connect');
  });

  it('keeps the previous button state and shows the error toast on failure', async () => {
    mockApiCall.mockResolvedValue({ status: 400, response: { message: 'Wrong user to follow' } });
    const renderer = await renderUserItem(buildUser());

    await pressConnectionButton(renderer);

    expect(mockToastShow).toHaveBeenCalledWith('Error following, please try again later.', 'long');
    expect(getRenderedText(renderer)).toContain('Connect');
  });
});
