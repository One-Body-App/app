/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import ListViewScreen from '../listview';

const mockSearchBar: jest.Mock = jest.fn();
const mockChips: jest.Mock = jest.fn();
const mockFilterSheet: jest.Mock = jest.fn();
const mockChrome: jest.Mock = jest.fn();
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
  createConnectServeJobDraft: jest.fn(),
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
  CONNECT_SERVE_SECTOR_OPTIONS: [
    'Administration',
    'Ministry',
    'Operations',
    'Worship',
    'Media',
    'Education',
  ],
  ConnectPlaceCard: () => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    return ReactLocal.createElement(MockView);
  },
  ConnectPlacesQuickChips: (props: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    mockChips(props);
    return ReactLocal.createElement(MockView);
  },
  ConnectPortalChrome: (props: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    mockChrome(props);
    return ReactLocal.createElement(MockView);
  },
  ConnectPortalFilterSheet: (props: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    mockFilterSheet(props);
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

function createPortalData(activeTab: MockTab): any {
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
      eventTypeOptions: [],
      categoryOptions: [],
      sortOptions: [],
      setFilters: jest.fn(),
      resetFilters: jest.fn(),
    },
    serve: {
      publicRecords: [],
      organizerRecords: [],
      draftRecords: [],
      filters: {},
      quickChip: 'Hiring',
      setQuickChip: jest.fn(),
      filterSheetOpen: false,
      setFilterSheetOpen: jest.fn(),
      loading: false,
      error: null,
      sortOptions: [],
      roleTypeOptions: [],
      tagOptions: [],
      setFilters: jest.fn(),
      resetFilters: jest.fn(),
      refresh: jest.fn(),
    },
  };
}

describe('ListViewScreen', () => {
  beforeEach(() => {
    mockSearchBar.mockClear();
    mockChips.mockClear();
    mockFilterSheet.mockClear();
    mockChrome.mockClear();
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

  it('routes the Serve header create action to step 1 directly', () => {
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn(),
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

    const chromeProps = mockChrome.mock.calls.at(-1)?.[0] as any;
    expect(chromeProps?.addAccessibilityLabel).toBe('Create job');

    act(() => {
      chromeProps.onAddPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('ConnectServeCreateJobStep1');
  });

  it('renders Serve role chips and filter options from the role list even without public jobs', () => {
    const portalData = createPortalData('Serve');
    portalData.serve.publicRecords = [];
    portalData.serve.roleTypeOptions = [
      { label: 'Interim Pastor', value: 'Interim Pastor' },
      { label: 'Drummer', value: 'Drummer' },
      { label: 'Church Administrator', value: 'Church Administrator' },
    ];
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <ListViewScreen
          navigation={{ navigate: jest.fn(), setParams: jest.fn() } as any}
          route={{ key: 'connect-portal', name: 'ConnectPortal', params: undefined } as any}
        />
      );
    });

    const chipProps = mockChips.mock.calls.at(-1)?.[0] as any;
    const filterSheetProps = mockFilterSheet.mock.calls.at(-1)?.[0] as any;

    expect(chipProps?.chips).toEqual(['Interim Pastor', 'Drummer', 'Church Administrator']);
    expect(filterSheetProps?.serve.roleTypeOptions).toEqual(portalData.serve.roleTypeOptions);
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

    expect(navigation.navigate).toHaveBeenCalledWith('ConnectGoEventDash');
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

  it('uses the full official event-type chip list on Go list view', () => {
    const portalData = createPortalData('Go!');
    portalData.go.eventTypeOptions = [
      { label: 'Bible Study', value: 'Bible Study' },
      { label: 'Prayer Night', value: 'Prayer Night' },
      { label: 'Worship Night', value: 'Worship Night' },
      { label: 'Revival', value: 'Revival' },
      { label: 'Conference', value: 'Conference' },
      { label: 'Retreat', value: 'Retreat' },
      { label: 'Youth Gathering', value: 'Youth Gathering' },
      { label: 'Young Adult Gathering', value: 'Young Adult Gathering' },
    ];
    portalData.go.filters = { sort: 'upcoming', eventType: 'Conference', category: '' };
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <ListViewScreen
          navigation={{ navigate: jest.fn() } as any}
          route={{ key: 'connect-portal', name: 'ConnectPortal', params: undefined } as any}
        />
      );
    });

    const chipProps = mockChips.mock.calls.at(-1)?.[0] as any;
    expect(chipProps?.chips).toEqual(portalData.go.eventTypeOptions.map((option) => option.value));
    expect(chipProps?.selectedChip).toBe('Conference');
  });

  it('passes Go quick-filter controls into the shared filter sheet', () => {
    const portalData = createPortalData('Go!');
    portalData.go.filterSheetOpen = true;
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <ListViewScreen
          navigation={{ navigate: jest.fn() } as any}
          route={{ key: 'connect-portal', name: 'ConnectPortal', params: undefined } as any}
        />
      );
    });

    const filterSheetProps = mockFilterSheet.mock.calls.at(-1)?.[0] as any;
    expect(filterSheetProps?.go?.quickFilterOptions).toEqual([
      { label: 'Upcoming', value: 'Upcoming' },
      { label: 'Online', value: 'Online' },
      { label: 'In Person', value: 'In Person' },
      { label: 'Live', value: 'Live' },
    ]);
    expect(filterSheetProps?.go?.quickFilterValue).toBe('Upcoming');
    expect(filterSheetProps?.go?.onQuickFilterChange).toBe(portalData.go.setQuickChip);
  });

  it('syncs the selected Connect tab back into route params', () => {
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn(),
    };
    const portalData = createPortalData('Places');
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <ListViewScreen
          navigation={navigation as any}
          route={{ key: 'connect-portal', name: 'ConnectPortal', params: undefined } as any}
        />
      );
    });

    const chromeProps = mockChrome.mock.calls.at(-1)?.[0] as any;
    act(() => {
      chromeProps.onTabChange('Serve');
    });

    expect(portalData.setActiveTab).toHaveBeenCalledWith('Serve');
    expect(navigation.setParams).toHaveBeenCalledWith({ initialTab: 'Serve' });
  });
});
