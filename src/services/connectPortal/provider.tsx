import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '@/src/redux/actions/AuthActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import ApiCall from '@/src/services/api';
import type { ConnectTab } from '@/src/screens/connectportal/data';
import {
  getConnectEventTypeOptions,
  getConnectPortalPlaceFilterOptions,
  getConnectServeRoleOptions,
  getConnectPortalCacheSnapshot,
  getDefaultConnectPlaceFilters,
  listConnectServeOrganizerJobs,
  listConnectServePublicJobs,
  listConnectPortalPlaces,
  refreshConnectPortalPublishedEvents,
} from './index';
import { CONNECT_DEFAULT_SERVE_ROLE_OPTIONS } from './defaultServeRoles';
import type {
  ConnectGoFilters,
  ConnectGoQuickChip,
  ConnectPlaceFilterOption,
  ConnectPlaceFilters,
  ConnectPlaceRecord,
  ConnectPlacesQuickChip,
  ConnectPortalCacheSnapshot,
  ConnectServeJobDraft,
  ConnectServeJobPublished,
  ConnectServeJobRecord,
  ConnectServeFilters,
  ConnectServeQuickChip,
  ConnectViewMode,
} from './types';

export type ConnectPortalErrorCode = 'network' | 'auth' | 'parse' | 'unknown';

export type ConnectPortalError = {
  code: ConnectPortalErrorCode;
  message: string;
} | null;

type ConnectPortalContextValue = {
  snapshot: ConnectPortalCacheSnapshot;
  loading: boolean;
  error: ConnectPortalError;
  refresh: (force?: boolean) => Promise<void>;
  activeTab: ConnectTab;
  setActiveTab: (tab: ConnectTab) => void;
  viewModes: Record<ConnectTab, ConnectViewMode>;
  setViewMode: (tab: ConnectTab, viewMode: ConnectViewMode) => void;
  searchByTab: Record<ConnectTab, string>;
  setSearchText: (tab: ConnectTab, text: string) => void;
  places: {
    records: ConnectPlaceRecord[];
    visibleRecords: ConnectPlaceRecord[];
    loading: boolean;
    error: ConnectPortalError;
    filters: ConnectPlaceFilters;
    quickChip: ConnectPlacesQuickChip;
    filterSheetOpen: boolean;
    selectedPlaceId: string | null;
    organizationTypes: ConnectPlaceFilterOption[];
    churchTypes: ConnectPlaceFilterOption[];
    sortOptions: ConnectPlaceFilterOption[];
    setQuickChip: (chip: ConnectPlacesQuickChip) => void;
    setFilterSheetOpen: (value: boolean) => void;
    setFilters: (updater: Partial<ConnectPlaceFilters>) => void;
    resetFilters: () => void;
    refresh: () => Promise<void>;
    selectPlace: (placeId: string | null) => void;
    toggleFollow: (placeId: string) => Promise<void>;
    isFollowing: (placeId: string) => boolean;
  };
  go: {
    filters: ConnectGoFilters;
    quickChip: ConnectGoQuickChip;
    filterSheetOpen: boolean;
    sortOptions: ConnectPlaceFilterOption[];
    eventTypeOptions: ConnectPlaceFilterOption[];
    categoryOptions: ConnectPlaceFilterOption[];
    setQuickChip: (chip: ConnectGoQuickChip) => void;
    setFilterSheetOpen: (value: boolean) => void;
    setFilters: (updater: Partial<ConnectGoFilters>) => void;
    resetFilters: () => void;
  };
  serve: {
    publicRecords: ConnectServeJobPublished[];
    organizerRecords: ConnectServeJobRecord[];
    draftRecords: ConnectServeJobDraft[];
    filters: ConnectServeFilters;
    quickChip: ConnectServeQuickChip;
    filterSheetOpen: boolean;
    loading: boolean;
    error: ConnectPortalError;
    sortOptions: ConnectPlaceFilterOption[];
    roleTypeOptions: ConnectPlaceFilterOption[];
    setQuickChip: (chip: ConnectServeQuickChip) => void;
    setFilterSheetOpen: (value: boolean) => void;
    setFilters: (updater: Partial<ConnectServeFilters>) => void;
    resetFilters: () => void;
    refresh: () => Promise<void>;
  };
};

