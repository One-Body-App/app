import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ActivityIndicator, Text } from 'react-native';
import { DrawerPlaceholderScreen } from './DrawerStack';

jest.mock('@react-navigation/drawer', () => ({
  createDrawerNavigator: jest.fn(() => ({
    Navigator: ({ children }: { children?: React.ReactNode }) => children,
    Screen: () => null,
  })),
  getDrawerStatusFromState: jest.fn(() => 'closed'),
}));

jest.mock('@react-navigation/native', () => ({
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      background: '#ffffff',
      text: '#032f3c',
    },
  })),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@react-navigation/elements', () => ({
  HeaderBackButton: () => null,
}));

jest.mock('./OnboardingStack', () => 'OnboardingStack');
jest.mock('@/src/screens/main/connections', () => 'Connections');
jest.mock('./SettingsStack', () => 'SettingsStack');
jest.mock('./BottomTabStack', () => 'MainTabStack');
jest.mock('./DrawerContent', () => 'DrawerContent');
jest.mock('./PrayerWallStack', () => 'PrayerWallStack');
jest.mock('../screens/main/saved', () => 'Saved');
jest.mock('../screens/main/zoeChat', () => 'ZoeChat');
jest.mock('./global', () => jest.fn(() => ({ headerLeft: undefined })));
jest.mock('@/assets/icons/home2.svg', () => 'Home2Icon');
jest.mock('@/assets/svg/prayers.svg', () => 'PrayersIcon');
jest.mock('@/assets/svg/zoeicon.svg', () => 'ZoeIcon');
jest.mock('iconsax-react-native', () => ({
  Profile2User: () => null,
}));
jest.mock('@react-native-vector-icons/feather', () => 'FeatherIcon');

describe('DrawerPlaceholderScreen', () => {
  it('renders a visible loading state instead of a blank placeholder', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<DrawerPlaceholderScreen />);
    });

    const renderedText = renderer!.root
      .findAllByType(Text)
      .map((node) => node.props.children)
      .join(' ');

    expect(renderedText).toContain('Loading your account...');
    expect(renderer!.root.findAllByType(ActivityIndicator)).toHaveLength(1);
  });
});
