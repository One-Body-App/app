/* eslint-disable global-require */
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import ComposerHeader from '../ComposerHeader';
import ComposerLectern, { type LecternToolDef } from '../ComposerLectern';
import ComposerScripturePicker from '../ComposerScripturePicker';
import { LIGHT_COMPOSER_PALETTE } from '../composerTheme';
import type { ScriptureShare } from '@/utils/types';

jest.mock('@react-native-vector-icons/material-icons', () => {
  const ReactLocal = require('react');

  return function MockMaterialIcons(props: Record<string, unknown>) {
    return ReactLocal.createElement('MaterialIcons', props);
  };
});

jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Circle: 'Circle',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  Stop: 'Stop',
}));

jest.mock('react-native-reanimated', () => ({
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('react-native-gesture-handler', () => {
  const ReactLocal = require('react');
  const { View: MockView } = require('react-native');

  const makeGesture = () => ({
    onEnd() {
      return this;
    },
    runOnJS() {
      return this;
    },
  });

  return {
    Gesture: {
      Pan: makeGesture,
    },
    GestureDetector: ({ children }: { children?: React.ReactNode }) =>
      ReactLocal.createElement(ReactLocal.Fragment, null, children),
    GestureHandlerRootView: MockView,
  };
});

jest.mock('@/components/styled/Text', () => {
  const ReactLocal = require('react');
  const { Text: MockText } = require('react-native');

  return function MockStyledText({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) {
    return ReactLocal.createElement(MockText, props, children);
  };
});

jest.mock('@/components/mentions', () => {
  const ReactLocal = require('react');
  const { TextInput: MockTextInput } = require('react-native');

  return {
    MentionInput: ({
      placeholder,
      value,
      onChangeText,
      inputRef,
    }: {
      placeholder?: string;
      value?: string;
      onChangeText?: (next: string) => void;
      inputRef?: React.RefObject<TextInput | null>;
    }) =>
      ReactLocal.createElement(MockTextInput, {
        ref: inputRef,
        testID: 'composer-mention-input',
        placeholder,
        value,
        onChangeText,
      }),
    useMentionSuggestions: () => ({
      suggestions: [],
      isLoading: false,
      isError: false,
    }),
  };
});

jest.mock('@/src/components/CustomModal', () => {
  const ReactLocal = require('react');

  return function MockCustomModal({
    children,
    modalVisible,
  }: {
    children?: React.ReactNode;
    modalVisible?: boolean;
  }) {
    return modalVisible ? ReactLocal.createElement(ReactLocal.Fragment, null, children) : null;
  };
});

const tools: LecternToolDef[] = [
  { id: 'photo', label: 'Photo', icon: 'photo-library' },
  { id: 'video', label: 'Video', icon: 'videocam' },
  { id: 'gif', label: 'GIF', icon: 'gif-box' },
  { id: 'verse', label: 'Verse', icon: 'menu-book' },
  { id: 'place', label: 'Place', icon: 'place' },
];

const selectedScripture: ScriptureShare = {
  key: 'JHN.3.16',
  reference: 'John 3:16',
  book: 'JHN',
  bookName: 'John',
  chapter: 3,
  verse: 16,
  verseEnd: 16,
  translation: 'BSB',
  text: 'For God so loved the world that He gave His one and only Son.',
};

describe('Composer mobile refinements', () => {
  it('opens the audience sheet and selects Connections', () => {
    const onAudienceChange = jest.fn();
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <ComposerHeader
          scheme="light"
          audience="everyone"
          onAudienceChange={onAudienceChange}
          characterCount={0}
          characterMax={300}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          canSubmit={false}
          isSubmitting={false}
        />
      );
    });

    act(() => {
      tree.root.findByProps({ accessibilityLabel: 'Audience: Everyone' }).props.onPress();
    });

    act(() => {
      tree.root.findByProps({ accessibilityLabel: 'Connections' }).props.onPress();
    });

    expect(onAudienceChange).toHaveBeenCalledWith('connections');
  });

  it('does not render the mobile preview button', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <ComposerHeader
          scheme="light"
          audience="everyone"
          onAudienceChange={jest.fn()}
          characterCount={0}
          characterMax={300}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          canSubmit={false}
          isSubmitting={false}
        />
      );
    });

    expect(tree.root.findAllByProps({ accessibilityLabel: 'Toggle preview' })).toHaveLength(0);
  });

  it('keeps the caption field rendered when post options are compact', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <ComposerLectern
          scheme="light"
          caption=""
          onChangeCaption={jest.fn()}
          mentions={[]}
          selection={{ start: 0, end: 0 }}
          onSelectionChange={jest.fn()}
          onSelectSuggestion={jest.fn()}
          onHandleBackspace={jest.fn()}
          activeMention={null}
          tools={tools}
          onToolPress={jest.fn()}
          expanded={false}
          onExpandedChange={jest.fn()}
        />
      );
    });

    expect(tree.root.findByProps({ testID: 'composer-caption-field' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'composer-mention-input' }).props.placeholder).toBe(
      'Share a testimony, a verse, a prayer request...'
    );
  });

  it('uses separate UI regions for selected scripture and book options', () => {
    let selectedTree!: TestRenderer.ReactTestRenderer;
    let booksTree!: TestRenderer.ReactTestRenderer;

    act(() => {
      selectedTree = TestRenderer.create(
        <ComposerScripturePicker
          palette={LIGHT_COMPOSER_PALETTE}
          selected={selectedScripture}
          onSelect={jest.fn()}
          onClear={jest.fn()}
        />
      );
    });

    act(() => {
      booksTree = TestRenderer.create(
        <ComposerScripturePicker
          palette={LIGHT_COMPOSER_PALETTE}
          selected={null}
          onSelect={jest.fn()}
          onClear={jest.fn()}
        />
      );
    });

    expect(selectedTree.root.findByProps({ testID: 'selected-scripture-preview' })).toBeTruthy();
    expect(booksTree.root.findByProps({ testID: 'scripture-book-options' })).toBeTruthy();
    expect(booksTree.root.findAllByType(Text).some((node) => node.props.children === 'Books')).toBe(
      true
    );
  });
});
