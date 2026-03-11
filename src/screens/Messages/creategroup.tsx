import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MessagesStackParamsList } from '@/src/navigator/types';
import { ApiCall } from '@/src/services/api';
import { createChatGroup } from '@/src/services/chat/api';

type Props = NativeStackScreenProps<MessagesStackParamsList, 'CreateGroup'>;

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

function CreateGroupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedContact[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
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
        setConnectedAccounts(mapped);
      } catch {
        if (isMounted) {
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
    };
  }, [token]);

  const filteredContacts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return connectedAccounts;
    }

    return connectedAccounts.filter((item) => {
      const name = item.name.toLowerCase();
      const username = item.username?.toLowerCase() ?? '';
      return name.includes(value) || username.includes(value);
    });
  }, [connectedAccounts, query]);

  const selectedMembers = useMemo(
    () => connectedAccounts.filter((item) => selectedMemberIds.includes(item.id)),
    [connectedAccounts, selectedMemberIds]
  );

  const canCreateGroup = groupName.trim().length > 0 && selectedMemberIds.length >= 2;

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!canCreateGroup || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createChatGroup(
        {
          name: groupName.trim(),
          memberIds: selectedMemberIds,
        },
        token || undefined
      );

      if (response.status !== 200 || !response.response?.data) {
        const message = (response.response as { message?: string })?.message;
        throw new Error(message || 'Unable to create group');
      }

      const { data } = response.response;
      navigation.replace('ChatDetail', {
        conversationType: 'group',
        groupId: data.groupId || data.id.replace(/^group:/, ''),
        groupName: data.groupName || groupName.trim(),
        isMuted: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create group';
      Alert.alert('Create Group Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMembers = () => {
    if (isLoadingContacts) {
      return (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#12d2d9" />
        </View>
      );
    }

    if (filteredContacts.length > 0) {
      return filteredContacts.map((contact) => {
        const selected = selectedMemberIds.includes(contact.id);
        return (
          <Pressable
            key={contact.id}
            style={styles.memberRow}
            onPress={() => toggleMember(contact.id)}
          >
            {contact.avatarUri ? (
              <Image source={{ uri: contact.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{contact.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.memberBody}>
              <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                {contact.name}
              </Text>
              <Text style={styles.memberSubtitle} numberOfLines={1}>
                {contact.username ? `@${contact.username}` : 'Connected account'}
              </Text>
            </View>
            <MaterialIcons
              name={selected ? 'check-circle' : 'radio-button-unchecked'}
              size={22}
              color={selected ? '#126b87' : '#9cc0cd'}
            />
          </Pressable>
        );
      });
    }

    return (
      <Text style={[styles.emptyText, { color: colors.text }]}>No connected accounts found.</Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={30} color="#126b87" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Group</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={[styles.groupNameWrap, { backgroundColor: colors.card }]}>
        <MaterialIcons name="groups" size={22} color="#7da9bb" />
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Group name"
          placeholderTextColor="#7da9bb"
          style={[styles.groupNameInput, { color: colors.text }]}
        />
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.card }]}>
        <MaterialIcons name="search" size={22} color="#7da9bb" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Add connected members"
          placeholderTextColor="#7da9bb"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {selectedMembers.length > 0 ? (
        <View style={styles.selectedWrap}>
          <Text style={styles.sectionTitle}>SELECTED ({selectedMembers.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedMembers.map((member) => (
              <Pressable
                key={member.id}
                style={[styles.selectedChip, { backgroundColor: colors.card }]}
                onPress={() => toggleMember(member.id)}
              >
                <Text style={[styles.selectedChipText, { color: colors.text }]} numberOfLines={1}>
                  {member.name}
                </Text>
                <MaterialIcons name="close" size={16} color={colors.text} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>CONNECTED ACCOUNTS</Text>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {renderMembers()}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleCreateGroup}
          disabled={!canCreateGroup || isSubmitting}
          style={[
            styles.createButton,
            (!canCreateGroup || isSubmitting) && styles.createButtonDisabled,
          ]}
        >
          <Text style={styles.createButtonText}>
            {isSubmitting ? 'Creating Group...' : 'Create Group'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerButton: {
    minWidth: 56,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
  },
  cancelText: {
    color: '#126b87',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  groupNameWrap: {
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
  },
  groupNameInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginTop: 12,
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
  sectionTitle: {
    color: '#6f9fb2',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  selectedWrap: {
    marginTop: 2,
  },
  selectedChip: {
    marginLeft: 16,
    marginRight: 8,
    borderRadius: 16,
    minHeight: 34,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 220,
  },
  selectedChipText: {
    fontSize: 13,
    marginRight: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loaderWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#126b87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  memberBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
  },
  memberSubtitle: {
    color: '#6f9fb2',
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    marginTop: 10,
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  createButton: {
    backgroundColor: '#126b87',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#9cc0cd',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateGroupScreen;
