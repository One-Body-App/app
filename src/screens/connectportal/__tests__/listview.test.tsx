/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import ListViewScreen from '../listview';

const mockSearchBar = jest.fn((_props?: any) => null);
const mockUseConnectPortalData = jest.fn(() => ({}));
const mockUseSelector = jest.fn();
const mockUseFocusEffect = jest.fn((callback: () => void) => callback());

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => mockUseFocusEffect(callback),
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      background: '#ffffff',
    },
  })),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
}));

jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');
jest.mock(
  '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg',
  () => 'FilterSortIcon'
);
jest.mock('@/components/styled/Text', () => 'StyledText');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('@/src/services/connectPortal', () => ({
  createConnectPortalDraft: jest.fn(),
  formatConnectPortalDateTime: jest.fn(() => 'May 1 at 7:00 PM'),
  trackConnectPortalEventTelemetry: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/src/services/connectPortal/provider', () => ({
  useConnectPortalData: () => mockUseConnectPortalData(),
}));

jest.mock('@/src/hooks/useMountEffect', () => (callback: () => void) => callback());

jest.mock('../shared', () => ({
  CONNECT_BRAND: {
    gray100: '#e6eaec',
  },
  CONNECT_BOTTOM_NAV_BASE_OFFSET: 88,
  CONNECT_BOTTOM_SEARCH_ROW_HEIGHT: 64,
  CONNECT_BOTTOM_STACK_GAP: 8,
  CONNECT_GO_QUICK_CHIPS: ['Upcoming', 'Online', 'In Person', 'Live'],
  CONNECT_PLACE_QUICK_CHIPS: ['Nearby', 'Non-Profits', 'Churches', 'Mega-Church'],
  CONNECT_SERVE_QUICK_CHIPS: ['Hiring', 'Part-time', 'Full-time', 'Serve'],
  ConnectPlaceCard: () => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    return ReactLocal.createElement(MockView);
  },
  ConnectPlacesQuickChips: () => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    return ReactLocal.createElement(MockView);
  },
  ConnectPortalChrome: () => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    return ReactLocal.createElement(MockView);
  },
  ConnectPortalFilterSheet: () => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    return ReactLocal.createElement(MockView);
  },
  ConnectRetractableSearchBar: (props: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    mockSearchBar(props);
    return ReactLocal.createElement(MockView);
  },
  useConnectPalette: () => ({
    mapActionBg: '#ffffff',
    mapActionBorder: '#cdd5d8',
    activeText: '#126b87',
    cardMuted: '#ebf3f6',
    tagBg: '#d6e7ec',
    textPrimary: '#032f3c',
    textSecondary: '#4f6d77',
  }),
  useConnectKeyboardMetrics: () => ({
    keyboardHeight: 0,
    keyboardVisible: false,
  }),
}));

type MockTab = 'Go!' | 'Serve' | 'Places';

function createPortalData(activeTab: MockTab) {
  return {
    snapshot: {
      publicPublished: [],
    },
    refresh: jest.fn(),
    activeTab,
    setActiveTab: jest.fn(),
    viewModes: {
      'Go!': 'list',
      Serve: 'list',
      Places: 'list',
    },
    setViewMode: jest.fn(),
    searchByTab: {
      'Go!': '',
      Serve: '',
      Places: '',
    },
    setSearchText: jest.fn(),
    places: {
      visibleRecords: [],
      quickChip: 'Nearby',
      setQuickChip: jest.fn(),
      filterSheetOpen: false,
      setFilterSheetOpen: jest.fn(),
      filters: {},
      organizationTypes: [],
      churchTypes: [],
      sortOptions: [],
      setFilters: jest.fn(),
      resetFilters: jest.fn(),
      isFollowing: jest.fn(() => false),
      toggleFollow: jest.fn(),
    },
    go: {
      filters: {},
      quickChip: 'Upcoming',
      setQuickChip: jest.fn(),
      filterSheetOpen: false,
      setFilterSheetOpen: jest.fn(),
      sortOptions: [],
      eventTypeOptions: [],
      categoryOptions: [],
      modeOptions: [],
      setFilters: jest.fn(),
      resetFilters: jest.fn(),
    },
    serve: {
      filters: {},
      quickChip: 'Hiring',
      setQuickChip: jest.fn(),
      filterSheetOpen: false,
      setFilterSheetOpen: jest.fn(),
      sortOptions: [],
      roleTypeOptions: [],
      tagOptions: [],
      setFilters: jest.fn(),
      resetFilters: jest.fn(),
    },
  };
}

describe('ListViewScreen', () => {
  beforeEach(() => {
    mockSearchBar.mockClear();
    mockUseSelector.mockReturnValue({ profileImage: '' });
  });

  it('passes the Serve manager action and routes to my jobs', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    mockUseConnectPortalData.mockReturnValue(createPortalData('Serve'));

    act(() => {
      TestRenderer.create(
        <ListViewScreen
          navigation={navigation as any}
          route={{ key: 'connect-portal', name: 'ConnectPortal', params: undefined } as any}
        />
      );
    });

    const searchBarProps = mockSearchBar.mock.calls.at(-1)?.[0] as any;

    expect(searchBarProps?.tertiaryAction).toMatchObject({
      icon: 'serveManager',
      accessibilityLabel: 'Open serve manager',
      testID: 'connect-serve-manager-action',
    });

    act(() => {
      searchBarProps.tertiaryAction.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('ConnectServeHome');
  });

  it('passes the Go event manager action and routes to the Go hub', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    mockUseConnectPortalData.mockReturnValue(createPortalData('Go!'));

    act(() => {
      TestRenderer.create(
        <ListViewScreen
          navigation={navigation as any}
          route={{ key: 'connect-portal', name: 'ConnectPortal', params: undefined } as any}
        />
      );
    });

    const searchBarProps = mockSearchBar.mock.calls.at(-1)?.[0] as any;

    expect(searchBarProps?.tertiaryAction).toMatchObject({
      icon: 'eventManager',
      accessibilityLabel: 'Open event management',
      testID: 'connect-go-event-manager-action',
    });

    act(() => {
      searchBarProps.tertiaryAction.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('ConnectGoLanding');
  });

  it.each<MockTab>(['Places'])('does not pass a tertiary action on %s', (activeTab) => {
    mockUseConnectPortalData.mockReturnValue(createPortalData(activeTab));

    act(() => {
      TestRenderer.create(
        <ListViewScreen
          navigation={{ navigate: jest.fn() } as any}
          route={{ key: 'connect-portal', name: 'ConnectPortal', params: undefined } as any}
        />
      );
    });

    const searchBarProps = mockSearchBar.mock.calls.at(-1)?.[0] as any;
    expect(searchBarProps?.tertiaryAction).toBeUndefined();
  });
});
