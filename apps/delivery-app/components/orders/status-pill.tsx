import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { T, Fonts } from '@/constants/theme';
import { OrderStatus } from '@/types/order';

interface StatusConfig {
  dot:   string;
  bg:    string;
  ink:   string;
  label: string;
}

const STATUS_MAP: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.PENDING]:    { dot: T.pending,   bg: T.pendingBg,   ink: T.pending,   label: 'Pending'    },
  [OrderStatus.IN_TRANSIT]: { dot: T.transit,   bg: T.transitBg,   ink: T.accentInk, label: 'In transit' },
  [OrderStatus.DELIVERED]:  { dot: T.delivered, bg: T.deliveredBg, ink: T.delivered, label: 'Delivered'  },
};

interface StatusPillProps {
  status: OrderStatus;
  size?:  'sm' | 'lg';
}

export function StatusPill({ status, size = 'sm' }: StatusPillProps) {
  const c = STATUS_MAP[status];
  const isLg = size === 'lg';

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: c.bg, paddingVertical: isLg ? 6 : 3, paddingHorizontal: isLg ? 12 : 9 },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.label, { color: c.ink, fontSize: isLg ? 13 : 11 }]}>
        {c.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