const EMPTY_SNAPSHOT: ConnectPortalCacheSnapshot = {
  drafts: [],
  organizerPublished: [],
  publicPublished: [],
  loadedAt: null,
};

const DEFAULT_VIEW_MODES: Record<ConnectTab, ConnectViewMode> = {
  Places: 'map',
  'Go!': 'list',
  Serve: 'list',
};

const DEFAULT_SEARCH: Record<ConnectTab, string> = {
  Places: '',
  'Go!': '',
  Serve: '',
};

const DEFAULT_GO_FILTERS: ConnectGoFilters = {
  sort: 'upcoming',
  eventType: '',
  category: '',
};

const DEFAULT_SERVE_FILTERS: ConnectServeFilters = {
  sort: 'alphabetical',
  roleType: '',
};

const GO_SORT_OPTIONS: ConnectPlaceFilterOption[] = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Alphabetical', value: 'alphabetical' },
  { label: 'Recently updated', value: 'recently_updated' },
];

const SERVE_SORT_OPTIONS: ConnectPlaceFilterOption[] = [
  { label: 'Alphabetical', value: 'alphabetical' },
  { label: 'Role type', value: 'role_type' },
  { label: 'Nearest match', value: 'nearest_match' },
];

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const uniqueOptions = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).map((value) => ({
    label: toTitleCase(value),
    value,
  }));

const ConnectPortalContext = createContext<ConnectPortalContextValue | null>(null);

const applyQuickChip = (records: ConnectPlaceRecord[], quickChip: ConnectPlacesQuickChip) => {
  if (quickChip === 'Nearby') {
    return records;
  }

  if (quickChip === 'Mega-Church') {
    return records.filter((record) => record.organizationSize === 'mega');
  }

  if (quickChip === 'Churches') {
    return records.filter((record) => {
      const organizationType = record.organizationTypeLabel.toLowerCase();
      return organizationType.includes('church') || record.churchTypeLabel.length > 0;
    });
  }

  return records.filter((record) => {
    const organizationType = record.organizationTypeLabel.toLowerCase();
    return (
      organizationType.includes('non-profit') ||
      organizationType.includes('non profit') ||
      organizationType.includes('ministry')
    );
  });
};

