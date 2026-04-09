/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import MapViewScreen from '../mapview';

const mockChips: jest.Mock = jest.fn();
const mockMarkerView: jest.Mock = jest.fn();
const mockChrome: jest.Mock = jest.fn();
const mockFilterSheet: jest.Mock = jest.fn();
const mockSearchBar: jest.Mock = jest.fn();
const mockUseConnectPortalData = jest.fn(() => ({}));
const mockUseSelector = jest.fn();
const mockUseFocusEffect = jest.fn((callback: () => void) => callback());

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => mockUseFocusEffect(callback),
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      background: '#ffffff',
      card: '#f5f5f5',
    },
  })),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
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
jest.mock('@/components/styled/Text', () => 'StyledText');
jest.mock('@/src/services/deviceLocation', () => jest.fn(() => Promise.resolve(null)));

jest.mock('@rnmapbox/maps', () => {
  const ReactLocal = require('react');
  const MockView = (props: any) =>
    ReactLocal.createElement('MockMapboxView', props, props.children);
  return {
    __esModule: true,
    default: {
      MapView: MockView,
      Camera: () => null,
      MarkerView: (props: any) => {
        mockMarkerView(props);
        return ReactLocal.createElement(MockView, props, props.children);
      },
      setAccessToken: jest.fn(),
    },
  };
});

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
    infoBase: '#41dbe1',
  },
  CONNECT_BOTTOM_CHIP_RAIL_HEIGHT: 44,
  CONNECT_BOTTOM_NAV_BASE_OFFSET: 88,
  CONNECT_BOTTOM_SEARCH_ROW_HEIGHT: 64,
  CONNECT_BOTTOM_STACK_GAP: 8,
  CONNECT_GO_QUICK_CHIPS: ['Upcoming', 'Online', 'In Person', 'Live'],
  CONNECT_SERVE_SECTOR_OPTIONS: [
    'Administration',
    'Ministry',
    'Operations',
    'Worship',
    'Media',
    'Education',
  ],
  ConnectMapFloatingCard: () => null,
  ConnectMapMarker: () => null,
  ConnectPortalChrome: (props: any) => {
    mockChrome(props);
    return null;
  },
  ConnectPortalFilterSheet: (props: any) => {
    mockFilterSheet(props);
    return null;
  },
  ConnectRetractableSearchBar: (props: any) => {
    mockSearchBar(props);
    return null;
  },
  ConnectPlacesQuickChips: (props: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    mockChips(props);
    return ReactLocal.createElement(MockView);
  },
  useConnectKeyboardMetrics: () => ({
    keyboardHeight: 0,
    keyboardVisible: false,
  }),
}));

