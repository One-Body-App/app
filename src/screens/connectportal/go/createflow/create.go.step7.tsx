import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { getConnectPortalEventById } from '@/src/services/connectPortal';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep7Success'>;

function EventSuccessScreen({ navigation, route }: Props): React.JSX.Element {
  const [title, setTitle] = useState('Your Event');

  useEffect(() => {
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
  }, [route.params.draftId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('ConnectGoEventDash')}>
            <Text style={styles.headerButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Success</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.checkBubble}>
              <Text style={styles.checkMark}>OK</Text>
            </View>
            <Text style={styles.heroTitle}>Your event is live.</Text>
            <Text style={styles.heroBody}>
              `{title}` is now available in the organizer views and public `Go!` list and map
              surfaces.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Next Steps</Text>
            <Text style={styles.cardBody}>
              Share and QR utilities stay as placeholders in this implementation. The organizer
              dashboard and event detail screens are fully wired.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ConnectGoEventDash')}
          >
            <Text style={styles.primaryButtonText}>Go to Event Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              navigation.navigate('ConnectGoEventView', { eventId: route.params.draftId })
            }
          >
            <Text style={styles.secondaryButtonText}>View Event</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F8',
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
    color: '#126b87',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#032f3c',
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
    backgroundColor: '#EAF5F7',
  },
  checkMark: {
    color: '#126b87',
    fontSize: 18,
    fontWeight: '900',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#032f3c',
    textAlign: 'center',
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4F6D77',
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#032f3c',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4F6D77',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#126b87',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#032f3c',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default EventSuccessScreen;
