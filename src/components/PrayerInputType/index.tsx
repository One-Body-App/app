import React, { useState } from 'react';
import { ScrollView, Text, TextInput, Pressable, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import PropTypes from 'prop-types';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { getAllPrayer, getMyPrayer, getTestimonies } from '@/src/redux/actions/PrayerAction';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import {
  buildPendingModerationReviewPayload,
  callBackendFallbackModeration,
  moderateClientText,
} from '@/src/services/moderation/clientModeration';
import type { ModerationReviewCheckPayload } from '@/src/services/moderation/types';
import Button from '../Button';
import { sanitizeComposerText } from '@/components/composer/composerText';
import StyledText from '../styled/Text';
import styles from './styles';

interface PrayerInputTypeProps {
  color?: string;
}

function PrayerInputType({ color }: PrayerInputTypeProps) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [prayerTypeShow, setPrayerTypeShow] = useState(false);
  const [payerType, setPrayerType] = useState<string | null>(null);
  const [prayer, setPrayer] = useState('');
  const [error, setError] = React.useState<string | null>(null);

  const validatePrayer = () => {
    if (prayer !== '' && payerType !== null) {
      if (prayer.length <= 150) {
        setError(null);
        createPrayer();
      } else {
        setError('prayer text must be within 1 to 150.');
      }
    } else {
      if (prayer === '') {
        setError('prayer required!');
      }
      if (payerType === null) {
        setPrayerTypeShow(true);
        setError('prayer type is required!');
      }
    }
  };

  const createPrayer = async () => {
    dispatch(setLoader(true));
    const moderation = await moderateClientText(prayer);
    let pendingReviewCheck: ModerationReviewCheckPayload | undefined;
    if (moderation.action === 'block') {
      dispatch(setLoader(false));
      Toast.show('This prayer was screened because it violates our Terms of Use.', Toast.LONG);
      return;
    }

    if (moderation.action === 'fallback') {
      try {
        const fallbackResponse = await callBackendFallbackModeration({
          type: 'text',
          content: prayer,
          clientMetadata: {
            source: moderation.source,
            scores: moderation.scores,
            reason: moderation.reason,
            model: moderation.model,
          },
        });

        if (fallbackResponse.finalAction !== 'allow') {
          pendingReviewCheck = {
            type: 'text',
            clientSource: moderation.source,
            clientScores: moderation.scores,
            clientReason: moderation.reason,
            clientModel: moderation.model,
            fallbackAction: fallbackResponse.finalAction,
            fallbackProvider: fallbackResponse.provider,
            fallbackFlagged: fallbackResponse.flagged,
            fallbackModel: fallbackResponse.model,
            fallbackResults: fallbackResponse.results,
          };
        }
      } catch (_fallbackError) {
        dispatch(setLoader(false));
        Toast.show('Unable to complete moderation right now. Please try again.', Toast.LONG);
        return;
      }
    }

    if (payerType === 'answer') {
      dispatch(setLoader(true));
      try {
        const res = await ApiCall({
          params: { answer: prayer },
          token,
          route: 'prayers/answer-prayer',
          verb: 'patch',
        });

        if (res?.status === 200) {
          dispatch(setLoader(false));
          setPrayerTypeShow(false);
          setPrayerType(null);
          setPrayer('');
          dispatch(
            getMyPrayer({
              page: 1,
              token,
            })
          );
          dispatch(
            getTestimonies({
              page: 1,
              token,
            })
          );

          dispatch(
            getAllPrayer({
              page: 1,
              token,
            })
          );
          //  Toast.show('Answer submit Sucessfuly')
        } else {
          dispatch(setLoader(false));
        }
      } catch (e) {
        // no-op: handle silently
      }
    } else {
      try {
        const res = await ApiCall({
          params: {
            prayer,
            prayerType: payerType,
            moderationReview: buildPendingModerationReviewPayload(
              [pendingReviewCheck].filter(Boolean) as ModerationReviewCheckPayload[]
            ),
          },
          token,
          route: 'prayers/new-prayer',
          verb: 'post',
        });

        if (res?.status === 200) {
          dispatch(setLoader(false));
          setPrayerTypeShow(false);
          setPrayerType(null);
          setPrayer('');
          Toast.show(res?.response?.message || 'Your prayer was submitted.', Toast.LONG);

          dispatch(
            getMyPrayer({
              page: 1,
              token,
            })
          );
          dispatch(
            getAllPrayer({
              page: 1,
              token,
            })
          );
        }
      } catch (e) {
        // no-op: handle silently
      }
    }
  };

  return (
    <View>
      {prayerTypeShow ? (
        <ScrollView showsHorizontalScrollIndicator={false} horizontal>
          <View style={styles.prayerTypeView}>
            <Button
              btnStyle={payerType === 'anonymous' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType === 'anonymous' ? { color: 'white' } : { color: '#5B7279' }}
              text="Anonymous"
              onPress={() => setPrayerType('anonymous')}
            />
            <Button
              btnStyle={payerType === 'prayer-request' ? styles.btnSelected : styles.btn}
              btnTextStyle={
                payerType === 'prayer-request' ? { color: 'white' } : { color: '#5B7279' }
              }
              text="Prayer Request"
              onPress={() => setPrayerType('prayer-request')}
            />
            <Button
              btnStyle={payerType === 'exhortation' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType === 'exhortation' ? { color: 'white' } : { color: '#5B7279' }}
              text="Exhortation"
              onPress={() => setPrayerType('exhortation')}
            />
            <Button
              btnStyle={payerType === 'answer' ? styles.btnSelected : styles.btn}
              btnTextStyle={payerType === 'answer' ? { color: 'white' } : { color: '#5B7279' }}
              text="Testimonies"
              onPress={() => setPrayerType('answer')}
            />
          </View>
        </ScrollView>
      ) : null}
      <View style={styles.ModelInputView}>
        <TextInput
          placeholderTextColor={color}
          value={prayer}
          placeholder="  Share a prayer request, exhortation, or testimony"
          // onPressIn={() => setPrayerTypeShow(true)}
          onFocus={() => setPrayerTypeShow(true)}
          onChangeText={(e) => {
            setPrayer(sanitizeComposerText(e, 150));
            setError(null);
          }}
          multiline
          style={{
            ...styles.TextInput,
            color,
            backgroundColor: '#f6f6f6',
            borderWidth: 0,
          }}
        />

        <Pressable
          onPress={() => {
            validatePrayer();
          }}
          style={styles.Button}
        >
          <Ionicons name="send" size={20} color="#032F3C" />
        </Pressable>
      </View>
      {prayer !== '' && error === null ? (
        <StyledText
          style={{
            color,
            paddingLeft: getWidth(5),
            marginBottom: getHeight(1),
          }}
        >
          {prayer !== '' ? prayer.length : null}/150 Characters left
        </StyledText>
      ) : (
        <View
          style={{
            paddingLeft: getWidth(5),
            marginBottom: getHeight(1),
          }}
        />
      )}
      {error !== null ? (
        <View style={styles.nulview}>
          <Text style={styles.errortect}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
export default PrayerInputType;

PrayerInputType.propTypes = {
  color: PropTypes.string,
};