function createPortalData(): any {
  return {
    snapshot: {
      publicPublished: [],
    },
    refresh: jest.fn(),
    activeTab: 'Go!',
    setActiveTab: jest.fn(),
    setViewMode: jest.fn(),
    searchByTab: {
      'Go!': '',
      Serve: '',
      Places: '',
    },
    setSearchText: jest.fn(),
    go: {
      filters: { sort: 'upcoming', eventType: '', category: '' },
      quickChip: 'Upcoming',
      setQuickChip: jest.fn(),
      filterSheetOpen: false,
      setFilterSheetOpen: jest.fn(),
      sortOptions: [],
      eventTypeOptions: [],
      categoryOptions: [],
      setFilters: jest.fn(),
      resetFilters: jest.fn(),
    },
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
      selectedPlaceId: null,
      selectPlace: jest.fn(),
      isFollowing: jest.fn(() => false),
      toggleFollow: jest.fn(),
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

describe('MapViewScreen', () => {
  beforeEach(() => {
    mockChips.mockClear();
    mockMarkerView.mockClear();
    mockChrome.mockClear();
    mockFilterSheet.mockClear();
    mockSearchBar.mockClear();
    mockUseSelector.mockReturnValue({ profileImage: '' });
  });

  it('shows only 7 Go event-type chips plus a See all action on map', () => {
    const portalData = createPortalData();
    portalData.go.eventTypeOptions = [
      'Bible Study',
      'Prayer Night',
      'Worship Night',
      'Revival',
      'Conference',
      'Retreat',
      'Youth Gathering',
      'Young Adult Gathering',
    ].map((value) => ({ label: value, value }));
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <MapViewScreen
          navigation={{ navigate: jest.fn() } as any}
          route={{ key: 'connect-map', name: 'ConnectMap', params: { initialTab: 'Go!' } } as any}
        />
      );
    });

    const chipProps = mockChips.mock.calls.at(-1)?.[0] as any;
    expect(chipProps?.chips).toEqual(
      portalData.go.eventTypeOptions.slice(0, 7).map((option) => option.value)
    );
    expect(chipProps?.actionChip).toMatchObject({
      label: 'See all',
      testID: 'connect-go-map-see-all-chip',
    });
  });

  it('routes See all to Go list view and preserves the Go tab', () => {
    const navigation = { navigate: jest.fn() };
    const portalData = createPortalData();
    portalData.go.eventTypeOptions = [
      'Bible Study',
      'Prayer Night',
      'Worship Night',
      'Revival',
      'Conference',
      'Retreat',
      'Youth Gathering',
      'Young Adult Gathering',
    ].map((value) => ({ label: value, value }));
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <MapViewScreen
          navigation={navigation as any}
          route={{ key: 'connect-map', name: 'ConnectMap', params: { initialTab: 'Go!' } } as any}
        />
      );
    });

    const chipProps = mockChips.mock.calls.at(-1)?.[0] as any;
    act(() => {
      chipProps.actionChip.onPress();
    });

    expect(portalData.setViewMode).toHaveBeenCalledWith('Go!', 'list');
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectPortal', { initialTab: 'Go!' });
  });

  it('routes the Serve header create action to step 1 directly', () => {
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn(),
    };
    const portalData = createPortalData();
    portalData.activeTab = 'Serve';
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <MapViewScreen
          navigation={navigation as any}
          route={{ key: 'connect-map', name: 'ConnectMap', params: { initialTab: 'Serve' } } as any}
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
    const portalData = createPortalData();
    portalData.activeTab = 'Serve';
    portalData.serve.publicRecords = [];
    portalData.serve.roleTypeOptions = [
      { label: 'Interim Pastor', value: 'Interim Pastor' },
      { label: 'Drummer', value: 'Drummer' },
      { label: 'Church Administrator', value: 'Church Administrator' },
    ];
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <MapViewScreen
          navigation={{ navigate: jest.fn(), setParams: jest.fn() } as any}
          route={{ key: 'connect-map', name: 'ConnectMap', params: { initialTab: 'Serve' } } as any}
        />
      );
    });

    const chipProps = mockChips.mock.calls.at(-1)?.[0] as any;
    const filterSheetProps = mockFilterSheet.mock.calls.at(-1)?.[0] as any;

    expect(chipProps?.chips).toEqual(['Interim Pastor', 'Drummer', 'Church Administrator']);
    expect(filterSheetProps?.serve.roleTypeOptions).toEqual(portalData.serve.roleTypeOptions);
  });

  it('filters Go map markers by event type and quick filter', () => {
    const portalData = createPortalData();
    portalData.go.filters = { sort: 'upcoming', eventType: 'Conference', category: '' };
    portalData.go.quickChip = 'Online';
    portalData.snapshot.publicPublished = [
      {
        id: 'event-1',
        title: 'Online Conference',
        eventType: 'Conference',
        category: 'COMMUNITY',
        venueName: '',
        address: '',
        startDate: '2099-01-01',
        startTime: '6:00 PM',
        endDate: '2099-01-01',
        endTime: '8:00 PM',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        status: 'published',
        publishedAt: '2026-01-02T00:00:00.000Z',
        organizerName: 'OneBody',
        organizerRole: 'Host',
        isSingleDayEvent: true,
        isOnline: true,
        onlineEventUrl: '',
        externalEventUrl: '',
        locationQuery: '',
        description: '',
        capacity: '100',
        ticketType: 'free',
        paymentOption: 'external',
        payoutConfigured: false,
        ticketTiers: [],
        businessName: '',
        ein: '',
        registrationCount: 0,
        viewCount: 0,
        openCount: 0,
        tags: ['Live'],
        coordinate: [-84.388, 33.749],
      },
      {
        id: 'event-2',
        title: 'In-Person Conference',
        eventType: 'Conference',
        category: 'COMMUNITY',
        venueName: '',
        address: '',
        startDate: '2099-01-01',
        startTime: '6:00 PM',
        endDate: '2099-01-01',
        endTime: '8:00 PM',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        status: 'published',
        publishedAt: '2026-01-02T00:00:00.000Z',
        organizerName: 'OneBody',
        organizerRole: 'Host',
        isSingleDayEvent: true,
        isOnline: false,
        onlineEventUrl: '',
        externalEventUrl: '',
        locationQuery: '',
        description: '',
        capacity: '100',
        ticketType: 'free',
        paymentOption: 'external',
        payoutConfigured: false,
        ticketTiers: [],
        businessName: '',
        ein: '',
        registrationCount: 0,
        viewCount: 0,
        openCount: 0,
        tags: [],
        coordinate: [-84.388, 33.749],
      },
      {
        id: 'event-3',
        title: 'Online Bible Study',
        eventType: 'Bible Study',
        category: 'COMMUNITY',
        venueName: '',
        address: '',
        startDate: '2099-01-01',
        startTime: '6:00 PM',
        endDate: '2099-01-01',
        endTime: '8:00 PM',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        status: 'published',
        publishedAt: '2026-01-02T00:00:00.000Z',
        organizerName: 'OneBody',
        organizerRole: 'Host',
        isSingleDayEvent: true,
        isOnline: true,
        onlineEventUrl: '',
        externalEventUrl: '',
        locationQuery: '',
        description: '',
        capacity: '100',
        ticketType: 'free',
        paymentOption: 'external',
        payoutConfigured: false,
        ticketTiers: [],
        businessName: '',
        ein: '',
        registrationCount: 0,
        viewCount: 0,
        openCount: 0,
        tags: [],
        coordinate: [-84.388, 33.749],
      },
    ] as any;
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <MapViewScreen
          navigation={{ navigate: jest.fn() } as any}
          route={{ key: 'connect-map', name: 'ConnectMap', params: { initialTab: 'Go!' } } as any}
        />
      );
    });

    expect(mockMarkerView).toHaveBeenCalledTimes(1);
    expect(mockMarkerView.mock.calls[0]?.[0]?.id).toBe('event-1');
  });

  it('syncs the selected map tab back into route params', () => {
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn(),
    };
    const portalData = createPortalData();
    portalData.activeTab = 'Places';
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <MapViewScreen
          navigation={navigation as any}
          route={{ key: 'connect-map', name: 'ConnectMap', params: undefined } as any}
        />
      );
    });

    const chromeProps = mockChrome.mock.calls.at(-1)?.[0] as any;
    act(() => {
      chromeProps.onTabChange('Go!');
    });

    expect(portalData.setActiveTab).toHaveBeenCalledWith('Go!');
    expect(navigation.setParams).toHaveBeenCalledWith({ initialTab: 'Go!' });
  });

  it('moves the Places list toggle into the retractable search bar', () => {
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn(),
    };
    const portalData = createPortalData();
    portalData.activeTab = 'Places';
    mockUseConnectPortalData.mockReturnValue(portalData);

    act(() => {
      TestRenderer.create(
        <MapViewScreen
          navigation={navigation as any}
          route={
            { key: 'connect-map', name: 'ConnectMap', params: { initialTab: 'Places' } } as any
          }
        />
      );
    });

    const chromeProps = mockChrome.mock.calls.at(-1)?.[0] as any;
    const searchBarProps = mockSearchBar.mock.calls.at(-1)?.[0] as any;

    expect(chromeProps?.headerActionIconName).toBeUndefined();
    expect(chromeProps?.onHeaderActionPress).toBeUndefined();
    expect(searchBarProps?.viewToggle).toMatchObject({
      toMap: false,
      accessibilityLabel: 'Switch to list view',
    });

    act(() => {
      searchBarProps.viewToggle.onPress();
    });

    expect(portalData.setViewMode).toHaveBeenCalledWith('Places', 'list');
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectPortal', { initialTab: 'Places' });
  });
});
