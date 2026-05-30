import type { User } from '@/utils/types';

export type ResumeDraft = {
  uri: string;
  name: string;
  size: number;
  type: string;
};

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const GENERIC_UPLOAD_FAILURE =
  'Upload failed. Please ensure your document is a standard PDF or Word file and try again.';

const RESUME_MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const getDefaultLocation = (user?: User | null) =>
  String(user?.profile?.location?.address || '').trim();

const getFileExtension = (name?: string | null) => {
  const trimmed = String(name || '')
    .trim()
    .toLowerCase();
  if (!trimmed.includes('.')) {
    return '';
  }

  return trimmed.split('.').pop() || '';
};

export const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const getSupportedMimeType = (name: string, providedType?: string | null) => {
  const normalizedType = String(providedType || '')
    .trim()
    .toLowerCase();
  const extension = getFileExtension(name);
  const extensionMime = RESUME_MIME_BY_EXTENSION[extension];

  if (normalizedType && Object.values(RESUME_MIME_BY_EXTENSION).includes(normalizedType)) {
    return normalizedType;
  }

  return extensionMime || '';
};

export const normalizeResumeSelection = (selection: {
  uri?: string | null;
  fileCopyUri?: string | null;
  name?: string | null;
  size?: number | null;
  type?: string | null;
}) => {
  const resolvedName = String(selection.name || '').trim();
  const resolvedUri = String(selection.fileCopyUri || selection.uri || '').trim();
  const resolvedSize = Number(selection.size || 0);
  const resolvedType = getSupportedMimeType(resolvedName, selection.type);

  if (!resolvedName || !resolvedUri) {
    return {
      error: 'Unable to read that file. Please choose a standard PDF or Word document.',
    } as const;
  }

  if (!resolvedType) {
    return {
      error: 'Please upload a PDF, DOC, or DOCX file.',
    } as const;
  }

  if (!Number.isFinite(resolvedSize) || resolvedSize <= 0) {
    return {
      error: 'That file appears to be empty. Please choose a standard PDF or Word document.',
    } as const;
  }

  if (resolvedSize > MAX_RESUME_BYTES) {
    return {
      error: 'Please choose a resume or portfolio smaller than 5MB.',
    } as const;
  }

  return {
    value: {
      uri: resolvedUri,
      name: resolvedName,
      size: resolvedSize,
      type: resolvedType,
    } satisfies ResumeDraft,
  } as const;
};
