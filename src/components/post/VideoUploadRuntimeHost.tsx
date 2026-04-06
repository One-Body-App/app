import React, { useCallback } from 'react';
import { useToast } from 'react-native-toast-notifications';
import VideoProcessingRuntime from './VideoProcessingRuntime';
import { displayVideoUploadLocalNotification } from '@/src/services/notification/pushNotificationService';

export default function VideoUploadRuntimeHost() {
  const toast = useToast();

  const handleUploadNotification = useCallback((id: string, message: string) => {
    displayVideoUploadLocalNotification(id, message).catch(() => undefined);
  }, []);

  return (
    <VideoProcessingRuntime
      showUploadToast={toast.show}
      showUploadNotification={handleUploadNotification}
    />
  );
}
