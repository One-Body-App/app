import { ApiCall } from '@/src/services/api';
import {
  ChatEnvelope,
  ChatConversationReadResult,
  ConversationListItem,
  CreateChatGroupPayload,
  ChatUserKey,
  RegisterChatDeviceTokenPayload,
  RegisterChatKeyPayload,
} from './types';

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

const withToken = (token?: string) => (token && token.length > 0 ? token : true);

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

export const fetchChatConversations = async (options?: {
  limit?: number;
  includeGroups?: boolean;
  token?: string;
}) => {
  const query = new URLSearchParams();
  if (options?.limit) {
    query.set('limit', String(options.limit));
  }
  if (options?.includeGroups) {
    query.set('includeGroups', 'true');
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
