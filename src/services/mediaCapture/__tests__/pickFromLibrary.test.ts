import ImagePicker from 'react-native-image-crop-picker';
import { pickFromLibrary } from '../pickFromLibrary';

jest.mock('react-native-image-crop-picker', () => ({
  __esModule: true,
  default: {
    openPicker: jest.fn(),
  },
}));

jest.mock('@/src/screens/post/uploadImageConfig', () => ({
  CLIENT_IMAGE_MAX_HEIGHT: 2048,
  CLIENT_IMAGE_MAX_WIDTH: 2048,
  CLIENT_IMAGE_PICKER_QUALITY: 0.85,
}));

jest.mock('@/src/screens/post/uploadImageOrientation', () => ({
  extractExifOrientation: jest.fn(() => 1),
  resolveEditorExifOrientation: jest.fn(({ orientation }: { orientation: number }) => orientation),
}));

const openPickerMock = ImagePicker.openPicker as unknown as jest.Mock;

describe('pickFromLibrary', () => {
  beforeEach(() => {
    openPickerMock.mockReset();
  });

  it('normalizes paths and forces JPEG file names for photos', async () => {
    openPickerMock.mockResolvedValueOnce([
      {
        path: '/tmp/photo.heic',
        mime: 'image/heic',
        filename: 'photo.heic',
        size: 1024,
        width: 1000,
        height: 1000,
      },
    ]);

    const result = await pickFromLibrary({ mode: 'photo' });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe('photo');
    expect(result.items[0].uri).toBe('file:///tmp/photo.heic');
    expect(result.items[0].fileName).toBe('photo.jpg');
    expect(result.items[0].source).toBe('library');
  });

  it('returns video entries with durationMs in milliseconds', async () => {
    openPickerMock.mockResolvedValueOnce({
      path: '/tmp/clip.mp4',
      mime: 'video/mp4',
      filename: 'clip.mp4',
      size: 5_000_000,
      width: 1080,
      height: 1920,
      duration: 12_400,
    });

    const result = await pickFromLibrary({ mode: 'video' });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.items[0].kind).toBe('video');
    expect(result.items[0].durationMs).toBe(12_400);
    expect(result.items[0].fileName).toBe('clip.mp4');
  });

  it('preserves original file name when preserveOriginal is true', async () => {
    openPickerMock.mockResolvedValueOnce([
      { path: '/tmp/portrait.png', mime: 'image/png', filename: 'portrait.png', size: 1024 },
    ]);

    const result = await pickFromLibrary({ mode: 'photo', preserveOriginal: true });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.items[0].fileName).toBe('portrait.png');
    expect(result.items[0].type).toBe('image/png');
  });

  it('rejects when any single file exceeds the size limit', async () => {
    openPickerMock.mockResolvedValueOnce([
      { path: '/tmp/big.jpg', mime: 'image/jpeg', filename: 'big.jpg', size: 60 * 1024 * 1024 },
    ]);

    const result = await pickFromLibrary({
      mode: 'photo',
      maxFileSizeBytes: 50 * 1024 * 1024,
    });
    expect(result.status).toBe('rejected');
    if (result.status !== 'rejected') return;
    expect(result.reason).toBe('too-large');
  });

  it('returns cancelled when the user dismisses the picker', async () => {
    openPickerMock.mockRejectedValueOnce(new Error('User cancelled image selection'));
    const result = await pickFromLibrary({ mode: 'mixed' });
    expect(result.status).toBe('cancelled');
  });

  it('returns rejected:error for unexpected failures', async () => {
    openPickerMock.mockRejectedValueOnce(new Error('Something exploded'));
    const result = await pickFromLibrary({ mode: 'mixed' });
    expect(result.status).toBe('rejected');
    if (result.status !== 'rejected') return;
    expect(result.reason).toBe('error');
  });

  it('infers video kind from duration when mime is missing', async () => {
    openPickerMock.mockResolvedValueOnce([
      { path: '/tmp/anon', duration: 9000, filename: 'anon' },
    ]);

    const result = await pickFromLibrary({ mode: 'mixed' });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.items[0].kind).toBe('video');
  });
});
