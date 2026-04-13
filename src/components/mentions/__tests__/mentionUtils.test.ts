import {
  extractHandlesFromText,
  findActiveMention,
  findMentionRangeBeforeCursor,
  removeMentionRangesFromText,
  replaceMentionAtRange,
  syncMentions,
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
    const mentionsByHandle = new Map<
      string,
      { userId: string; username: string; displayName: string }
    >([
      ['john', { userId: 'user-1', username: 'john', displayName: 'John' }],
      ['jane', { userId: 'user-2', username: 'jane', displayName: 'Jane' }],
    ]);

    expect(syncMentionedUserIds('Hello @john.', mentionsByHandle)).toEqual(['user-1']);
  });

  it('returns structured mentions in text order without duplicates', () => {
    const mentionsByHandle = new Map<
      string,
      { userId: string; username: string; displayName: string }
    >([
      ['john', { userId: 'user-1', username: 'john', displayName: 'John' }],
      ['jane', { userId: 'user-2', username: 'jane', displayName: 'Jane' }],
    ]);

    expect(syncMentions('Hi @john and @jane and @john again', mentionsByHandle)).toEqual([
      { userId: 'user-1', username: 'john', displayName: 'John' },
      { userId: 'user-2', username: 'jane', displayName: 'Jane' },
    ]);
  });

  it('removes a committed mention as a whole token', () => {
    const mentionsByHandle = new Map<
      string,
      { userId: string; username: string; displayName: string }
    >([['john', { userId: 'user-1', username: 'john', displayName: 'John' }]]);
    const range = findMentionRangeBeforeCursor(
      'Hello @john there',
      { start: 12, end: 12 },
      mentionsByHandle
    );

    expect(range).not.toBeNull();
    expect(removeMentionRangesFromText('Hello @john there', [range!])).toEqual({
      text: 'Hello there',
      selection: { start: 6, end: 6 },
    });
  });
});
