/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import WatchCommentRow from './WatchCommentRow';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialCommunityIcons');
jest.mock('react-native-fast-image', () => 'FastImage');
jest.mock('@/services/constants', () => ({
  NO_PROFILE_IMAGE: 'https://example.com/fallback.png',
}));
jest.mock('@/utils/ResponsiveFun', () => ({
  timeSince: jest.fn(() => '1m'),
}));
jest.mock('@/components/mentions/ParsedText', () => {
  return function MockParsedText(props: any) {
    return require('react').createElement('MockParsedText', props);
  };
});

describe('WatchCommentRow', () => {
  it('forwards mention presses through ParsedText', async () => {
    const onMentionPress = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <WatchCommentRow
          item={
            {
              id: 'comment-1',
              depth: 0,
              comment: {
                _id: 'comment-1',
                commentId: 'comment-1',
                content: 'Hello @first',
                date: '2026-03-07T10:00:00.000Z',
                created: new Date('2026-03-07T10:00:00.000Z'),
                updated: new Date('2026-03-07T10:00:00.000Z'),
                dateSeconds: 1709805600,
                response: [],
                reactions: [],
                userData: {
                  _id: 'author-1',
                  name: 'Author',
                  username: 'author',
                  profileImage: '',
                },
                mentions: [
                  {
                    userId: 'user-1',
                    username: 'first',
                    displayName: 'First Person',
                  },
                ],
              },
            } as any
          }
          currentUserId="viewer-1"
          isReacting={false}
          onMentionPress={onMentionPress}
          onReply={jest.fn()}
          onToggleReaction={jest.fn()}
        />
      );
    });

    const parsedText = tree!.root.findByType('MockParsedText');
    parsedText.props.onMentionPress('first');

    expect(onMentionPress).toHaveBeenCalledWith('first');
  });
});
