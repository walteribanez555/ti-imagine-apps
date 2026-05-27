import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { T } from '@/constants/theme';

interface PulseDotProps {
  color?: string;
  size?: number;
}

export function PulseDot({ color = T.live, size = 8 }: PulseDotProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 2.2,  duration: 800, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,    duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,    duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7,  duration: 800, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, [opacity, scale]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <View
        style={[
          styles.core,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ring:      { position: 'absolute' },
  core:      { position: 'absolute' },
});
