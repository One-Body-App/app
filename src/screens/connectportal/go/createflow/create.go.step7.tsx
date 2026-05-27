import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { getConnectPortalEventById } from '@/src/services/connectPortal';
import { useCreateFlowPalette } from './shared';
import useMountEffect from '@/src/hooks/useMountEffect';
import { borderRadius } from '@/src/styles/outlines';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep7Success'>;
const GO_EVENT_BUTTON_RADIUS = borderRadius.button;

function EventSuccessScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [title, setTitle] = useState('Your Event');

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      const eventRecord = await getConnectPortalEventById(route.params.draftId);
      if (isActive && eventRecord?.title) {
        setTitle(eventRecord.title);
      }
    })();

    return () => {
      isActive = false;
    };
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.screenBg }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          {Platform.OS === 'android' ? (
            <>
              <Pressable onPress={() => navigation.navigate('ConnectGoEventDash')}>
                <Text style={[styles.headerButton, { color: palette.accent }]}>Close</Text>
              </Pressable>
              <View style={styles.headerTitleAndroidWrap}>
                <Text
                  style={[
                    styles.headerTitle,
                    styles.headerTitleAndroid,
                    { color: palette.headerTitle },
                  ]}
                >
                  Success
                </Text>
              </View>
            </>
          ) : (
            <>
              <Pressable onPress={() => navigation.navigate('ConnectGoEventDash')}>
                <Text style={[styles.headerButton, { color: palette.accent }]}>Close</Text>
              </Pressable>
              <Text style={[styles.headerTitle, { color: palette.headerTitle }]}>Success</Text>
              <View style={styles.headerSpacer} />
            </>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={[styles.checkBubble, { backgroundColor: palette.successBubbleBg }]}>
              <Text style={[styles.checkMark, { color: palette.accent }]}>OK</Text>
            </View>
            <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>
              Your event is live.
            </Text>
            <Text style={[styles.heroBody, { color: palette.textSecondary }]}>
              `{title}` is now available in the organizer views and public `Go!` list and map
              surfaces.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>Next Steps</Text>
            <Text style={[styles.cardBody, { color: palette.textSecondary }]}>
              Share and QR utilities stay as placeholders in this implementation. The organizer
              dashboard and event detail screens are fully wired.
            </Text>
          </View>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: palette.primaryBtnBg }]}
            onPress={() => navigation.navigate('ConnectGoEventDash')}
          >
            <Text style={[styles.primaryButtonText, { color: palette.primaryBtnText }]}>
              Go to Event Dashboard
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              {
                backgroundColor: palette.secondaryBtnBg,
                borderColor: palette.secondaryBtnBorder,
              },
            ]}
            onPress={() =>
              navigation.navigate('ConnectGoEventView', { eventId: route.params.draftId })
            }
          >
            <Text style={[styles.secondaryButtonText, { color: palette.secondaryBtnText }]}>
              View Event
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerButton: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitleAndroidWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.3,
  },
  headerTitleAndroid: {
    textAlign: 'left',
  },
  headerSpacer: {
    width: 48,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 18,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 24,
  },
  checkBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 18,
    fontWeight: '900',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: GO_EVENT_BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: GO_EVENT_BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default EventSuccessScreen;
