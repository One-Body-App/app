import { selectMedia } from '../index';

jest.mock('../pickFromLibrary', () => ({
  pickFromLibrary: jest.fn(async () => ({ status: 'ok', items: [{ id: 'a', kind: 'photo' }] })),
}));

jest.mock('../captureFromCamera', () => ({
  captureFromCamera: jest.fn(async () => ({ status: 'ok', items: [{ id: 'c', kind: 'photo' }] })),
}));

import { pickFromLibrary } from '../pickFromLibrary';
import { captureFromCamera } from '../captureFromCamera';

const pickFromLibraryMock = pickFromLibrary as unknown as jest.Mock;
const captureFromCameraMock = captureFromCamera as unknown as jest.Mock;

describe('selectMedia', () => {
  beforeEach(() => {
    pickFromLibraryMock.mockClear();
    captureFromCameraMock.mockClear();
  });

  it('routes to pickFromLibrary by default', async () => {
    await selectMedia({ mode: 'photo' });
    expect(pickFromLibraryMock).toHaveBeenCalledTimes(1);
    expect(captureFromCameraMock).not.toHaveBeenCalled();
  });

  it('routes camera + photo to captureFromCamera', async () => {
    await selectMedia({ mode: 'photo', source: 'camera' });
    expect(captureFromCameraMock).toHaveBeenCalledWith({ kind: 'photo' });
  });

  it('rejects camera + video as unsupported (handled by Composer modal)', async () => {
    const result = await selectMedia({ mode: 'video', source: 'camera' });
    expect(result.status).toBe('rejected');
    if (result.status !== 'rejected') return;
    expect(result.reason).toBe('unsupported');
    expect(captureFromCameraMock).not.toHaveBeenCalled();
  });

  it('passes maxCount through to pickFromLibrary', async () => {
    await selectMedia({ mode: 'mixed', maxCount: 5 });
    expect(pickFromLibraryMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'mixed', maxCount: 5 })
    );
  });
});
