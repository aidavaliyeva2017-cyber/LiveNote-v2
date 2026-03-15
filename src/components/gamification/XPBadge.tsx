import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';

interface Props {
  visible: boolean;
  amount?: number;
}

export function XPBadge({ visible, amount = 1 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(1);
    translateY.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -24,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.badge, { opacity, transform: [{ translateY }] }]}
    >
      <Text style={styles.text}>+{amount} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: typography.tiny,
    fontWeight: typography.bold,
    color: '#000',
  },
});
