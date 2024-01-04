import { ApiCall } from '@/src/Services/api';
import { ACTIONS } from '../action-types';

function* GetTwiterPostRequest(params) {
  try {
    const res = yield ApiCall({
      route: `https://api.twitter.com/2/users/${params.data.id}/tweets?tweet.fields=attachments,created_at&media.fields=preview_image_url`,
      token:
        'AAAAAAAAAAAAAAAAAAAAAFP6dQEAAAAA%2FAl8wnO4Ys2AQnuT8HPMMXazjhQ%3Dk6hiJp9aj5Rd9f7Jzb9QMjp740dbMecAGaC8NcchpaRfvHlYPn',
      verb: 'get',
      external: true,
    });
    if (res?.status == '200') {
      const array = [...params?.data?.previous, ...res.data];
      yield put(SetSocial(array));
    } else {
      console.log('error', res?.data);
    }
  } catch (e) {
    console.log(`saga get twitter timline ${params.data.id} error -- `, e.toString());
  }
}
export function* GetTwiterPostSaga() {
  yield takeLatest(ACTIONS.GET_SOCIAL, GetTwiterPostRequest);
}
