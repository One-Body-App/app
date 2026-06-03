/* eslint-disable import/first */
jest.mock('react-native-fs', () => ({
  readFile: jest.fn(),
}));

jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn(async () => undefined),
  getBackend: jest.fn(() => 'cpu'),
  setBackend: jest.fn(async () => true),
}));

jest.mock('@tensorflow/tfjs-react-native', () => ({}));
jest.mock('@tensorflow/tfjs-backend-cpu', () => ({}));

jest.mock('@tensorflow-models/toxicity', () => ({
  load: jest.fn(),
}));

import * as toxicity from '@tensorflow-models/toxicity';
import { moderateClientText } from '../clientModeration';

describe('moderateClientText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks common profanity before loading the toxicity model', async () => {
    await expect(moderateClientText('Holy shit!')).resolves.toEqual({
      action: 'block',
      source: 'heuristic',
      reason: 'blocked-text:profanity',
    });

    expect(toxicity.load).not.toHaveBeenCalled();
  });

  it('normalizes simple obfuscation before heuristic matching', async () => {
    await expect(moderateClientText('Holy sh!t!')).resolves.toMatchObject({
      action: 'block',
      source: 'heuristic',
      reason: 'blocked-text:profanity',
    });

    expect(toxicity.load).not.toHaveBeenCalled();
  });
});
