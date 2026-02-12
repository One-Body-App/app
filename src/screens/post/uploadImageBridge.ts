export type UploadImageUsageContext = 'feed' | 'comment';

export type UploadImageResult =
  | {
      status: 'saved';
      uri: string;
      fileName?: string;
      fileSize?: number;
      type?: string;
    }
  | {
      status: 'cancelled';
    };

type Resolver = (result: UploadImageResult) => void;

const pendingResolvers = new Map<string, Resolver>();

export const createUploadImageRequestId = () =>
  `upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const waitForUploadImageResult = (requestId: string) =>
  new Promise<UploadImageResult>((resolve) => {
    pendingResolvers.set(requestId, resolve);
  });

export const resolveUploadImageResult = (requestId: string, result: UploadImageResult) => {
  const resolver = pendingResolvers.get(requestId);
  if (!resolver) {
    return;
  }
  pendingResolvers.delete(requestId);
  resolver(result);
};

export const cancelUploadImageRequest = (requestId: string) => {
  resolveUploadImageResult(requestId, { status: 'cancelled' });
};
