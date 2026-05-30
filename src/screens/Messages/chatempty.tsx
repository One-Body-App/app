import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import MaterialIcons from '@react-native-vector-icons/material-icons';

type ChatEmptyStateProps = {
  variant?: 'default' | 'search';
  query?: string;
};

function ChatEmptyState({ variant = 'default', query }: ChatEmptyStateProps) {
  const { colors } = useTheme();
  const trimmedQuery = (query || '').trim();

  if (variant === 'default') {
    return (
      <View style={styles.defaultWrap}>
        <View style={[styles.defaultIconCircle, { backgroundColor: colors.card }]}>
          <MaterialIcons name="chat-bubble-outline" size={56} color="#b8c4cf" />
        </View>
        <Text style={styles.defaultTitle}>No messages yet</Text>
        <Text style={styles.defaultSubtitle}>Start chatting with others to see your messages</Text>
      </View>
    );
  }

  return (
    <View style={styles.searchEmptyWrap}>
      <View style={[styles.searchIconCircle, { backgroundColor: colors.card }]}>
        <MaterialIcons name="chat-bubble-outline" size={34} color={colors.text} />
      </View>
      <Text style={[styles.searchTitle, { color: colors.text }]}>No results found</Text>
      <Text style={[styles.searchSubtitle, { color: colors.text }]}>
        {trimmedQuery ? `No conversations match "${trimmedQuery}".` : 'Try searching by name.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  defaultWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  defaultIconCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  defaultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(184, 196, 207, 0.9)',
  },
  defaultSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(184, 196, 207, 0.68)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  searchEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  searchIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  searchTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  searchSubtitle: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.75,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatEmptyState;
