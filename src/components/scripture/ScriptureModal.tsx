import React, { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '@/src/redux/reducers/rootReducer';
import type { ScriptureMention } from '@/utils/types';
import {
  bibleAppUrl,
  DEFAULT_TRANSLATION,
  fetchTranslations,
  fetchVerse,
  type BibleTranslation,
  type VerseResult,
} from '@/services/scripture';

// Strict brand colors per spec.
const SURFACE = '#e6eaec';
const HEADER = '#41899f';
const TEXT = '#032f3c';
const LINK = '#41dbe1';

/**
 * Verse popup for mobile. Opens when a scripture hyperlink in the feed is
 * tapped. Shows a loading state, fetches the verse (proxied + cached via our
 * API), and lets the reader switch translation independently of the poster.
 */
export function ScriptureModal({
  visible,
  mention,
  posterTranslation = DEFAULT_TRANSLATION,
  onClose,
}: {
  visible: boolean;
  mention: ScriptureMention | null;
  posterTranslation?: string;
  onClose: () => void;
}) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [translation, setTranslation] = useState(posterTranslation);
  const [verse, setVerse] = useState<VerseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Reset the chosen version to the poster's whenever a new reference opens.
  useLayoutEffect(() => {
    if (visible) setTranslation(posterTranslation);
  }, [visible, posterTranslation, mention]);

  useLayoutEffect(() => {
    if (!visible || !mention) return;
    let active = true;
    setLoading(true);
    setError(false);
    fetchVerse(mention, translation, token ?? true)
      .then((v) => active && (setVerse(v), setLoading(false)))
      .catch(() => active && (setError(true), setLoading(false)));
    return () => {
      active = false;
    };
  }, [visible, mention, translation, token]);

  useLayoutEffect(() => {
    let active = true;
    fetchTranslations(token ?? true).then((l) => active && setTranslations(l));
    return () => {
      active = false;
    };
  }, [token]);

  const options: BibleTranslation[] = translations.length
    ? translations
    : [
        { id: 'BSB', name: 'Berean Standard Bible', englishName: 'BSB', language: 'eng' },
        { id: 'engKJV', name: 'King James Version', englishName: 'KJV', language: 'eng' },
        { id: 'WEB', name: 'World English Bible', englishName: 'WEB', language: 'eng' },
      ];
  const activeLabel =
    options.find((o) => o.id === translation)?.shortName ||
    options.find((o) => o.id === translation)?.englishName ||
    translation;
  const shareCount = mention?.shareCount ?? 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.head}>
            <Text style={styles.ref} numberOfLines={1}>
              {mention?.reference}
            </Text>
            <Pressable style={styles.versionBtn} onPress={() => setPickerOpen((v) => !v)}>
              <Text style={styles.versionText}>{activeLabel} ▾</Text>
            </Pressable>
            <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {/* Inline version list (taps swap the reading translation). */}
          {pickerOpen ? (
            <View style={styles.picker}>
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  style={styles.pickerRow}
                  onPress={() => {
                    setTranslation(o.id);
                    setPickerOpen(false);
                  }}
                >
                  <Text
                    style={[styles.pickerRowText, o.id === translation && styles.pickerRowActive]}
                  >
                    {o.englishName || o.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.body}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={HEADER} />
                <Text style={styles.loadingText}>Loading verse…</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>
                Couldn’t load this verse right now. Please try again.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 280 }}>
                <Text style={styles.verseText}>{verse?.text}</Text>
              </ScrollView>
            )}

            {!loading && !error ? (
              <View style={styles.shareCountRow}>
                <Text style={styles.shareCountText}>{shareCount.toLocaleString()} shares</Text>
              </View>
            ) : null}

            {!loading && !error && mention ? (
              <Pressable
                onPress={() => {
                  // Native share sheet = the OS "picker"; routes the reference +
                  // YouVersion link to whichever Bible app the reader chooses.
                  Share.share({
                    message: `${mention.reference} — ${bibleAppUrl(mention)}`,
                    url: bibleAppUrl(mention),
                  }).catch(() => {
                    /* dismissed — no-op */
                  });
                }}
                hitSlop={6}
              >
                <Text style={styles.openLink}>Open in Bible app →</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(3,47,60,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: SURFACE,
    borderRadius: 18,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: HEADER,
  },
  ref: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  versionBtn: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  versionText: { color: TEXT, fontSize: 12, fontWeight: '600' },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 20, lineHeight: 22 },
  picker: { backgroundColor: '#fff', paddingVertical: 4 },
  pickerRow: { paddingHorizontal: 16, paddingVertical: 10 },
  pickerRowText: { color: TEXT, fontSize: 14 },
  pickerRowActive: { color: HEADER, fontWeight: '700' },
  body: { padding: 18 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: TEXT, opacity: 0.7, fontSize: 14 },
  errorText: { color: TEXT, opacity: 0.7, fontSize: 14 },
  verseText: { color: TEXT, fontSize: 16, lineHeight: 26 },
  shareCountRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(3,47,60,0.14)',
  },
  shareCountText: {
    color: HEADER,
    fontSize: 12,
    fontWeight: '700',
  },
  openLink: {
    marginTop: 16,
    color: HEADER,
    fontSize: 13,
    fontWeight: '600',
  },
});

export const SCRIPTURE_LINK_COLOR = LINK;

export default ScriptureModal;
