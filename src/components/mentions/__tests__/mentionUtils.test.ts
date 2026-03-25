import {
  extractHandlesFromText,
  findActiveMention,
  replaceMentionAtRange,
  syncMentionedUserIds,
} from '../mentionUtils';

describe('mentionUtils', () => {
  it('finds an active mention in the middle of a sentence', () => {
    expect(findActiveMention('Hello @john there', { start: 11, end: 11 })).toEqual({
      query: 'john',
      triggerIndex: 6,
      replaceStart: 6,
      replaceEnd: 11,
    });
  });

  it('does not treat email addresses as mentions', () => {
    expect(findActiveMention('email me at test@example.com', { start: 19, end: 19 })).toBeNull();
  });

  it('extracts handles while preserving punctuation boundaries', () => {
    expect(extractHandlesFromText('Hello @john, meet @jane.')).toEqual(['john', 'jane']);
  });

  it('replaces the active mention and moves the caret after a trailing space', () => {
    expect(
      replaceMentionAtRange('Hello @jo there', { replaceStart: 6, replaceEnd: 9 }, 'john')
    ).toEqual({
      text: 'Hello @john there',
      selection: {
        start: 12,
        end: 12,
      },
    });
  });

  it('syncs mentioned ids to only handles still present in the text', () => {
    const mentionsByHandle = new Map<string, string>([
      ['john', 'user-1'],
      ['jane', 'user-2'],
    ]);

    expect(syncMentionedUserIds('Hello @john.', mentionsByHandle)).toEqual(['user-1']);
  });
});
