import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Button } from '../common/Button';

export interface ParsedEventDraft {
  title: string;
  start: Date;
  end: Date;
}

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onParsed: (draft: ParsedEventDraft) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  visible,
  onClose,
  onParsed,
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    setLoading(true);
    // Placeholder: a real implementation will call /api/events/parse.
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    onParsed({ title: text.trim(), start, end });
    setLoading(false);
    setText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.header}>✨ TELL LIVENOTE WHAT YOU NEED</Text>
          <TextInput
            style={styles.input}
            placeholder="Tell me what you need to do..."
            placeholderTextColor={colors.textTertiary}
            multiline
            value={text}
            onChangeText={setText}
          />
          <Button
            label="Send"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          />
          <Text style={styles.note}>
            ⚠ AI can make mistakes. Always verify important dates.
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
  },
  header: {
    fontSize: typography.caption,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 100,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body,
    backgroundColor: colors.surfaceVariant,
  },
  button: {
    marginTop: spacing.md,
  },
  note: {
    marginTop: spacing.sm,
    fontSize: typography.tiny,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  closeText: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});

