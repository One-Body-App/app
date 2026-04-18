import { runSaga } from 'redux-saga';
import { ACTIONS } from '../action-types';
import { getProfile } from '../actions/AuthActions';
import { setUserProfile } from '../actions/UserAction';
import { UserGetRequest } from './UserSaga';

const mockApiCall = jest.fn();

jest.mock('@/src/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));

describe('UserGetRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards pullSavedData from the action payload when refreshing profile data', async () => {
    mockApiCall.mockResolvedValue({
      status: 200,
      response: {
        _id: 'user-1',
        savedPost: [{ postId: 'post-1', type: 'social' }],
      },
    });

    const dispatched: any[] = [];

    await runSaga(
      {
        dispatch: (action) => dispatched.push(action),
      },
      UserGetRequest,
      {
        type: ACTIONS.GET_User_GET,
        data: {
          token: 'token-1',
          pullSavedData: true,
        },
      }
    ).toPromise();

    expect(mockApiCall).toHaveBeenCalledWith({
      token: 'token-1',
      route: 'user/my-profile?pullSavedData=true',
      verb: 'get',
    });
    expect(dispatched).toEqual([
      { type: ACTIONS.SET_LOADER, data: false },
      setUserProfile({
        _id: 'user-1',
        savedPost: [{ postId: 'post-1', type: 'social' }],
      }),
      getProfile.Success({
        _id: 'user-1',
        savedPost: [{ postId: 'post-1', type: 'social' }],
      }),
    ]);
  });
});
