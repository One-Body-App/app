import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import StyledText from '@/components/styled/Text';
import {
  BIBLE_BOOKS,
  buildScriptureKey,
  DEFAULT_TRANSLATION,
  fetchScriptureShare,
  fetchTranslations,
  parseScriptureLocal,
  type BibleBook,
  type BibleTranslation,
} from '@/services/scripture';
import type { ScriptureMention, ScriptureShare } from '@/utils/types';
import { composerSpace, composerType, type ComposerPalette } from './composerTheme';

type Props = {
  palette: ComposerPalette;
  token?: string;
  selected: ScriptureShare | null;
  onSelect: (share: ScriptureShare) => void;
  onClear: () => void;
};

const matchesBook = (book: BibleBook, query: string): boolean => {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return true;
  return (
    book.name.toLowerCase().includes(normalized) ||
    book.aliases.some((alias) => alias.includes(normalized))
  );
};

const toPayload = (mention: Pick<ScriptureMention, 'book' | 'chapter' | 'verse' | 'verseEnd'>) => ({
  book: mention.book,
  chapter: mention.chapter,
  verse: mention.verse,
  verseEnd: mention.verseEnd,
});

const findBook = (usfm?: string): BibleBook | null =>
  usfm ? (BIBLE_BOOKS.find((book) => book.usfm === usfm.toUpperCase()) ?? null) : null;

const cleanNumberInput = (value: string): string => value.replace(/\D/g, '').slice(0, 3);

const buildStructuredMention = (
  book: BibleBook | null,
  chapterValue: string,
  verseValue: string
): ScriptureMention | null => {
  if (!book) return null;
  const chapter = Number(chapterValue);
  const verse = Number(verseValue);
  if (!chapter || !verse) return null;
  const reference = `${book.name} ${chapter}:${verse}`;
  return {
    reference,
    key: buildScriptureKey(book.usfm, chapter, verse, verse),
    book: book.usfm,
    bookName: book.name,
    chapter,
    verse,
    verseEnd: verse,
    startIndex: 0,
    endIndex: reference.length,
  };
};

const FALLBACK_TRANSLATIONS: BibleTranslation[] = [
  { id: 'BSB', name: 'Berean Standard Bible', englishName: 'BSB', language: 'eng' },
  { id: 'engKJV', name: 'King James Version', englishName: 'KJV', language: 'eng' },
  { id: 'WEB', name: 'World English Bible', englishName: 'WEB', language: 'eng' },
];

const translationLabel = (translation: BibleTranslation): string =>
  translation.shortName || translation.englishName || translation.name || translation.id;

