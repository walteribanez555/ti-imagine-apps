import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Fonts } from '@/constants/theme';
import { WifiIcon } from './icons';

interface AppHeaderProps {
  title:       string;
  subtitle?:   string;
  right?:      React.ReactNode;
  connected?:  boolean;
}

export function AppHeader({
  title,
  subtitle,
  right,
  connected = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.left}>
        {subtitle != null && (
          <View style={styles.subtitleRow}>
            <WifiIcon color={connected ? T.delivered : T.muted} size={12} />
            <Text
              style={[
                styles.subtitle,
                { color: connected ? T.delivered : T.muted },
              ]}
            >
              {subtitle}
            </Text>
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      {right != null && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: T.bg,
  },
  left: { flex: 1 },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 26,
    fontWeight: '700',
    color: T.ink,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
