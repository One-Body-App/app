import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { Pressable } from 'react-native';
import UnderReviewCard from '../UnderReviewCard';

jest.mock('react-native-fast-image', () => 'FastImage');

jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');

jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({
    dark: false,
    colors: {
      text: '#032f3c',
      background: '#ffffff',
      card: '#ffffff',
      border: '#e6eaec',
      primary: '#126b87',
      notification: '#d13a3f',
    },
  }),
}));

const createTree = (element: React.ReactElement): ReactTestRenderer => {
  let testRenderer: ReactTestRenderer | undefined;
  act(() => {
    testRenderer = renderer.create(element);
  });
  if (!testRenderer) {
    throw new Error('Failed to create test renderer');
  }
  return testRenderer;
};

const flattenText = (instance: ReactTestInstance | string): string => {
  if (typeof instance === 'string') {
    return instance;
  }
  const children = instance.children ?? [];
  return children
    .map((child) => (typeof child === 'string' ? child : flattenText(child as ReactTestInstance)))
    .join('');
};

const findByAccessibilityLabel = (
  root: ReactTestInstance,
  label: string
): ReactTestInstance | null => {
  try {
    return root.findByProps({ accessibilityLabel: label });
  } catch {
    return null;
  }
};

const hasText = (root: ReactTestInstance, text: string): boolean =>
  flattenText(root).includes(text);

describe('UnderReviewCard', () => {
  it('renders the default copy when no overrides are provided', () => {
    const tree = createTree(<UnderReviewCard />);
    expect(hasText(tree.root, 'UNDER REVIEW')).toBe(true);
    expect(hasText(tree.root, 'Pause for a moment')).toBe(true);
    act(() => tree.unmount());
  });

  it('hides the "View what was flagged" CTA when there are no categories', () => {
    const tree = createTree(<UnderReviewCard />);
    expect(findByAccessibilityLabel(tree.root, 'View what was flagged')).toBeNull();
    act(() => tree.unmount());
  });

  it('shows and toggles the flagged categories when provided', () => {
    const tree = createTree(<UnderReviewCard flaggedCategories={['sexual', 'violence']} />);
    expect(hasText(tree.root, 'sexual')).toBe(false);
    const trigger = findByAccessibilityLabel(tree.root, 'View what was flagged');
    expect(trigger).not.toBeNull();
    act(() => {
      trigger!.props.onPress?.();
    });
    expect(hasText(tree.root, 'sexual')).toBe(true);
    expect(hasText(tree.root, 'violence')).toBe(true);
    const hideTrigger = findByAccessibilityLabel(tree.root, 'Hide details');
    expect(hideTrigger).not.toBeNull();
    act(() => {
      hideTrigger!.props.onPress?.();
    });
    expect(hasText(tree.root, 'sexual')).toBe(false);
    act(() => tree.unmount());
  });

  it('invokes onAppeal when the appeal CTA is pressed', () => {
    const onAppeal = jest.fn();
    const tree = createTree(<UnderReviewCard onAppeal={onAppeal} />);
    const appealButton = findByAccessibilityLabel(
      tree.root,
      'Request a steward to take another look'
    );
    expect(appealButton).not.toBeNull();
    act(() => {
      appealButton!.props.onPress?.();
    });
    expect(onAppeal).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('caps thumbnail rendering at 4 and shows a +N tile for the rest', () => {
    const thumbs = Array.from({ length: 6 }, (_, index) => ({
      id: `m_${index}`,
      uri: `file:///tmp/${index}.jpg`,
      kind: 'photo' as const,
    }));
    const tree = createTree(<UnderReviewCard thumbnails={thumbs} />);
    expect(hasText(tree.root, '+2')).toBe(true);
    act(() => tree.unmount());
  });

  it('all Pressable instances expose an onPress handler', () => {
    const tree = createTree(
      <UnderReviewCard
        flaggedCategories={['violence']}
        onAppeal={() => undefined}
        onView={() => undefined}
      />
    );
    const pressables = tree.root.findAllByType(Pressable);
    expect(pressables.length).toBeGreaterThan(0);
    pressables.forEach((pressable) => {
      expect(typeof pressable.props.onPress).toBe('function');
    });
    act(() => tree.unmount());
  });
});
