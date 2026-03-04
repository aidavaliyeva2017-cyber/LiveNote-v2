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
import { CalendarEvent } from '../../types/event';
import { formatTimeRange } from '../../utils/dateUtils';

interface EventDetailModalProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<CalendarEvent>) => void;
  onDelete: (id: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  visible,
  event,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState(event?.title ?? '');
  const [notes, setNotes] = useState(event?.description ?? '');

  if (!event) return null;

  const handleSave = () => {
    onSave(event.id, { title, description: notes });
  };

  const handleDelete = () => {
    onDelete(event.id);
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
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.topLabel}>TASK DETAILS</Text>
          </View>

          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
          />
          <Text style={styles.meta}>
            {formatTimeRange(event.start, event.end)}
          </Text>

          <Text style={styles.sectionLabel}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          <View style={styles.bottomRow}>
            <Button
              label="Delete"
              variant="ghost"
              onPress={handleDelete}
              style={styles.bottomButton}
            />
            <Button
              label="Save Changes"
              onPress={handleSave}
              style={styles.bottomButton}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  closeText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  topLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  titleInput: {
    fontSize: typography.h3,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  meta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notesInput: {
    minHeight: 80,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceVariant,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  bottomButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

