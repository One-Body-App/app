jest.mock('../clientModeration', () => ({
  buildImageDataUri: jest.fn(async () => 'data:image/jpeg;base64,QUJD'),
  callBackendFallbackModeration: jest.fn(),
}));

import { buildImageDataUri, callBackendFallbackModeration } from '../clientModeration';
import {
  IMAGE_MODERATION_THRESHOLDS,
  moderateClientImage,
} from '../imageModeration';

const buildImageDataUriMock = buildImageDataUri as unknown as jest.Mock;
const callBackendFallbackModerationMock = callBackendFallbackModeration as unknown as jest.Mock;

describe('moderateClientImage', () => {
  beforeEach(() => {
    buildImageDataUriMock.mockClear();
    callBackendFallbackModerationMock.mockReset();
  });

  it('flags unsafe filenames via the fast heuristic without touching the backend', async () => {
    const result = await moderateClientImage({
      uri: 'file:///tmp/anon.jpg',
      fileName: 'my-onlyfans-shot.jpg',
    });
    expect(result.decision).toBe('unsure');
    expect(result.source).toBe('heuristic');
    expect(callBackendFallbackModerationMock).not.toHaveBeenCalled();
  });

  it('returns safe when backend says allow and no categories matched', async () => {
    callBackendFallbackModerationMock.mockResolvedValueOnce({
      finalAction: 'allow',
      provider: 'openai',
      flagged: false,
      matchedCategories: [],
    });

    const result = await moderateClientImage({ uri: 'file:///tmp/clean.jpg' });
    expect(result.decision).toBe('safe');
    expect(result.severity).toBe(0);
    expect(result.scores).toEqual({});
  });

  it('maps backend block decision to blocked', async () => {
    callBackendFallbackModerationMock.mockResolvedValueOnce({
      finalAction: 'block',
      provider: 'openai',
      flagged: true,
      matchedCategories: [{ category: 'sexual', score: 0.92, threshold: 0.6 }],
    });

    const result = await moderateClientImage({ uri: 'file:///tmp/bad.jpg' });
    expect(result.decision).toBe('blocked');
    expect(result.category).toBe('sexual');
    expect(result.severity).toBeCloseTo(0.92);
  });

  it('maps backend pending_review to unsure (so the UI shows the warning chip)', async () => {
    callBackendFallbackModerationMock.mockResolvedValueOnce({
      finalAction: 'pending_review',
      provider: 'openai',
      flagged: true,
      matchedCategories: [{ category: 'violence', score: 0.45, threshold: 0.5 }],
    });

    const result = await moderateClientImage({ uri: 'file:///tmp/maybe.jpg' });
    expect(result.decision).toBe('unsure');
    expect(result.category).toBe('violence');
  });

  it('uses score-based thresholds when backend says allow but flags categories under threshold', async () => {
    callBackendFallbackModerationMock.mockResolvedValueOnce({
      finalAction: 'allow',
      provider: 'openai',
      flagged: false,
      matchedCategories: [
        {
          category: 'sexual',
          score: IMAGE_MODERATION_THRESHOLDS.unsure + 0.05,
          threshold: 0.5,
        },
      ],
    });

    const result = await moderateClientImage({ uri: 'file:///tmp/edge.jpg' });
    expect(result.decision).toBe('unsure');
  });

  it('returns unavailable when the backend call throws', async () => {
    callBackendFallbackModerationMock.mockRejectedValueOnce(new Error('network down'));
    const result = await moderateClientImage({ uri: 'file:///tmp/photo.jpg' });
    expect(result.decision).toBe('unavailable');
    expect(result.source).toBe('backend-pre-screen');
  });

  it('returns unavailable when the URI is missing', async () => {
    const result = await moderateClientImage({ uri: '' });
    expect(result.decision).toBe('unavailable');
    expect(buildImageDataUriMock).not.toHaveBeenCalled();
  });
});
