/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native-devsettings/withAsyncStorage', () => ({}));
jest.mock('@react-native-firebase/dynamic-links', () => ({
  getDynamicLinks: jest.fn(() => ({})),
  onLink: jest.fn(() => jest.fn()),
}));
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (Component: React.ComponentType) => Component,
}));
jest.mock('react-redux', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('redux-persist/integration/react', () => ({
  PersistGate: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('react-native-toast-notifications', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../src/redux/store', () => ({
  persistor: {},
  store: {},
}));
jest.mock('../src/navigator/AppContent', () => {
  const { View: NativeView } = require('react-native');

  return function MockAppContent() {
    return <NativeView testID="mock-app-content" />;
  };
});
jest.mock('../src/components/post/VideoUploadRuntimeHost', () => {
  const { View: NativeView } = require('react-native');

  return function MockVideoUploadRuntimeHost() {
    return <NativeView testID="mock-video-upload-runtime-host" />;
  };
});
jest.mock('../src/services/firebaseApp', () => ({
  getFirebaseApp: jest.fn(() => ({})),
}));
jest.mock('../src/hooks/useMountEffect', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('App', () => {
  it('renders a single upload runtime host at the root', async () => {
    const App = require('../App').default;
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<App />);
    });

    const uploadRuntimeHosts = tree!.root.findAll((node) => {
      return (
        node.props.testID === 'mock-video-upload-runtime-host' && typeof node.type === 'string'
      );
    });

    expect(uploadRuntimeHosts).toHaveLength(1);
  });
});
