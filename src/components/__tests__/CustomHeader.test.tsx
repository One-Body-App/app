import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import CustomHeader from '../CustomHeader';

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
};

function mockMaterialIcon(props: Record<string, unknown>) {
  return React.createElement('MaterialCommunityIcon', props);
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    canGoBack: jest.fn(() => true),
    goBack: jest.fn(),
  })),
  useTheme: jest.fn(() => ({
    dark: false,
  })),
}));

jest.mock('react-native-fast-image', () => mockFastImageComponent);
jest.mock('@react-native-vector-icons/material-design-icons', () => mockMaterialIcon);

describe('CustomHeader', () => {
  it('keeps both side slots reserved and omits the back icon when the back button is hidden', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<CustomHeader showBackButton={false} />);
    });

    const leftSlot = renderer!.root.findByProps({ testID: 'custom-header-left-slot' });
    const rightSlot = renderer!.root.findByProps({ testID: 'custom-header-right-slot' });
    const logo = renderer!.root.findByProps({ testID: 'custom-header-logo' });

    expect(leftSlot).toBeTruthy();
    expect(rightSlot).toBeTruthy();
    expect(logo).toBeTruthy();
    expect(renderer!.root.findAllByType('MaterialCommunityIcon')).toHaveLength(0);
  });

  it('renders custom slot content without breaking the centered layout', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <CustomHeader
          showBackButton={false}
          leftSlot={<Text testID="custom-left-content">Left</Text>}
          rightSlot={<Text testID="custom-right-content">Right</Text>}
        />
      );
    });

    expect(renderer!.root.findByProps({ testID: 'custom-left-content' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'custom-right-content' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'custom-header-logo' })).toBeTruthy();
  });
});
