import { ApiCall } from '@/src/services/api';
import {
  ChatEnvelope,
  ChatConversationReadResult,
  ChatConversationTargetPayload,
  ConversationListItem,
  CreateChatGroupPayload,
  ChatUserKey,
  RegisterChatDeviceTokenPayload,
  RegisterChatKeyPayload,
  UpdateChatConversationMutePayload,
  UpdateChatConversationArchiveStatePayload,
  UpdateChatConversationReadStatePayload,
} from './types';
import { isValidMongoObjectId } from './conversationTarget';

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

const withToken = (token?: string) => (token && token.length > 0 ? token : true);

const normalizeConversationReadStatePayload = (payload: UpdateChatConversationReadStatePayload) => {
  if (payload.conversationType === 'group') {
    const groupId = typeof payload.groupId === 'string' ? payload.groupId.trim() : '';
    return groupId && isValidMongoObjectId(groupId)
      ? {
          conversationType: 'group' as const,
          groupId,
          isRead: payload.isRead,
        }
      : null;
  }

  const peerUserId = typeof payload.peerUserId === 'string' ? payload.peerUserId.trim() : '';
  return peerUserId && isValidMongoObjectId(peerUserId)
    ? {
        conversationType: 'direct' as const,
        peerUserId,
        isRead: payload.isRead,
      }
    : null;
};

export const registerChatPublicKey = async (payload: RegisterChatKeyPayload, token?: string) => {
  return ApiCall<ApiEnvelope<ChatUserKey>>({
    route: 'chat/keys/register',
    verb: 'post',
    params: payload,
    token: withToken(token),
  });
};

export const fetchUserChatPublicKey = async (userId: string, token?: string) => {
  return ApiCall<ApiEnvelope<ChatUserKey>>({
    route: `chat/keys/${userId}`,
    verb: 'get',
    token: withToken(token),
  });
};

export const fetchConversationMessages = async (
  peerUserId: string,
  options?: { limit?: number; before?: string; token?: string }
) => {
  const query = new URLSearchParams();
  if (options?.limit) {
    query.set('limit', String(options.limit));
  }
  if (options?.before) {
    query.set('before', options.before);
  }

  const suffix = query.toString();

  return ApiCall<ApiEnvelope<ChatEnvelope[]>>({
    route: `chat/conversations/${peerUserId}/messages${suffix ? `?${suffix}` : ''}`,
    verb: 'get',
    token: withToken(options?.token),
  });
};

export const fetchGroupConversationMessages = async (
  groupId: string,
  options?: { limit?: number; before?: string; token?: string }
) => {
  const query = new URLSearchParams();
  if (options?.limit) {
    query.set('limit', String(options.limit));
  }
  if (options?.before) {
    query.set('before', options.before);
  }

  const suffix = query.toString();

  return ApiCall<ApiEnvelope<ChatEnvelope[]>>({
    route: `chat/groups/${groupId}/messages${suffix ? `?${suffix}` : ''}`,
    verb: 'get',
    token: withToken(options?.token),
    suppressErrorLog: true,
  });
};

export const fetchChatConversations = async (options?: {
  limit?: number;
  includeGroups?: boolean;
  includeArchived?: boolean;
  token?: string;
}) => {
  const query = new URLSearchParams();
  if (options?.limit) {
    query.set('limit', String(options.limit));
  }
  if (options?.includeGroups) {
    query.set('includeGroups', 'true');
  }
  if (options?.includeArchived) {
    query.set('includeArchived', 'true');
  }

  const suffix = query.toString();

  return ApiCall<ApiEnvelope<ConversationListItem[]>>({
    route: `chat/conversations${suffix ? `?${suffix}` : ''}`,
    verb: 'get',
    token: withToken(options?.token),
  });
};

export const createChatGroup = async (payload: CreateChatGroupPayload, token?: string) => {
  return ApiCall<ApiEnvelope<ConversationListItem>>({
    route: 'chat/groups',
    verb: 'post',
    params: payload,
    token: withToken(token),
  });
};

export const updateChatMessageStatus = async (
  messageId: string,
  status: 'delivered' | 'read',
  token?: string
) => {
  return ApiCall<ApiEnvelope<ChatEnvelope>>({
    route: `chat/messages/${messageId}/status`,
    verb: 'patch',
    params: { status },
    token: withToken(token),
  });
};

