import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T, Fonts } from '@/constants/theme';
import type { IOrder } from '@/types/order';
import { PinIcon } from '@/components/ui/icons';
import { PulseDot } from '@/components/ui/pulse-dot';
import { StatusPill } from './status-pill';

interface OrderCardProps {
  order:    IOrder;
  live?:    boolean;
  onPress?: () => void;
}

export function OrderCard({ order, live = false, onPress }: OrderCardProps) {
  const orderId = order._id.slice(-4).toUpperCase();
  const time = new Date(order.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={[styles.card, live && styles.cardLive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <View style={styles.idRow}>
          {live && <PulseDot size={6} color={T.transit} />}
          <Text style={styles.orderId}>ORD-{orderId}</Text>
        </View>
        <StatusPill status={order.status} />
      </View>

      <Text style={styles.customer} numberOfLines={1}>
        {order.customerName}
      </Text>

      <View style={styles.addressRow}>
        <PinIcon size={12} color={T.faint} />
        <Text style={styles.address} numberOfLines={2}>
          {order.deliveryAddress}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          {order.coordinates != null && (
            <MetaItem
              label="COORDS"
              value={`${order.coordinates.lat.toFixed(4)}, ${order.coordinates.lng.toFixed(4)}`}
              mono
            />
          )}
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MetaItem({
  label, value, mono = false,
}: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, mono && styles.metaMono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.surface,
    borderRadius: 14,
    padding: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  cardLive: {
    borderColor: T.transit,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    color: T.muted,
    letterSpacing: 0.4,
  },
  customer: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '600',
    color: T.ink,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  address: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: T.ink2,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
    borderStyle: 'dashed',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaItem: { gap: 1 },
  metaLabel: {
    fontFamily: Fonts.sans,
    fontSize: 9,
    fontWeight: '600',
    color: T.faint,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: T.ink,
    fontWeight: '600',
  },
  metaMono: { fontFamily: Fonts.mono },
  time: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: T.faint,
  },
});
