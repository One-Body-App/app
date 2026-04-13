import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { useDispatch, useSelector } from 'react-redux';
import ProfileHeader from './ProfileHeader';
import { AccountType, User } from '../../../utils/types';

const mockNavigate = jest.fn();

function mockFastImageComponent({
  children,
  ...props
}: {
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  return React.createElement('FastImage', props, children);
}

(mockFastImageComponent as any).resizeMode = {
  contain: 'contain',
  cover: 'cover',
};

function mockAddIcon(props: Record<string, unknown>) {
  return React.createElement('AddIcon', props);
}

function mockStyledTextComponent({
  children,
  ...props
}: {
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  return React.createElement(Text, props, children);
}

function mockCustomModalComponent({
  children,
  modalVisible,
}: {
  children?: React.ReactNode;
  modalVisible?: boolean;
}) {
  return modalVisible ? React.createElement(React.Fragment, null, children) : null;
}

function mockMaterialIcon() {
  return null;
}

function mockCalendarIcon() {
  return null;
}

function mockHomeHashtagIcon() {
  return null;
}

function mockLinkIcon() {
  return null;
}

function mockLocationIcon() {
  return null;
}

function mockShieldTickIcon() {
  return null;
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: mockNavigate,
    getState: jest.fn(() => ({ routeNames: [] })),
    getParent: jest.fn(() => undefined),
  })),
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      text: '#111111',
    },
    dark: false,
  })),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-native-fast-image', () => mockFastImageComponent);

jest.mock('@react-native-vector-icons/material-design-icons', () => mockMaterialIcon);

jest.mock('iconsax-react-native', () => ({
  Add: mockAddIcon,
  Calendar: mockCalendarIcon,
  HomeHashtag: mockHomeHashtagIcon,
  Link21: mockLinkIcon,
  Location: mockLocationIcon,
  ShieldTick: mockShieldTickIcon,
}));

jest.mock('@/components/styled/Text', () => mockStyledTextComponent);

jest.mock('@/components/CustomModal', () => mockCustomModalComponent);

jest.mock('@/assets/svg/Selected.svg', () => 'Selected');

const mockedUseDispatch = useDispatch as unknown as jest.Mock;
const mockedUseSelector = useSelector as unknown as jest.Mock;

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    _id: 'user-1',
    accountType: AccountType.individual,
    badges: [],
    badgesData: [],
    bio: '',
    createdAt: '2026-03-01T00:00:00.000Z',
    deactivated: { isDeactivated: false },
    email: 'user@example.com',
    following: [],
    gender: '',
    interests: [],
    isInfluencer: false,
    isProfileCompleted: true,
    name: 'Nick Building',
    profile: {
      isLocationPublic: false,
    } as User['profile'],
    pushNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    subscribedToNewsletter: false,
    token: 'token',
    updatedAt: '2026-03-01T00:00:00.000Z',
    userId: 'user-1',
    username: 'nick',
    website: '',
    ...overrides,
  }) as User;

describe('ProfileHeader', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockedUseDispatch.mockReturnValue(jest.fn());
    mockedUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          getBadgesData: [],
          userToken: 'token',
        },
      })
    );
  });

  it('shows self-profile media controls and routes avatar and cover taps into EditProfile intent', () => {
    const user = buildUser();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ProfileHeader currentUser={user} profileData={user} variant="self" />
      );
    });

    const avatarButton = renderer!.root.findByProps({ testID: 'profile-avatar-edit-button' });
    const coverButton = renderer!.root.findByProps({ testID: 'profile-cover-edit-button' });

    act(() => {
      avatarButton.props.onPress();
    });

    act(() => {
      coverButton.props.onPress();
    });

    expect(mockNavigate).toHaveBeenNthCalledWith(1, 'EditProfile', { openMediaPicker: 'photo' });
    expect(mockNavigate).toHaveBeenNthCalledWith(2, 'EditProfile', { openMediaPicker: 'header' });
  });

  it('hides self-profile media controls on public profiles', () => {
    const currentUser = buildUser();
    const profileUser = buildUser({ _id: 'user-2', username: 'other-user' });
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ProfileHeader currentUser={currentUser} profileData={profileUser} variant="public" />
      );
    });

    expect(renderer!.root.findAllByProps({ testID: 'profile-avatar-edit-button' })).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ testID: 'profile-cover-edit-button' })).toHaveLength(0);
  });
});
