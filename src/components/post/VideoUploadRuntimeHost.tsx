import React, { useCallback } from 'react';
import { useToast } from 'react-native-toast-notifications';
import { useSelector } from 'react-redux';
import VideoProcessingRuntime from './VideoProcessingRuntime';
import { displayVideoUploadLocalNotification } from '@/src/services/notification/pushNotificationService';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  buildRecentCompletedWatchUpload,
  publishRecentCompletedWatchUpload,
} from '@/src/services/recentCompletedWatchUploads';
import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';

export default function VideoUploadRuntimeHost() {
  const toast = useToast();
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);

  const handleUploadNotification = useCallback((id: string, message: string) => {
    displayVideoUploadLocalNotification(id, message).catch(() => undefined);
  }, []);

  const handleCompletedUpload = useCallback(
    (item: PendingVideoUpload) => {
      const ownerUserId = currentUser?._id;
      if (!ownerUserId) {
        return;
      }

      const completedUpload = buildRecentCompletedWatchUpload({
        item,
        playBackId: item.playBackId,
        ownerUserId,
      });

      if (completedUpload) {
        publishRecentCompletedWatchUpload(completedUpload);
      }
    },
    [currentUser?._id]
  );

  return (
    <VideoProcessingRuntime
      onCompleteUpload={handleCompletedUpload}
      showUploadToast={toast.show}
      showUploadNotification={handleUploadNotification}
    />
  );
}
