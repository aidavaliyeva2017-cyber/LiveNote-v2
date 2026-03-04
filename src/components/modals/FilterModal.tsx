import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { EventCategory } from '../../types/event';

interface FilterModalProps {
  visible: boolean;
  selected: EventCategory[];
  onToggle: (category: EventCategory) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: { key: EventCategory; label: string; dot: string }[] = [
  { key: 'work', label: 'Work / School', dot: '🔵' },
  { key: 'personal', label: 'Personal', dot: '🟣' },
  { key: 'health', label: 'Health', dot: '🟢' },
  { key: 'social', label: 'Social', dot: '🟠' },
  { key: 'errands', label: 'Errands', dot: '🔵' },
  { key: 'hobbies', label: 'Hobbies', dot: '🔴' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  selected,
  onToggle,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Filter Categories</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          {CATEGORY_LABELS.map(({ key, label, dot }) => {
            const active = selected.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={styles.row}
                onPress={() => onToggle(key)}
              >
                <Text style={styles.checkbox}>{active ? '☑' : '☐'}</Text>
                <Text style={styles.dot}>{dot}</Text>
                <Text style={styles.label}>{label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyText}>Apply</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.h3,
    color: colors.textPrimary,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    color: colors.textPrimary,
  },
  dot: {
    width: 24,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  applyButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyText: {
    color: colors.textPrimary,
    fontWeight: typography.semibold as any,
  },
});

