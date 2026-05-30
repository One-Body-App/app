import { Text } from 'react-native';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import ZoeChat from './index';

const mockConfig = {
  ZOE_CHAT_URL: undefined as string | undefined,
};

jest.mock('react-native-config', () => ({
  get ZOE_CHAT_URL() {
    return mockConfig.ZOE_CHAT_URL;
  },
  get default() {
    return {
      ZOE_CHAT_URL: mockConfig.ZOE_CHAT_URL,
    };
  },
}));

jest.mock('@react-navigation/native', () => {
  const ReactLocal = jest.requireActual('react');

  return {
    CommonActions: {
      reset: jest.fn((payload) => payload),
    },
    useTheme: jest.fn(() => ({
      colors: {
        background: '#ffffff',
        text: '#032f3c',
      },
      dark: false,
    })),
    useFocusEffect: jest.fn((callback) => {
      ReactLocal.useEffect(() => callback(), [callback]);
    }),
    useIsFocused: jest.fn(() => true),
  };
});

const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
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

jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');

jest.mock('@/components/styled/Text', () => {
  const ReactLocal = jest.requireActual('react');
  const { Text: MockText } = jest.requireActual('react-native');

  return ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactLocal.createElement(MockText, props, children);
});

jest.mock('@/src/screens/home', () => ({
  FeedTypes: {
    ForYou: 'ForYou',
  },
}));

const baseProps = {
  navigation: {
    dispatch: jest.fn(),
  },
  route: {
    key: 'ZoeAI-key',
    name: 'ZoeAI',
  },
};

function renderScreen(chatUrl?: string) {
  mockConfig.ZOE_CHAT_URL = chatUrl;

  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<ZoeChat {...(baseProps as any)} />);
  });

  return renderer!;
}

describe('ZoeChat', () => {
  beforeEach(() => {
    mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          getProfileData: {
            role: 'user',
            influencerProfile: {
              influencerStatus: 'approved',
            },
          },
        },
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConfig.ZOE_CHAT_URL = undefined;
  });

  it('passes an explicit whitelist that includes about:srcdoc and the configured origin', () => {
    const renderer = renderScreen('https://chat.onebodyapp.com/session');
    const webView = renderer.root.find((node) => Array.isArray(node.props?.originWhitelist));

    expect(webView.props.originWhitelist).toEqual([
      'about:blank',
      'about:srcdoc',
      'https://chat.onebodyapp.com',
    ]);
    expect(webView.props.source).toEqual({ uri: 'https://chat.onebodyapp.com/session' });
    expect(webView.props.onShouldStartLoadWithRequest).toEqual(expect.any(Function));
  });

  it('renders the unavailable state and does not mount the WebView for an invalid chat url', () => {
    const renderer = renderScreen('about:srcdoc');
    const unavailableMessage = renderer.root.find(
      (node) =>
        node.type === Text &&
        node.props?.children === 'Zoe chat is currently unavailable on this build.'
    );

    expect(unavailableMessage.props.children).toBe(
      'Zoe chat is currently unavailable on this build.'
    );
    expect(
      renderer.root.findAll(
        (node) => Array.isArray(node.props?.originWhitelist) || node.props?.source?.uri != null
      )
    ).toHaveLength(0);
  });

  it('redirects ineligible users back to home instead of rendering the chat', () => {
    mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          getProfileData: {
            role: 'user',
            influencerProfile: {
              influencerStatus: 'pending',
            },
          },
        },
      })
    );

    const renderer = renderScreen('https://chat.onebodyapp.com/session');

    expect(baseProps.navigation.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 0,
        routes: [
          expect.objectContaining({
            name: 'Main',
          }),
        ],
      })
    );
    expect(
      renderer.root.findAll((node) => Array.isArray(node.props?.originWhitelist))
    ).toHaveLength(0);
  });
});
