import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '@/src/redux/actions/AuthActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import ApiCall from '@/src/services/api';
import type { ConnectTab } from '@/src/screens/connectportal/data';
import {
  getConnectPortalPlaceFilterOptions,
  getConnectPortalCacheSnapshot,
  getDefaultConnectPlaceFilters,
  listConnectPortalPlaces,
  refreshConnectPortalPublishedEvents,
} from './index';
import type {
  ConnectPlaceFilterOption,
  ConnectPlaceFilters,
  ConnectPlaceRecord,
  ConnectPlacesQuickChip,
  ConnectPortalCacheSnapshot,
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

  const refresh = async (force = false) => {
    setError(null);
    try {
      if (force) {
        await refreshConnectPortalPublishedEvents(true);
      }
      const nextSnapshot = await getConnectPortalCacheSnapshot();
      setSnapshot(nextSnapshot);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Unable to load Connect portal data right now.';
      setError({ code: 'network', message });
    } finally {
      setLoading(false);
    }
  };

  const refreshPlaces = async () => {
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
  };

  useEffect(() => {
    refresh();
    getConnectPortalPlaceFilterOptions().then((result) => {
      setOrganizationTypes(result.organizationTypes);
      setChurchTypes(result.churchTypes);
      setSortOptions(result.sortOptions);
    });
  }, []);

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
  }, [placeFilters, searchByTab.Places, viewModes.Places]);

  const visiblePlaceRecords = useMemo(
    () => applyQuickChip(placeRecords, placesQuickChip),
    [placeRecords, placesQuickChip]
  );

  useEffect(() => {
    if (!visiblePlaceRecords.length) {
      setSelectedPlaceId(null);
      return;
    }

    if (!selectedPlaceId || !visiblePlaceRecords.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(visiblePlaceRecords[0].id);
    }
  }, [selectedPlaceId, visiblePlaceRecords]);

  const isFollowing = (placeId: string) => {
    if (Object.prototype.hasOwnProperty.call(followOverrides, placeId)) {
      return followOverrides[placeId];
    }

    return Boolean(currentUser?.following?.includes(placeId));
  };

  const toggleFollow = async (placeId: string) => {
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
  };

  const value = useMemo(
    () => ({
      snapshot,
      loading,
      error,
      refresh,
      activeTab,
      setActiveTab,
      viewModes,
      setViewMode: (tab: ConnectTab, viewMode: ConnectViewMode) => {
        setViewModes((previous) => ({ ...previous, [tab]: viewMode }));
      },
      searchByTab,
      setSearchText: (tab: ConnectTab, text: string) => {
        setSearchByTab((previous) => ({ ...previous, [tab]: text }));
      },
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
      currentUser?.profile?.location?.address,
      currentUser?.profile?.location?.coordinates?.lat,
      currentUser?.profile?.location?.coordinates?.lon,
      currentUser?.following,
      token,
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
