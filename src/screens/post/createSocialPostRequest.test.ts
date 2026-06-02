import { buildCreateSocialPostRequest } from './createSocialPostRequest';

const mockSerialize = jest.fn(() => 'serialized-form-data');

jest.mock('object-to-formdata', () => ({
  serialize: (...args: unknown[]) => mockSerialize(...args),
}));

describe('buildCreateSocialPostRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses json payloads for text-only social posts', () => {
    const request = buildCreateSocialPostRequest({
      content: 'Hello world',
      mentionedUserIds: [],
      mentions: [],
      moderationReview: undefined,
    });

    expect(request).toEqual({
      params: {
        content: 'Hello world',
        mentionedUserIds: [],
        mentions: [],
        gif: undefined,
        moderationReview: undefined,
        location: undefined,
        scriptureShare: undefined,
      },
      isFormUrlEncode: false,
    });
    expect(mockSerialize).not.toHaveBeenCalled();
  });

  it('uses multipart payloads when image uploads are present', () => {
    const uploadedImages = [{ uri: 'file:///tmp/test.jpg', type: 'image/jpeg', name: 'test.jpg' }];

    const request = buildCreateSocialPostRequest({
      content: 'Hello world',
      mentionedUserIds: ['507f1f77bcf86cd799439011'],
      mentions: [{ userId: '507f1f77bcf86cd799439011', username: 'john', displayName: 'John Doe' }],
      uploadedImages,
      moderationReview: {
        checks: [],
      },
      location: {
        coordinates: [-73.9, 40.7],
        name: 'Brooklyn',
      },
    });

    expect(mockSerialize).toHaveBeenCalledWith(
      {
        content: 'Hello world',
        mentionedUserIds: ['507f1f77bcf86cd799439011'],
        mentions: [
          { userId: '507f1f77bcf86cd799439011', username: 'john', displayName: 'John Doe' },
        ],
        gif: undefined,
        moderationReview: {
          checks: [],
        },
        location: {
          coordinates: [-73.9, 40.7],
          name: 'Brooklyn',
        },
        scriptureShare: undefined,
        images: uploadedImages,
      },
      {
        noAttributesWithArrayNotation: true,
        noFilesWithArrayNotation: true,
      }
    );
    expect(request).toEqual({
      params: 'serialized-form-data',
      isFormUrlEncode: true,
    });
  });

  it('includes scripture shares in json payloads', () => {
    const request = buildCreateSocialPostRequest({
      content: '',
      mentionedUserIds: [],
      mentions: [],
      scriptureShare: {
        book: 'JHN',
        chapter: 3,
        verse: 16,
        verseEnd: 16,
        translation: 'BSB',
      },
    });

    expect(request).toEqual({
      params: {
        content: '',
        mentionedUserIds: [],
        mentions: [],
        gif: undefined,
        moderationReview: undefined,
        location: undefined,
        scriptureShare: {
          book: 'JHN',
          chapter: 3,
          verse: 16,
          verseEnd: 16,
          translation: 'BSB',
        },
      },
      isFormUrlEncode: false,
    });
  });
});
