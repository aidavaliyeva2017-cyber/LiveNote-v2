import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface Props {
  xpTotal: number;
  level: number;
  progress: number; // 0–1
  xpToNext: number;
}

export function XPProgressBar({ xpTotal, level, progress, xpToNext }: Props) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthPercent = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.xpText}>{xpTotal} XP</Text>
        <Text style={styles.nextText}>{xpToNext} XP bis Level {level + 1}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: widthPercent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  xpText: {
    fontSize: typography.tiny,
    color: colors.accentYellow,
    fontWeight: typography.semibold,
  },
  nextText: {
    fontSize: typography.tiny,
    color: colors.textTertiary,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceVariant,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accentYellow,
  },
});
