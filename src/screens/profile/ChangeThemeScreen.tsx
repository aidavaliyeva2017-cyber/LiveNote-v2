import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { colors, spacing, typography, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');
const TILE_GAP = spacing.sm;
const TILE_W   = (width - spacing.lg * 2 - TILE_GAP) / 2;

export const ChangeThemeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isGrayscale, setThemeById, toggleGrayscale, primary } = useTheme();

  return (
    <View style={styles.root}>
      {/* ── Navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>App Theme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── B&W Toggle ── */}
        <View style={[styles.bwCard, isGrayscale && styles.bwCardActive]}>
          <View style={styles.bwLeft}>
            <View style={[styles.bwIconWrap, isGrayscale && { backgroundColor: '#888' }]}>
              <Ionicons
                name="contrast-outline"
                size={20}
                color={isGrayscale ? '#fff' : colors.textSecondary}
              />
            </View>
            <View>
              <Text style={styles.bwTitle}>Black & White</Text>
              <Text style={styles.bwSub}>
                {isGrayscale ? 'Active – all colors are gray' : 'Grayscale mode'}
              </Text>
            </View>
          </View>
          <Switch
            value={isGrayscale}
            onValueChange={toggleGrayscale}
            trackColor={{ false: colors.border, true: '#888' }}
            thumbColor={isGrayscale ? '#EFEFEF' : colors.textTertiary}
          />
        </View>

        {/* ── Section label ── */}
        <Text style={styles.sectionLabel}>CHOOSE A COLOR THEME</Text>

        {/* ── Theme Grid ── */}
        <View style={[styles.grid, isGrayscale && styles.gridGrayscale]}>
          {THEMES.map(t => {
            const selected = t.id === theme.id && !isGrayscale;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tile, { width: TILE_W }]}
                onPress={() => {
                  if (isGrayscale) toggleGrayscale(); // disable B&W when picking a color
                  setThemeById(t.id);
                }}
                activeOpacity={0.85}
                disabled={isGrayscale}
              >
                <LinearGradient
                  colors={t.gradient}
                  style={[
                    styles.tileGradient,
                    selected && { borderColor: t.primary, borderWidth: 2.5 },
                    isGrayscale && styles.tileGrayscale,
                  ]}
                >
                  {/* Color preview dots */}
                  <View style={styles.previewDots}>
                    <View style={[styles.dot, { backgroundColor: t.primary }]} />
                    <View style={[styles.dot, { backgroundColor: t.primary + '88' }]} />
                    <View style={[styles.dot, { backgroundColor: t.primary + '44' }]} />
                  </View>

                  {/* Checkmark overlay */}
                  {selected && (
                    <View style={[styles.checkOverlay, { backgroundColor: t.primary + '33' }]}>
                      <View style={[styles.checkCircle, { backgroundColor: t.primary }]}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    </View>
                  )}
                </LinearGradient>

                <View style={styles.tileFooter}>
                  <Text style={[styles.tileName, isGrayscale && { color: colors.textTertiary }]}>
                    {t.name}
                  </Text>
                  {t.isDefault && (
                    <Text style={styles.defaultTag}>DEFAULT</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Note ── */}
        <View style={styles.noteRow}>
          <Ionicons name="color-wand-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.noteText}>
            Theme changes apply instantly across all screens
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: typography.h3, fontWeight: typography.bold, color: colors.textPrimary },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  // B&W Toggle
  bwCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  bwCardActive: {
    borderColor: '#888',
    backgroundColor: '#1A1A1A',
  },
  bwLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  bwIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bwTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  bwSub: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Section label
  sectionLabel: {
    fontSize: typography.tiny,
    fontWeight: typography.bold,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    marginBottom: spacing.lg,
  },
  gridGrayscale: { opacity: 0.45 },

  tile: { borderRadius: borderRadius.large, overflow: 'hidden' },
  tileGradient: {
    height: 110,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tileGrayscale: {
    borderColor: '#333',
  },
  previewDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 18, height: 18, borderRadius: 9 },

  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tileFooter: {
    paddingTop: 7,
    paddingBottom: 4,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileName:   { fontSize: typography.caption, fontWeight: typography.semibold, color: colors.textPrimary },
  defaultTag: { fontSize: 9, color: colors.textTertiary, fontWeight: typography.bold, letterSpacing: 0.5 },

  // Note
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  noteText: { fontSize: typography.caption, color: colors.textTertiary },
});
