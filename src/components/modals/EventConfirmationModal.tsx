import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Button } from '../common/Button';
import { CalendarEvent, EventCategory, EventPriority } from '../../types/event';

interface EventConfirmationModalProps {
  visible: boolean;
  draft: Pick<CalendarEvent, 'title' | 'start' | 'end'> | null;
  onCancel: () => void;
  onConfirm: (event: Omit<CalendarEvent, 'id'>) => void;
}

export const EventConfirmationModal: React.FC<EventConfirmationModalProps> = ({
  visible,
  draft,
  onCancel,
  onConfirm,
}) => {
  const [title, setTitle] = useState(draft?.title ?? '');

  if (!draft) return null;

  const handleConfirm = () => {
    const base: Omit<CalendarEvent, 'id'> = {
      title: title || draft.title,
      start: draft.start,
      end: draft.end,
      category: 'personal' as EventCategory,
      priority: 'medium' as EventPriority,
      description: '',
      completed: false,
    };
    onConfirm(base);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.label}>TASK DETAILS</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder={draft.title}
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.hint}>
            Start: {draft.start.toLocaleString()}
          </Text>
          <Text style={styles.hint}>End: {draft.end.toLocaleString()}</Text>
          <View style={styles.actions}>
            <Button
              label="Cancel"
              variant="ghost"
              onPress={onCancel}
              style={styles.button}
            />
            <Button
              label="Add to Calendar"
              onPress={handleConfirm}
              style={styles.button}
            />
          </View>
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
  label: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  titleInput: {
    marginTop: spacing.sm,
    fontSize: typography.h3,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

