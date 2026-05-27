import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { T, Fonts } from '@/constants/theme';

interface StatsStripProps {
  pending:   number;
  transit:   number;
  delivered: number;
}

export function StatsStrip({ pending, transit, delivered }: StatsStripProps) {
  const items = [
    { label: 'Pending',    value: pending,   color: T.pending,   bg: T.pendingBg   },
    { label: 'In transit', value: transit,   color: T.transit,   bg: T.transitBg   },
    { label: 'Delivered',  value: delivered, color: T.delivered, bg: T.deliveredBg },
  ];

  return (
    <View style={styles.row}>
      {items.map(it => (
        <View key={it.label} style={styles.card}>
          <Text style={styles.label}>{it.label}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{it.value}</Text>
            <View style={[styles.dot, { backgroundColor: it.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  card: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 9.5,
    fontWeight: '600',
    color: T.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  value: {
    fontFamily: Fonts.sans,
    fontSize: 24,
    fontWeight: '700',
    color: T.ink,
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginBottom: 4,
    marginLeft: 2,
  },
});
