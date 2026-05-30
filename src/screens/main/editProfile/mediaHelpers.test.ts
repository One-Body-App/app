import {
  buildCroppedMediaState,
  shouldConsumeMediaPickerIntent,
  shouldOpenHeaderPicker,
  shouldOpenPhotoPicker,
} from './mediaHelpers';

describe('editProfile media helpers', () => {
  it('maps media picker intent to the correct picker and marks it consumable', () => {
    expect(shouldOpenPhotoPicker('photo')).toBe(true);
    expect(shouldOpenHeaderPicker('photo')).toBe(false);
    expect(shouldConsumeMediaPickerIntent('photo')).toBe(true);

    expect(shouldOpenPhotoPicker('header')).toBe(false);
    expect(shouldOpenHeaderPicker('header')).toBe(true);
    expect(shouldConsumeMediaPickerIntent('header')).toBe(true);

    expect(shouldConsumeMediaPickerIntent(undefined)).toBe(false);
  });

  it('uses the cropped asset path for header preview and upload state', () => {
    const result = buildCroppedMediaState({
      image: {
        mime: 'image/jpeg',
        path: '/tmp/cropped-header.jpg',
      },
      imageType: 'header',
      userId: 'user-1',
    });

    expect(result.previewUri).toBe('/tmp/cropped-header.jpg');
    expect(result.upload).toEqual({
      name: 'headerImageuser-1',
      type: 'image/jpeg',
      uri: '/tmp/cropped-header.jpg',
    });
  });
});
