import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import DrawerContent from './DrawerContent';

const mockUseSelector = jest.fn();
const mockDispatch = jest.fn();
const mockDrawerItems: string[] = [];

function mockButton({ text, onPress, leftIcon }: any) {
  return React.createElement(
    TouchableOpacity,
    { onPress },
    React.createElement(View, null, leftIcon),
    React.createElement(Text, null, text)
  );
}

jest.mock('@react-navigation/drawer', () => ({
  DrawerContentScrollView: ({ children }: { children?: React.ReactNode }) => {
    const ReactLocal = jest.requireActual('react') as typeof import('react');
    const ReactNative = jest.requireActual('react-native') as typeof import('react-native');
    return ReactLocal.createElement(ReactNative.View, { testID: 'drawer-scroll' }, children);
  },
  DrawerItem: ({ label }: { label: string }) => {
    const ReactLocal = jest.requireActual('react') as typeof import('react');
    const ReactNative = jest.requireActual('react-native') as typeof import('react-native');
    mockDrawerItems.push(label);
    return ReactLocal.createElement(ReactNative.Text, null, label);
  },
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) => mockUseSelector(selector),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('@react-navigation/native', () => ({
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      background: '#ffffff',
      border: '#d9dfe2',
      text: '#032f3c',
    },
  })),
}));

jest.mock('react-native-fast-image', () => 'FastImage');
jest.mock('react-native-fbsdk-next', () => ({
  LoginManager: {
    logOut: jest.fn(),
  },
}));
jest.mock('@react-native-vector-icons/ant-design', () => 'AntDesignIcon');
jest.mock('@react-native-vector-icons/feather', () => 'FeatherIcon');
jest.mock('iconsax-react-native', () => ({
  LogoutCurve: 'LogoutCurve',
  ProfileAdd: 'ProfileAdd',
  Profile2User: 'Profile2User',
  Setting2: 'Setting2',
}));
jest.mock('@/services/constants', () => ({
  NO_PROFILE_IMAGE: 'https://cdn.example.com/no-profile.png',
  OpenURLButton: jest.fn(),
}));
jest.mock('../components/styled/Text', () => 'StyledText');
jest.mock('../components/Button', () => ({
  __esModule: true,
  default: mockButton,
}));
jest.mock('../redux/actions/AuthActions', () => ({
  logout: jest.fn(() => ({ type: 'LOGOUT' })),
}));
jest.mock('../services/authTokens', () => ({
  clearAuthTokens: jest.fn(),
}));
jest.mock('@/assets/icons/home2.svg', () => 'Home2Icon');
jest.mock('@/assets/svg/zoeicon.svg', () => 'ZoeIcon');
jest.mock('@/assets/svg/Business-User-Curriculum--Streamline-Core.svg', () => 'ServeIcon');
jest.mock('@/assets/svg/Calendar-Edit--Streamline-Core-Remix.svg', () => 'GoIcon');

const baseUser = {
  _id: 'user-1',
  accountType: 'individual',
  badges: [],
  badgesData: [],
  createdAt: '2026-04-08T00:00:00.000Z',
  deactivated: { isDeactivated: false },
  email: 'user@example.com',
  interests: [],
  isInfluencer: false,
  isProfileCompleted: true,
  name: 'Test User',
  profile: {
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    location: {},
  },
  token: '',
  updatedAt: '2026-04-08T00:00:00.000Z',
  userId: 'user-1',
  username: 'testuser',
  website: '',
  following: [],
  gender: 'Male',
  pushNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  subscribedToNewsletter: false,
};

const createProps = () =>
  ({
    descriptors: {
      'Main-key': {
        options: {
          drawerActiveTintColor: '#126b87',
          drawerInactiveTintColor: '#032f3c',
          drawerActiveBackgroundColor: '#eff4f6',
        },
      },
    },
    state: {
      index: 0,
      routes: [{ key: 'Main-key', name: 'Main' }],
      routeNames: ['Main', 'ZoeAI', 'Saved', 'Connections', 'Settings'],
    },
    navigation: {
      navigate: jest.fn(),
    },
  }) as any;

describe('DrawerContent ZoeAI visibility', () => {
  beforeEach(() => {
    mockDrawerItems.length = 0;
    mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          getProfileData: baseUser,
        },
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ZoeAI drawer item for eligible users', () => {
    const props = createProps();

    mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          getProfileData: {
            ...baseUser,
            influencerProfile: {
              influencerStatus: 'approved',
            },
          },
        },
      })
    );

    act(() => {
      TestRenderer.create(
        <DrawerContent
          descriptors={props.descriptors}
          navigation={props.navigation}
          state={props.state}
        />
      );
    });

    expect(mockDrawerItems).toContain('ZoeAI');
  });

  it('omits the ZoeAI drawer item for ineligible users', () => {
    const props = createProps();

    act(() => {
      TestRenderer.create(
        <DrawerContent
          descriptors={props.descriptors}
          navigation={props.navigation}
          state={props.state}
        />
      );
    });

    expect(mockDrawerItems).not.toContain('ZoeAI');
  });

  it('dispatches the shared logout action from the drawer confirm dialog', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const props = createProps();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <DrawerContent
          descriptors={props.descriptors}
          navigation={props.navigation}
          state={props.state}
        />
      );
    });

    const buttons = renderer!.root.findAllByType(mockButton);
    expect(buttons.length).toBeGreaterThan(0);

    act(() => {
      buttons[0]?.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalled();
    const confirmButtons = alertSpy.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    const confirmAction = confirmButtons.find((item) => item.text === 'Yes');

    act(() => {
      confirmAction?.onPress?.();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOGOUT' });
  });
});