export function ConnectPortalProvider({ children }: PropsWithChildren): React.JSX.Element {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);

  const [snapshot, setSnapshot] = useState<ConnectPortalCacheSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ConnectPortalError>(null);
  const [activeTab, setActiveTab] = useState<ConnectTab>('Places');
  const [viewModes, setViewModes] =
    useState<Record<ConnectTab, ConnectViewMode>>(DEFAULT_VIEW_MODES);
  const [searchByTab, setSearchByTab] = useState<Record<ConnectTab, string>>(DEFAULT_SEARCH);
  const [placeFilters, setPlaceFilters] = useState<ConnectPlaceFilters>(
    getDefaultConnectPlaceFilters()
  );
  const [placeRecords, setPlaceRecords] = useState<ConnectPlaceRecord[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<ConnectPortalError>(null);
  const [placesQuickChip, setPlacesQuickChip] = useState<ConnectPlacesQuickChip>('Nearby');
  const [placeFilterSheetOpen, setPlaceFilterSheetOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [organizationTypes, setOrganizationTypes] = useState<ConnectPlaceFilterOption[]>([]);
  const [churchTypes, setChurchTypes] = useState<ConnectPlaceFilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<ConnectPlaceFilterOption[]>([]);
  const [followOverrides, setFollowOverrides] = useState<Record<string, boolean>>({});
  const [goFilters, setGoFilters] = useState<ConnectGoFilters>(DEFAULT_GO_FILTERS);
  const [goQuickChip, setGoQuickChip] = useState<ConnectGoQuickChip>('Upcoming');
  const [goFilterSheetOpen, setGoFilterSheetOpen] = useState(false);
  const [connectFilterOptions, setConnectFilterOptions] = useState<{
    goEventTypeOptions: ConnectPlaceFilterOption[];
    serveRoleOptions: ConnectPlaceFilterOption[];
  }>({
    goEventTypeOptions: [],
    serveRoleOptions: CONNECT_DEFAULT_SERVE_ROLE_OPTIONS,
  });
  const [servePublicJobs, setServePublicJobs] = useState<ConnectServeJobPublished[]>([]);
  const [serveOrganizerJobs, setServeOrganizerJobs] = useState<ConnectServeJobRecord[]>([]);
  const [serveLoading, setServeLoading] = useState(true);
  const [serveError, setServeError] = useState<ConnectPortalError>(null);
  const [serveFilters, setServeFilters] = useState<ConnectServeFilters>(DEFAULT_SERVE_FILTERS);
  const [serveQuickChip, setServeQuickChip] = useState<ConnectServeQuickChip>('Hiring');
  const [serveFilterSheetOpen, setServeFilterSheetOpen] = useState(false);

  const refresh = useCallback(async (force = false) => {
    setError(null);
    try {
      if (force) {
        await refreshConnectPortalPublishedEvents(true);
      }
      const [nextSnapshot, nextServePublicJobs, nextServeOrganizerJobs] = await Promise.all([
        getConnectPortalCacheSnapshot(),
        listConnectServePublicJobs(),
        listConnectServeOrganizerJobs(),
      ]);
      setSnapshot(nextSnapshot);
      setServePublicJobs(nextServePublicJobs);
      setServeOrganizerJobs(nextServeOrganizerJobs);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Unable to load Connect portal data right now.';
      setError({ code: 'network', message });
      setServeError({ code: 'network', message });
    } finally {
      setLoading(false);
      setServeLoading(false);
    }
  }, []);

  const refreshServeJobs = useCallback(async () => {
    setServeLoading(true);
    setServeError(null);
    try {
      const [nextServePublicJobs, nextServeOrganizerJobs] = await Promise.all([
        listConnectServePublicJobs(),
        listConnectServeOrganizerJobs(),
      ]);
      setServePublicJobs(nextServePublicJobs);
      setServeOrganizerJobs(nextServeOrganizerJobs);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Unable to load serve jobs right now.';
      setServeError({ code: 'network', message });
    } finally {
      setServeLoading(false);
    }
  }, []);

  const refreshPlaces = useCallback(async () => {
    setPlacesLoading(true);
    setPlacesError(null);
    try {
      const response = await listConnectPortalPlaces(placeFilters, {
        text: searchByTab.Places,
        page: 1,
        limit: 50,
        view: viewModes.Places,
      });
      setPlaceRecords(response.data);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Unable to load Connect places right now.';
      setPlacesError({ code: 'network', message });
      setPlaceRecords([]);
    } finally {
      setPlacesLoading(false);
    }
  }, [placeFilters, searchByTab.Places, viewModes.Places]);

  const updateViewMode = useCallback((tab: ConnectTab, viewMode: ConnectViewMode) => {
    setViewModes((previous) => ({ ...previous, [tab]: viewMode }));
  }, []);

  const updateSearchText = useCallback((tab: ConnectTab, text: string) => {
    setSearchByTab((previous) => ({ ...previous, [tab]: text }));
  }, []);

  useEffect(() => {
    refresh();
    Promise.all([
      getConnectPortalPlaceFilterOptions(),
      getConnectEventTypeOptions(),
      getConnectServeRoleOptions(),
    ])
      .then(([placeOptions, eventTypeOptions, nextServeRoleOptions]) => {
        setOrganizationTypes(placeOptions.organizationTypes);
        setChurchTypes(placeOptions.churchTypes);
        setSortOptions(placeOptions.sortOptions);
        setConnectFilterOptions({
          goEventTypeOptions: eventTypeOptions,
          serveRoleOptions:
            nextServeRoleOptions.length > 0
              ? nextServeRoleOptions
              : CONNECT_DEFAULT_SERVE_ROLE_OPTIONS,
        });
      })
      .catch(() => {
        setConnectFilterOptions((previous) => ({
          ...previous,
          serveRoleOptions:
            previous.serveRoleOptions.length > 0
              ? previous.serveRoleOptions
              : CONNECT_DEFAULT_SERVE_ROLE_OPTIONS,
        }));
      });
  }, [refresh]);

  useEffect(() => {
    const profileLocation = currentUser?.profile?.location;
    const longitude = profileLocation?.coordinates?.lon;
    const latitude = profileLocation?.coordinates?.lat;
    const locationAddress = profileLocation?.address || '';

    setPlaceFilters((previous) => {
      if (previous.lat !== undefined || previous.lon !== undefined || previous.locationAddress) {
        return previous;
      }

      if (typeof longitude !== 'number' || typeof latitude !== 'number' || !locationAddress) {
        return previous;
      }

      return {
        ...previous,
        lon: longitude,
        lat: latitude,
        locationAddress,
      };
    });
  }, [currentUser?.profile?.location]);

  useEffect(() => {
    refreshPlaces();
  }, [refreshPlaces]);

  const visiblePlaceRecords = useMemo(
    () => applyQuickChip(placeRecords, placesQuickChip),
    [placeRecords, placesQuickChip]
  );

  useEffect(() => {
    if (!visiblePlaceRecords.length) {
      setSelectedPlaceId(null);
      return;
    }

    if (selectedPlaceId && !visiblePlaceRecords.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(null);
    }
  }, [selectedPlaceId, visiblePlaceRecords]);

  const isFollowing = useCallback(
    (placeId: string) => {
      if (Object.prototype.hasOwnProperty.call(followOverrides, placeId)) {
        return followOverrides[placeId];
      }

      return Boolean(currentUser?.following?.includes(placeId));
    },
    [currentUser?.following, followOverrides]
  );

  const toggleFollow = useCallback(
    async (placeId: string) => {
      if (!token) {
        return;
      }

      const nextValue = !isFollowing(placeId);
      setFollowOverrides((previous) => ({ ...previous, [placeId]: nextValue }));

      try {
        const result = await ApiCall({
          route: `${nextValue ? 'user/subscribe' : 'user/unsubscribe'}/${placeId}`,
          verb: 'patch',
          token,
          suppressErrorLog: true,
        });

        if (result.status >= 400) {
          throw new Error('Unable to update follow status');
        }

        dispatch(getProfile.Request({ token }));
      } catch {
        setFollowOverrides((previous) => ({ ...previous, [placeId]: !nextValue }));
      }
    },
    [dispatch, isFollowing, token]
  );

  const goCategoryOptions = useMemo(
    () => uniqueOptions(snapshot.publicPublished.map((record) => record.category)),
    [snapshot.publicPublished]
  );

  const serveDraftRecords = useMemo(
    () =>
      serveOrganizerJobs.filter(
        (record): record is ConnectServeJobDraft => record.status === 'draft'
      ),
    [serveOrganizerJobs]
  );

  const servePublishedOrganizerRecords = useMemo(
    () =>
      serveOrganizerJobs.filter(
        (record): record is ConnectServeJobPublished => record.status === 'published'
      ),
    [serveOrganizerJobs]
  );

  const serveRoleTypeOptions = useMemo(() => {
    if (connectFilterOptions.serveRoleOptions.length > 0) {
      return connectFilterOptions.serveRoleOptions;
    }

    return CONNECT_DEFAULT_SERVE_ROLE_OPTIONS;
  }, [connectFilterOptions.serveRoleOptions]);

  const value = useMemo(
    () => ({
      snapshot,
      loading,
      error,
      refresh,
      activeTab,
      setActiveTab,
      viewModes,
      setViewMode: updateViewMode,
      searchByTab,
      setSearchText: updateSearchText,
      places: {
        records: placeRecords,
        visibleRecords: visiblePlaceRecords,
        loading: placesLoading,
        error: placesError,
        filters: placeFilters,
        quickChip: placesQuickChip,
        filterSheetOpen: placeFilterSheetOpen,
        selectedPlaceId,
        organizationTypes,
        churchTypes,
        sortOptions,
        setQuickChip: setPlacesQuickChip,
        setFilterSheetOpen: setPlaceFilterSheetOpen,
        setFilters: (updater: Partial<ConnectPlaceFilters>) => {
          setPlaceFilters((previous) => ({ ...previous, ...updater }));
        },
        resetFilters: () => {
          setPlaceFilters(
            getDefaultConnectPlaceFilters({
              lat: currentUser?.profile?.location?.coordinates?.lat,
              lon: currentUser?.profile?.location?.coordinates?.lon,
              locationAddress: currentUser?.profile?.location?.address || '',
            })
          );
          setPlacesQuickChip('Nearby');
        },
        refresh: refreshPlaces,
        selectPlace: setSelectedPlaceId,
        toggleFollow,
        isFollowing,
      },
      go: {
        filters: goFilters,
        quickChip: goQuickChip,
        filterSheetOpen: goFilterSheetOpen,
        sortOptions: GO_SORT_OPTIONS,
        eventTypeOptions: connectFilterOptions.goEventTypeOptions,
        categoryOptions: goCategoryOptions,
        setQuickChip: setGoQuickChip,
        setFilterSheetOpen: setGoFilterSheetOpen,
        setFilters: (updater: Partial<ConnectGoFilters>) => {
          setGoFilters((previous) => ({ ...previous, ...updater }));
        },
        resetFilters: () => {
          setGoFilters(DEFAULT_GO_FILTERS);
          setGoQuickChip('Upcoming');
        },
      },
      serve: {
        publicRecords: servePublicJobs,
        organizerRecords: servePublishedOrganizerRecords,
        draftRecords: serveDraftRecords,
        filters: serveFilters,
        quickChip: serveQuickChip,
        filterSheetOpen: serveFilterSheetOpen,
        loading: serveLoading,
        error: serveError,
        sortOptions: SERVE_SORT_OPTIONS,
        roleTypeOptions: serveRoleTypeOptions,
        setQuickChip: setServeQuickChip,
        setFilterSheetOpen: setServeFilterSheetOpen,
        setFilters: (updater: Partial<ConnectServeFilters>) => {
          setServeFilters((previous) => ({ ...previous, ...updater }));
        },
        resetFilters: () => {
          setServeFilters(DEFAULT_SERVE_FILTERS);
          setServeQuickChip('Hiring');
        },
        refresh: refreshServeJobs,
      },
    }),
    [
      snapshot,
      loading,
      error,
      activeTab,
      viewModes,
      searchByTab,
      placeRecords,
      visiblePlaceRecords,
      placesLoading,
      placesError,
      placeFilters,
      placesQuickChip,
      placeFilterSheetOpen,
      selectedPlaceId,
      organizationTypes,
      churchTypes,
      sortOptions,
      goFilters,
      goQuickChip,
      goFilterSheetOpen,
      connectFilterOptions,
      goCategoryOptions,
      servePublicJobs,
      servePublishedOrganizerRecords,
      serveDraftRecords,
      serveLoading,
      serveError,
      serveFilters,
      serveQuickChip,
      serveFilterSheetOpen,
      serveRoleTypeOptions,
      currentUser?.profile?.location?.address,
      currentUser?.profile?.location?.coordinates?.lat,
      currentUser?.profile?.location?.coordinates?.lon,
      isFollowing,
      refresh,
      refreshPlaces,
      refreshServeJobs,
      toggleFollow,
      updateSearchText,
      updateViewMode,
    ]
  );

  return <ConnectPortalContext.Provider value={value}>{children}</ConnectPortalContext.Provider>;
}

export const useConnectPortalData = () => {
  const context = useContext(ConnectPortalContext);
  if (!context) {
    throw new Error('useConnectPortalData must be used inside ConnectPortalProvider');
  }
  return context;
};
