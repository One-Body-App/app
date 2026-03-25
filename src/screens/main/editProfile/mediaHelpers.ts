export type EditProfileMediaPickerIntent = 'photo' | 'header';

export type EditProfileRouteParams = {
  openMediaPicker?: EditProfileMediaPickerIntent;
};

type CroppedImageAsset = {
  mime?: string;
  path?: string;
};

export const shouldOpenPhotoPicker = (intent?: EditProfileMediaPickerIntent) => intent === 'photo';

export const shouldOpenHeaderPicker = (intent?: EditProfileMediaPickerIntent) =>
  intent === 'header';

export const shouldConsumeMediaPickerIntent = (intent?: EditProfileMediaPickerIntent) =>
  shouldOpenPhotoPicker(intent) || shouldOpenHeaderPicker(intent);

export const buildCroppedMediaState = ({
  image,
  imageType,
  userId,
}: {
  image: CroppedImageAsset;
  imageType: EditProfileMediaPickerIntent;
  userId?: string;
}) => {
  const previewUri = image.path ?? '';
  const prefix = imageType === 'photo' ? 'profileImage' : 'headerImage';

  return {
    previewUri,
    upload: {
      name: `${prefix}${userId ?? ''}`,
      type: image.mime ?? '',
      uri: previewUri,
    },
  };
};