export default function ComposerScripturePicker({
  palette,
  token,
  selected,
  onSelect,
  onClear,
}: Props): React.ReactElement {
  const [query, setQuery] = useState('');
  const [translation, setTranslation] = useState(selected?.translation ?? DEFAULT_TRANSLATION);
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [loadingReference, setLoadingReference] = useState('');
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(() =>
    findBook(selected?.book)
  );
  const [chapter, setChapter] = useState(selected?.chapter ? String(selected.chapter) : '');
  const [verse, setVerse] = useState(selected?.verse ? String(selected.verse) : '');
  const translationOptions = translations.length > 0 ? translations : FALLBACK_TRANSLATIONS;

  const exact = parseScriptureLocal(query)[0] ?? null;
  const structuredMention = buildStructuredMention(selectedBook, chapter, verse);
  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (exact || selectedBook) return [];
    return BIBLE_BOOKS.filter((book) => matchesBook(book, trimmed)).slice(0, 6);
  }, [exact, query, selectedBook]);

  const pickReference = useCallback(
    async (mention: ScriptureMention) => {
      setError('');
      setLoadingReference(mention.reference);
      try {
        const share = await fetchScriptureShare(toPayload(mention), translation, token ?? true);
        onSelect(share);
        setQuery(share.reference);
      } catch {
        setError('Could not load that verse. Check the reference and try again.');
      } finally {
        setLoadingReference('');
      }
    },
    [onSelect, token, translation]
  );

  const changeTranslation = useCallback(
    async (nextTranslation: string) => {
      setTranslation(nextTranslation);
      setError('');
      if (!selected) return;
      setLoadingReference(selected.reference);
      try {
        const share = await fetchScriptureShare(
          toPayload(selected),
          nextTranslation,
          token ?? true
        );
        onSelect(share);
        setQuery(share.reference);
      } catch {
        setError('Could not load that version. Please try again.');
      } finally {
        setLoadingReference('');
      }
    },
    [onSelect, selected, token]
  );

  const loadMoreTranslations = useCallback(async () => {
    if (translationsLoading || translations.length > 0) return;
    setTranslationsLoading(true);
    try {
      const list = await fetchTranslations(token ?? true);
      if (list.length > 0) {
        setTranslations(list);
      }
    } catch {
      setError('Could not load more Bible versions.');
    } finally {
      setTranslationsLoading(false);
    }
  }, [token, translations.length, translationsLoading]);

  const pickBook = useCallback((book: BibleBook) => {
    setSelectedBook(book);
    setQuery(book.name);
    setChapter('');
    setVerse('');
    setError('');
  }, []);

  const clearBook = useCallback(() => {
    setSelectedBook(null);
    setQuery('');
    setChapter('');
    setVerse('');
    setError('');
  }, []);

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: palette.glassElevated,
          borderColor: palette.glassBorder,
        },
      ]}
    >
      <View
        style={[
          styles.search,
          {
            backgroundColor: palette.glass,
            borderColor: palette.glassBorder,
          },
        ]}
      >
        <MaterialIcons name="search" size={18} color={palette.accent} />
        <TextInput
          value={query}
          onChangeText={(next) => {
            setQuery(next);
            setSelectedBook(null);
            setChapter('');
            setVerse('');
            setError('');
          }}
          onSubmitEditing={() => {
            if (exact) {
              pickReference(exact);
            }
          }}
          placeholder="Search a verse, e.g. John 3:16"
          placeholderTextColor={palette.textMuted}
          style={[styles.input, { color: palette.textPrimary }]}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType={exact ? 'done' : 'next'}
        />
      </View>

      <View style={styles.versionBlock}>
        <StyledText style={[styles.versionLabel, { color: palette.textMuted }]}>
          Bible version
        </StyledText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.versionScroller}
        >
          {translationOptions.map((option) => {
            const active = option.id === translation;
            return (
              <Pressable
                key={option.id}
                onPress={() => changeTranslation(option.id)}
                accessibilityRole="button"
                accessibilityLabel={`Use ${translationLabel(option)} Bible version`}
                style={[
                  styles.versionChip,
                  {
                    backgroundColor: active ? palette.accent : palette.glass,
                    borderColor: active ? palette.accent : palette.glassBorder,
                  },
                ]}
              >
                <StyledText
                  style={[
                    styles.versionChipText,
                    { color: active ? '#ffffff' : palette.textPrimary },
                  ]}
                >
                  {translationLabel(option)}
                </StyledText>
              </Pressable>
            );
          })}
          {translations.length === 0 ? (
            <Pressable
              onPress={() => loadMoreTranslations()}
              disabled={translationsLoading}
              accessibilityRole="button"
              accessibilityLabel="Load more Bible versions"
              style={[
                styles.versionChip,
                { backgroundColor: palette.glass, borderColor: palette.glassBorder },
              ]}
            >
              {translationsLoading ? (
                <ActivityIndicator color={palette.accent} size="small" />
              ) : (
                <StyledText style={[styles.versionChipText, { color: palette.accent }]}>
                  More versions
                </StyledText>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      {selected ? (
        <View
          style={[
            styles.selected,
            {
              backgroundColor: palette.glass,
              borderColor: palette.glassBorder,
            },
          ]}
        >
          <View style={styles.selectedText}>
            <StyledText style={[styles.selectedReference, { color: palette.textPrimary }]}>
              {selected.reference}
            </StyledText>
            <StyledText style={[styles.selectedMeta, { color: palette.textMuted }]}>
              {selected.translation}
            </StyledText>
          </View>
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Remove selected scripture"
            hitSlop={8}
            style={styles.iconButton}
          >
            <MaterialIcons name="close" size={18} color={palette.textMuted} />
          </Pressable>
        </View>
      ) : null}

      {exact ? (
        <Pressable
          onPress={() => pickReference(exact)}
          disabled={Boolean(loadingReference)}
          accessibilityRole="button"
          accessibilityLabel={`Use ${exact.reference}`}
          style={[
            styles.exactButton,
            {
              backgroundColor: palette.accent,
              opacity: loadingReference ? 0.65 : 1,
            },
          ]}
        >
          {loadingReference ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <MaterialIcons name="check" size={18} color="#ffffff" />
          )}
          <StyledText style={styles.exactText}>Use {exact.reference}</StyledText>
        </Pressable>
      ) : selectedBook ? (
        <View style={styles.structured}>
          <View
            style={[
              styles.pickedBook,
              { backgroundColor: palette.glass, borderColor: palette.glassBorder },
            ]}
          >
            <View style={styles.pickedBookText}>
              <StyledText style={[styles.pickedBookLabel, { color: palette.textMuted }]}>
                Book
              </StyledText>
              <StyledText style={[styles.pickedBookName, { color: palette.textPrimary }]}>
                {selectedBook.name}
              </StyledText>
            </View>
            <Pressable
              onPress={clearBook}
              accessibilityRole="button"
              accessibilityLabel="Change selected book"
              hitSlop={8}
              style={styles.iconButton}
            >
              <MaterialIcons name="close" size={18} color={palette.textMuted} />
            </Pressable>
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <StyledText style={[styles.fieldLabel, { color: palette.textMuted }]}>
                Chapter
              </StyledText>
              <TextInput
                value={chapter}
                onChangeText={(next) => {
                  setChapter(cleanNumberInput(next));
                  setError('');
                }}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor={palette.textMuted}
                style={[
                  styles.fieldInput,
                  {
                    color: palette.textPrimary,
                    backgroundColor: palette.glass,
                    borderColor: palette.glassBorder,
                  },
                ]}
              />
            </View>

            {chapter ? (
              <View style={styles.field}>
                <StyledText style={[styles.fieldLabel, { color: palette.textMuted }]}>
                  Verse
                </StyledText>
                <TextInput
                  value={verse}
                  onChangeText={(next) => {
                    setVerse(cleanNumberInput(next));
                    setError('');
                  }}
                  keyboardType="number-pad"
                  placeholder="16"
                  placeholderTextColor={palette.textMuted}
                  style={[
                    styles.fieldInput,
                    {
                      color: palette.textPrimary,
                      backgroundColor: palette.glass,
                      borderColor: palette.glassBorder,
                    },
                  ]}
                />
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              if (structuredMention) pickReference(structuredMention);
            }}
            disabled={!structuredMention || Boolean(loadingReference)}
            accessibilityRole="button"
            accessibilityLabel={
              structuredMention ? `Use ${structuredMention.reference}` : 'Use verse'
            }
            style={[
              styles.exactButton,
              {
                backgroundColor: palette.accent,
                opacity: !structuredMention || loadingReference ? 0.65 : 1,
              },
            ]}
          >
            {loadingReference === structuredMention?.reference ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <MaterialIcons name="check" size={18} color="#ffffff" />
            )}
            <StyledText style={styles.exactText}>
              {structuredMention ? `Use ${structuredMention.reference}` : 'Use verse'}
            </StyledText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.suggestions}>
          {suggestions.map((book) => (
            <Pressable
              key={book.usfm}
              onPress={() => pickBook(book)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${book.name}`}
              style={[
                styles.bookButton,
                {
                  backgroundColor: palette.glass,
                  borderColor: palette.glassBorder,
                },
              ]}
            >
              <StyledText style={[styles.bookText, { color: palette.textPrimary }]}>
                {book.name}
              </StyledText>
            </Pressable>
          ))}
        </View>
      )}

      {error ? (
        <StyledText style={[styles.error, { color: palette.moderationBlocked }]}>
          {error}
        </StyledText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: composerSpace.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: composerSpace.sm,
    gap: composerSpace.sm,
  },
  search: {
    minHeight: 44,
    borderRadius: composerSpace.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.xs,
    paddingHorizontal: composerSpace.sm,
  },
  input: {
    flex: 1,
    minHeight: 42,
    padding: 0,
    fontSize: 15,
  },
  versionBlock: {
    gap: 6,
  },
  versionLabel: {
    ...composerType.eyebrow,
    fontWeight: '700',
  },
  versionScroller: {
    gap: composerSpace.xs,
    paddingRight: composerSpace.sm,
  },
  versionChip: {
    minHeight: 34,
    borderRadius: composerSpace.chipRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: composerSpace.sm,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionChipText: {
    ...composerType.caption,
    fontWeight: '700',
  },
  selected: {
    borderRadius: composerSpace.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: composerSpace.sm,
    paddingVertical: composerSpace.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.xs,
  },
  selectedText: {
    flex: 1,
  },
  selectedReference: {
    ...composerType.body,
    fontWeight: '700',
  },
  selectedMeta: {
    ...composerType.caption,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exactButton: {
    minHeight: 42,
    borderRadius: composerSpace.sm,
    paddingHorizontal: composerSpace.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: composerSpace.xs,
  },
  exactText: {
    ...composerType.label,
    color: '#ffffff',
  },
  structured: {
    gap: composerSpace.sm,
  },
  pickedBook: {
    borderRadius: composerSpace.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: composerSpace.sm,
    paddingVertical: composerSpace.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.xs,
  },
  pickedBookText: {
    flex: 1,
  },
  pickedBookLabel: {
    ...composerType.eyebrow,
    fontWeight: '700',
  },
  pickedBookName: {
    ...composerType.body,
    fontWeight: '700',
  },
  fields: {
    flexDirection: 'row',
    gap: composerSpace.sm,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    ...composerType.eyebrow,
    fontWeight: '700',
  },
  fieldInput: {
    minHeight: 44,
    borderRadius: composerSpace.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: composerSpace.sm,
    fontSize: 15,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: composerSpace.xs,
  },
  bookButton: {
    borderRadius: composerSpace.chipRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: composerSpace.sm,
    paddingVertical: composerSpace.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookText: {
    ...composerType.caption,
    fontWeight: '700',
  },
  error: {
    ...composerType.caption,
  },
});
