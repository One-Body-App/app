import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MessagesStackParamsList } from '@/src/navigator/types';
import { ApiCall } from '@/src/services/api';
import {
  APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  APP_HEADER_CONTENT_GAP,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
  APP_HEADER_TITLE_LINE_HEIGHT,
} from '@/src/styles/headerLayout';

type Props = NativeStackScreenProps<MessagesStackParamsList, 'NewMessage'>;

type ConnectedContact = {
  id: string;
  name: string;
  username?: string;
  avatarUri?: string;
};

const getContactId = (entry: any): string => {
  const candidates = [
    entry?.userData?._id,
    entry?.user?._id,
    entry?.targetUser?._id,
    entry?._id,
    entry?.id,
    entry?.userId,
  ];

  const resolved = candidates.find(
    (value) => value !== undefined && value !== null && `${value}`.trim()
  );
  return resolved ? String(resolved) : '';
};

const normalizeContact = (entry: any): ConnectedContact | null => {
  const id = getContactId(entry);
  if (!id) {
    return null;
  }

  const profile = entry?.userData ?? entry?.user ?? entry;

  return {
    id,
    name: String(
      profile?.name ??
        profile?.fullName ??
        profile?.displayName ??
        profile?.username ??
        profile?.organizationName ??
        'OneBody user'
    ),
    username: typeof profile?.username === 'string' ? profile.username : undefined,
    avatarUri:
      (typeof profile?.profileImage === 'string' && profile.profileImage) ||
      (typeof profile?.avatar === 'string' && profile.avatar) ||
      undefined,
  };
};

const pickListSource = (response: any): any[] => {
  if (Array.isArray(response?.response?.data)) {
    return response.response.data;
  }
  if (Array.isArray(response?.response)) {
    return response.response;
  }
  return [];
};

function NewMessageScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ConnectedContact[]>([]);
  const connectedAccountsRef = useRef<ConnectedContact[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);
  const latestQueryRef = useRef('');

  const clearPendingSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  const scheduleSearch = useCallback(
    (nextQuery: string, availableContacts: ConnectedContact[] = connectedAccountsRef.current) => {
      latestQueryRef.current = nextQuery;
      clearPendingSearch();

      const text = nextQuery.trim();
      if (!text) {
        searchRequestIdRef.current += 1;
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const requestId = searchRequestIdRef.current + 1;
      searchRequestIdRef.current = requestId;
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await ApiCall<any>({
            route: 'user/search',
            verb: 'post',
            token: token || true,
            params: {
              type: 'users',
              text,
            },
          });

          if (searchRequestIdRef.current !== requestId || latestQueryRef.current.trim() !== text) {
            return;
          }

          const source = pickListSource(response);
          const availableContactIds = new Set(availableContacts.map((contact) => contact.id));
          const map = new Map<string, ConnectedContact>();
          source.forEach((entry: any) => {
            const next = normalizeContact(entry);
            if (!next || !availableContactIds.has(next.id) || map.has(next.id)) {
              return;
            }
            map.set(next.id, next);
          });

          if (map.size < 1) {
            const local = availableContacts.filter((item) => {
              const name = item.name.toLowerCase();
              const username = item.username?.toLowerCase() ?? '';
              const value = text.toLowerCase();
              return name.includes(value) || username.includes(value);
            });
            setSearchResults(local);
          } else {
            setSearchResults(Array.from(map.values()));
          }
        } catch {
          if (searchRequestIdRef.current === requestId) {
            setSearchResults([]);
          }
        } finally {
          if (searchRequestIdRef.current === requestId) {
            setIsSearching(false);
          }
        }
      }, 300);
    },
    [clearPendingSearch, token]
  );

  const handleQueryChange = useCallback(
    (nextQuery: string) => {
      setQuery(nextQuery);
      scheduleSearch(nextQuery);
    },
    [scheduleSearch]
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchConnectedAccounts = async () => {
        setIsLoadingContacts(true);
        try {
          const response = await ApiCall<any>({
            route: 'user/get-following',
            verb: 'get',
            token: token || true,
          });

          if (!isMounted) {
            return;
          }

          const source = pickListSource(response);

          const mapped = source
            .map(normalizeContact)
            .filter((item): item is ConnectedContact => Boolean(item))
            .sort((a, b) => a.name.localeCompare(b.name));

          connectedAccountsRef.current = mapped;
          setConnectedAccounts(mapped);
          if (latestQueryRef.current.trim()) {
            scheduleSearch(latestQueryRef.current, mapped);
          }
        } catch {
          if (isMounted) {
            connectedAccountsRef.current = [];
            setConnectedAccounts([]);
          }
        } finally {
          if (isMounted) {
            setIsLoadingContacts(false);
          }
        }
      };

      fetchConnectedAccounts();

      return () => {
        isMounted = false;
        clearPendingSearch();
        searchRequestIdRef.current += 1;
        setIsSearching(false);
      };
    }, [clearPendingSearch, scheduleSearch, token])
  );

  const groupedContacts = useMemo(() => {
    const groups: Record<string, ConnectedContact[]> = {};
    connectedAccounts.forEach((item) => {
      const letter = item.name?.trim()?.charAt(0)?.toUpperCase() || '#';
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(item);
    });
    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([letter, items]) => ({ letter, items }));
  }, [connectedAccounts]);

  const frequentContacts = useMemo(() => connectedAccounts.slice(0, 2), [connectedAccounts]);
  const hasQuery = query.trim().length > 0;

  const openConversation = (contact: ConnectedContact) => {
    navigation.navigate('ChatDetail', {
      conversationType: 'direct',
      peerUserId: contact.id,
      peerName: contact.name,
      peerUsername: contact.username,
      peerAvatarUri: contact.avatarUri,
      isMuted: false,
      isArchived: false,
    });
  };

  const renderContactRow = (contact: ConnectedContact, showChatIcon?: boolean) => (
    <Pressable key={contact.id} style={styles.contactRow} onPress={() => openConversation(contact)}>
      {contact.avatarUri ? (
        <Image
          source={{ uri: contact.avatarUri }}
          style={[styles.avatar, { borderColor: colors.border }]}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>{contact.name.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.contactBody}>
        <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
          {contact.name}
        </Text>
        {contact.username ? (
          <Text style={styles.contactSubtitle} numberOfLines={1}>
            @{contact.username}
          </Text>
        ) : null}
      </View>
      {showChatIcon ? <MaterialIcons name="chat-bubble" size={22} color="#126b87" /> : null}
    </Pressable>
  );

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#12d2d9" />
        </View>
      );
    }

    if (searchResults.length > 0) {
      return searchResults.map((contact) => renderContactRow(contact));
    }

    return (
      <Text style={[styles.emptySearchText, { color: colors.text }]}>
        No connected accounts matched your search.
      </Text>
    );
  };

  const renderBody = () => {
    if (isLoadingContacts) {
      return (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#12d2d9" />
        </View>
      );
    }

    if (hasQuery) {
      return (
        <>
          <Text style={styles.sectionTitle}>SEARCH RESULTS</Text>
          {renderSearchResults()}
        </>
      );
    }

    return (
      <>
        <Text style={styles.sectionTitle}>FREQUENT</Text>
        {frequentContacts.map((contact) => renderContactRow(contact, true))}

        <Text style={[styles.sectionTitle, styles.allContactsTitle]}>ALL CONTACTS</Text>
        {groupedContacts.map((group) => (
          <View key={group.letter}>
            <Text style={styles.letterTitle}>{group.letter}</Text>
            {group.items.map((contact) => renderContactRow(contact))}
          </View>
        ))}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { marginTop: insets.top }]}>
        <View style={styles.headerSideSlot}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialIcons name="chevron-left" size={34} color="#126b87" />
          </Pressable>
        </View>

        {isIOS ? (
          <View style={styles.headerCenterWrap} pointerEvents="none">
            <Text style={[styles.headerTitle, { color: colors.text }]}>New message</Text>
          </View>
        ) : (
          <View style={styles.headerTitleAndroidWrap}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>New message</Text>
          </View>
        )}

        <View style={styles.headerSideSlot}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.card }]}>
        <MaterialIcons name="search" size={24} color="#7da9bb" />
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search contacts or churches"
          placeholderTextColor="#7da9bb"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <Pressable style={styles.createGroupRow} onPress={() => navigation.navigate('CreateGroup')}>
        <View style={[styles.createGroupIconWrap, { backgroundColor: colors.card }]}>
          <MaterialIcons name="groups" size={22} color="#126b87" />
        </View>
        <Text style={[styles.createGroupText, { color: colors.text }]}>Create Group</Text>
        <MaterialIcons name="chevron-right" size={24} color="#9cc0cd" />
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {renderBody()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: APP_HEADER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
  },
  headerSideSlot: {
    width: APP_HEADER_SIDE_WIDTH + 22,
    minHeight: APP_HEADER_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenterWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleAndroidWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  headerButton: {
    minWidth: 64,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: APP_HEADER_TITLE_LINE_HEIGHT,
    textAlign: Platform.OS === 'android' ? 'left' : 'center',
  },
  cancelText: {
    color: '#126b87',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginTop: APP_HEADER_CONTENT_GAP,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
  },
  createGroupRow: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  createGroupIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  createGroupText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    color: '#6f9fb2',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 26,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  allContactsTitle: {
    marginTop: 24,
  },
  letterTitle: {
    color: '#126b87',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  contactRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#126b87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  contactBody: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  contactName: {
    fontSize: 20,
    fontWeight: '600',
  },
  contactSubtitle: {
    color: '#6f9fb2',
    fontSize: 14,
    marginTop: 2,
  },
  loaderWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    marginTop: 10,
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.7,
  },
});

export default NewMessageScreen;
