import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useEvents } from '../../context/EventsContext';
import { useColors } from '../../context/ThemeContext';
import { useAIChat } from '../../hooks/useAIChat';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { SuggestedActions } from '../../components/chat/SuggestedActions';
import { ChatMessage } from '../../types/ai';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hey! I'm LiveNote AI ✨\n\nI can help you manage your schedule, add tasks, create study plans, and more.\n\nWhat can I do for you today?",
  timestamp: new Date().toISOString(),
};

export const AIChatScreen: React.FC = () => {
  const c = useColors();
  const { events } = useEvents();
  const { messages, isStreaming, sendMessage, stopStreaming, clearHistory } =
    useAIChat('User', events);

  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const allMessages = messages.length === 0 ? [WELCOME_MESSAGE] : messages;

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [allMessages.length, isStreaming]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    setShowSuggestions(false);
    Keyboard.dismiss();
    await sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  const handleSuggestion = useCallback(
    (msg: string) => {
      setShowSuggestions(false);
      sendMessage(msg);
    },
    [sendMessage]
  );

  const handleClear = useCallback(() => {
    clearHistory();
    setShowSuggestions(true);
  }, [clearHistory]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => <ChatBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerAvatar, { backgroundColor: c.primary + '22', borderColor: c.primary + '66' }]}>
            <Text style={styles.headerAvatarIcon}>✨</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>LiveNote AI</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, isStreaming && { backgroundColor: c.primary }]} />
              <Text style={styles.statusText}>
                {isStreaming ? 'Thinking…' : 'Online'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClear}
          disabled={messages.length === 0}
        >
          <Text style={[styles.clearBtnText, messages.length === 0 && styles.clearBtnDisabled]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={listRef}
        data={allMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={isStreaming ? <TypingIndicator /> : null}
      />

      {/* ── Suggested actions (shown on empty state) ── */}
      {showSuggestions && messages.length === 0 && (
        <SuggestedActions onSelect={handleSuggestion} />
      )}

      {/* ── Input bar ── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything…"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!isStreaming}
        />

        {isStreaming ? (
          <TouchableOpacity
            style={[styles.sendBtn, styles.stopBtn, { backgroundColor: c.error, shadowColor: c.error }]}
            onPress={stopStreaming}
          >
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: c.primary, shadowColor: c.primary }, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '22',
    borderWidth: 1.5,
    borderColor: colors.primary + '66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarIcon: { fontSize: 18 },
  headerTitle: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  statusDotActive: {
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: typography.tiny,
    color: colors.textTertiary,
  },
  clearBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtnText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  clearBtnDisabled: {
    color: colors.textTertiary,
    opacity: 0.4,
  },

  // Messages
  messageList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: colors.surfaceVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: typography.bold,
    lineHeight: 24,
  },
  stopBtn: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
});
