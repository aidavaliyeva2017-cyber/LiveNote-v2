import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme';
import { useColors } from '../../context/ThemeContext';

interface Props {
  xpTotal: number;
  level: number;
  progress: number; // 0–1
  xpToNext: number;
}

export function XPProgressBar({ xpTotal, level, progress, xpToNext }: Props) {
  const c = useColors();
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
        <Text style={[styles.xpText, { color: c.accentYellow }]}>{xpTotal} XP</Text>
        <Text style={[styles.nextText, { color: c.textTertiary }]}>
          {xpToNext} XP to Level {level + 1}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.surfaceVariant }]}>
        <Animated.View
          style={[styles.fill, { width: widthPercent, backgroundColor: c.accentYellow }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  xpText:  { fontSize: typography.tiny, fontWeight: typography.semibold },
  nextText: { fontSize: typography.tiny },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
