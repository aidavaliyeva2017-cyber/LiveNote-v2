import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { ChatMessage } from '../../types/ai';
import { format } from 'date-fns';

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>✨</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {message.content}
        </Text>
        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAssistant]}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  avatarIcon: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.large,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  textUser: {
    color: '#fff',
  },
  textAssistant: {
    color: colors.textPrimary,
  },
  time: {
    fontSize: typography.tiny,
    marginTop: 4,
  },
  timeUser: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  timeAssistant: {
    color: colors.textTertiary,
  },
});
