import React, { useEffect } from 'react';
import renderer, { act } from 'react-test-renderer';
import { useMentionSuggestions } from '../useMentionSuggestions';

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

function HookHarness({
  query,
  searchUsers,
  onState,
}: {
  query: string;
  searchUsers: any;
  onState: (state: any) => void;
}) {
  const state = useMentionSuggestions({
    query,
    debounceMs: 250,
    searchUsers,
    enabled: true,
  });

  useEffect(() => {
    onState(state);
  }, [onState, state]);

  return null;
}

describe('useMentionSuggestions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces user search requests', async () => {
    const searchUsers = jest.fn().mockResolvedValue([]);
    const onState = jest.fn();

    await act(async () => {
      renderer.create(<HookHarness query="jo" searchUsers={searchUsers} onState={onState} />);
    });

    expect(searchUsers).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(249);
    });
    expect(searchUsers).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await flushPromises();

    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'jo',
      })
    );
  });

  it('keeps the latest response when older requests resolve after newer ones', async () => {
    let resolveFirst: (value: any) => void = () => undefined;
    let resolveSecond: (value: any) => void = () => undefined;
    const searchUsers = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          })
      );
    const onState = jest.fn();

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <HookHarness query="jo" searchUsers={searchUsers} onState={onState} />
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      tree!.update(<HookHarness query="john" searchUsers={searchUsers} onState={onState} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      resolveSecond([{ id: 'user-2', username: 'john', name: 'John' }]);
      await Promise.resolve();
    });
    await act(async () => {
      resolveFirst([{ id: 'user-1', username: 'jo', name: 'Jo' }]);
      await Promise.resolve();
    });

    const latestState = onState.mock.calls[onState.mock.calls.length - 1][0];
    expect(latestState.suggestions).toEqual([{ id: 'user-2', username: 'john', name: 'John' }]);
  });

  it('does not mark aborted requests as errors', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    const searchUsers = jest.fn().mockRejectedValue(abortError);
    const onState = jest.fn();

    await act(async () => {
      renderer.create(<HookHarness query="jo" searchUsers={searchUsers} onState={onState} />);
      jest.advanceTimersByTime(250);
    });
    await flushPromises();

    const latestState = onState.mock.calls[onState.mock.calls.length - 1][0];
    expect(latestState.isError).toBe(false);
  });
});