export const markChatConversationRead = async (peerUserId: string, token?: string) => {
  return ApiCall<ApiEnvelope<ChatConversationReadResult>>({
    route: `chat/conversations/${peerUserId}/read`,
    verb: 'patch',
    token: withToken(token),
  });
};

export const updateChatConversationMuteState = async (
  payload: UpdateChatConversationMutePayload,
  token?: string
) => {
  return ApiCall<ApiEnvelope<{ isMuted: boolean; peerUserId?: string; groupId?: string }>>({
    route: 'chat/conversations/state/mute',
    verb: 'patch',
    params: payload,
    token: withToken(token),
  });
};

export const updateChatConversationReadState = async (
  payload: UpdateChatConversationReadStatePayload,
  token?: string
) => {
  const normalizedPayload = normalizeConversationReadStatePayload(payload);
  if (__DEV__) {
    console.log('[ChatReadDebug] state_read_payload', {
      payload,
      normalizedPayload,
    });
  }
  if (!normalizedPayload) {
    return {
      status: 400,
      response: {
        message:
          payload.conversationType === 'group' ? 'groupId is invalid' : 'peerUserId is invalid',
      } as ApiEnvelope<{
        isRead: boolean;
        peerUserId?: string;
        groupId?: string;
        updatedCount: number;
        messageIds: string[];
      }>,
    };
  }

  return ApiCall<
    ApiEnvelope<{
      isRead: boolean;
      peerUserId?: string;
      groupId?: string;
      updatedCount: number;
      messageIds: string[];
    }>
  >({
    route: 'chat/conversations/state/read',
    verb: 'patch',
    params: normalizedPayload,
    token: withToken(token),
  });
};

export const hideChatConversation = async (
  payload: ChatConversationTargetPayload,
  token?: string
) => {
  return ApiCall<ApiEnvelope<{ isArchived: boolean; peerUserId?: string; groupId?: string }>>({
    route: 'chat/conversations/state',
    verb: 'delete',
    params: payload,
    token: withToken(token),
  });
};

export const updateChatConversationArchiveState = async (
  payload: UpdateChatConversationArchiveStatePayload,
  token?: string
) => {
  return ApiCall<ApiEnvelope<{ isArchived: boolean; peerUserId?: string; groupId?: string }>>({
    route: 'chat/conversations/state/archive',
    verb: 'patch',
    params: payload,
    token: withToken(token),
  });
};

export const deleteDirectChatConversation = async (peerUserId: string, token?: string) => {
  return ApiCall<ApiEnvelope<{ peerUserId: string; deleted: boolean; historyClearedAt: string }>>({
    route: `chat/conversations/direct/${peerUserId}`,
    verb: 'delete',
    token: withToken(token),
  });
};

export const deleteChatGroup = async (groupId: string, token?: string) => {
  return ApiCall<ApiEnvelope<{ groupId: string; isArchived: boolean }>>({
    route: `chat/groups/${groupId}`,
    verb: 'delete',
    token: withToken(token),
  });
};

export const leaveChatGroup = async (groupId: string, token?: string) => {
  return ApiCall<ApiEnvelope<{ groupId: string; left: boolean; isArchived: boolean }>>({
    route: `chat/groups/${groupId}/leave`,
    verb: 'post',
    token: withToken(token),
  });
};

export const registerChatDeviceToken = async (
  payload: RegisterChatDeviceTokenPayload,
  token?: string
) => {
  return ApiCall<ApiEnvelope<{ _id: string }>>({
    route: 'chat/device-tokens/register',
    verb: 'post',
    params: payload,
    token: withToken(token),
  });
};

export const unregisterChatDeviceToken = async (deviceId: string, token?: string) => {
  return ApiCall<ApiEnvelope<{ message: string }>>({
    route: `chat/device-tokens/${encodeURIComponent(deviceId)}`,
    verb: 'delete',
    token: withToken(token),
  });
};

export const uploadChatMediaFile = async (
  fileUri: string,
  fileName: string,
  mimeType: string,
  token?: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);

  const response = await ApiCall<ApiEnvelope<{ mediaUrl: string }>>({
    route: 'chat/media/upload',
    verb: 'post',
    params: formData,
    token: withToken(token),
    isFormUrlEncode: true,
  });

  if (response.status !== 200 || !response.response?.data?.mediaUrl) {
    throw new Error('Media upload failed');
  }

  return response.response.data.mediaUrl;
};
