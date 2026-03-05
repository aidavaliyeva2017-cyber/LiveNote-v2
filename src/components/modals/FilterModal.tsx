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
  onChange: (selected: EventCategory[]) => void;
  onClose: () => void;
}

const CATEGORY_ROWS: { key: EventCategory; label: string; color: string }[] = [
  { key: 'work', label: 'Work / School', color: colors.categoryWork },
  { key: 'personal', label: 'Personal', color: colors.categoryPersonal },
  { key: 'health', label: 'Health', color: colors.categoryHealth },
  { key: 'social', label: 'Social', color: colors.categorySocial },
  { key: 'errands', label: 'Errands', color: colors.categoryErrands },
  { key: 'hobbies', label: 'Hobbies', color: colors.categoryHobbies },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  selected,
  onChange,
  onClose,
}) => {
  const handleToggle = (cat: EventCategory) => {
    onChange(
      selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat],
    );
  };

  const handleSelectAll = () => {
    onChange(CATEGORY_ROWS.map((r) => r.key));
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
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Filter Categories</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          {CATEGORY_ROWS.map(({ key, label, color }) => {
            const active = selected.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={styles.row}
                onPress={() => handleToggle(key)}
              >
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.label}>{label}</Text>
                <View style={[styles.checkbox, active && styles.checkboxActive]}>
                  {active ? <View style={styles.checkboxInner} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSelectAll}>
              <Text style={styles.secondaryText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryText}>Apply</Text>
            </TouchableOpacity>
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.round,
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  checkboxActive: {
    borderColor: colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.textSecondary,
    fontWeight: typography.semibold as any,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.textPrimary,
    fontWeight: typography.semibold as any,
  },
});

