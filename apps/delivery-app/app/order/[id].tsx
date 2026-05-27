import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { T, Fonts } from '@/constants/theme';
import { ordersApi } from '@/services/api';
import { getSocket } from '@/services/socket';
import type { IOrder } from '@/types/order';
import { OrderStatus } from '@/types/order';

import { ChevIcon }        from '@/components/ui/icons';
import { PulseDot }        from '@/components/ui/pulse-dot';
import { StylizedMap }     from '@/components/ui/stylized-map';
import { StatusPill }      from '@/components/orders/status-pill';
import {
  OrderTimeline,
  buildSteps,
}                           from '@/components/orders/order-timeline';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets  = useSafeAreaInsets();

  const [order,   setOrder]   = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    ordersApi.findOne(id)
      .then(setOrder)
      .catch(e => setError(e?.message ?? 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const socket = getSocket();

    const onStatusUpdated = (updated: IOrder) => {
      if (updated._id === id) setOrder(updated);
    };

    socket.on('order:status_updated', onStatusUpdated);
    return () => { socket.off('order:status_updated', onStatusUpdated); };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={T.accent} />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Order not found'}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const orderId  = order._id.slice(-4).toUpperCase();
  const steps    = buildSteps(order.status, order.createdAt);
  const progress = order.status === OrderStatus.DELIVERED
    ? 1
    : order.status === OrderStatus.IN_TRANSIT
      ? 0.6
      : 0.1;

  const createdTime = new Date(order.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });
  const createdDate = new Date(order.createdAt).toLocaleDateString([], {
    month: 'short', day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevIcon dir="left" color={T.ink} size={14} />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <View style={styles.headerMetaRow}>
            {order.status === OrderStatus.IN_TRANSIT && (
              <PulseDot color={T.transit} size={6} />
            )}
            <Text style={styles.headerOrderId}>ORD-{orderId} · LIVE</Text>
          </View>
          <Text style={styles.headerName} numberOfLines={1}>{order.customerName}</Text>
        </View>
        <StatusPill status={order.status} size="lg" />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapWrapper}>
          <StylizedMap height={260} progress={progress} />
        </View>

        <View style={styles.metrics}>
          <MetricCard
            label="Status"
            value={order.status.replace('_', ' ')}
            accent={order.status === OrderStatus.IN_TRANSIT}
          />
          <MetricCard label="Created" value={createdTime} />
          <MetricCard
            label="Coords"
            value={
              order.coordinates
                ? `${order.coordinates.lat.toFixed(3)}, ${order.coordinates.lng.toFixed(3)}`
                : '—'
            }
            small
          />
        </View>

        <View style={styles.section}>
          <SectionLabel>Status timeline</SectionLabel>
          <OrderTimeline steps={steps} />
        </View>

        <View style={styles.section}>
          <SectionLabel>Delivery details</SectionLabel>
          <View style={styles.detailCard}>
            <DetailRow label="Address"  value={order.deliveryAddress} />
            {order.coordinates && (
              <DetailRow
                label="Coordinates"
                value={`${order.coordinates.lat}, ${order.coordinates.lng}`}
                mono
              />
            )}
            <DetailRow label="Created"  value={`${createdDate} · ${createdTime}`} last />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        {order.status !== OrderStatus.DELIVERED && (
          <MarkDeliveredButton orderId={order._id} onUpdated={setOrder} />
        )}
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>Back to list</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, accent = false, small = false }: {
  label: string; value: string; accent?: boolean; small?: boolean;
}) {
  return (
    <View style={[styles.metric, accent && styles.metricAccent]}>
      <Text style={[styles.metricLabel, accent && styles.metricLabelAccent]}>
        {label}
      </Text>
      <Text
        style={[
          styles.metricValue,
          accent && styles.metricValueAccent,
          small && styles.metricValueSmall,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function DetailRow({
  label, value, mono = false, last = false,
}: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, mono && styles.detailMono]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function MarkDeliveredButton({
  orderId, onUpdated,
}: { orderId: string; onUpdated: (o: IOrder) => void }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    try {
      setLoading(true);
      const updated = await ordersApi.updateStatus(orderId, OrderStatus.DELIVERED);
      onUpdated(updated);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.primaryBtn}
      onPress={handle}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color={T.bg} size="small" />
        : <>
            <Text style={styles.primaryBtnText}>Mark delivered</Text>
            <ChevIcon dir="right" color={T.bg} size={12} />
          </>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg },
  errorText: { fontFamily: Fonts.sans, fontSize: 16, color: T.muted, marginBottom: 12 },
  backLink:  { fontFamily: Fonts.sans, fontSize: 14, color: T.accent },

  header: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.bg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerMeta: { flex: 1, minWidth: 0 },
  headerMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2,
  },
  headerOrderId: {
    fontFamily: Fonts.mono,
    fontSize: 10, color: T.muted, fontWeight: '600', letterSpacing: 0.5,
  },
  headerName: {
    fontFamily: Fonts.sans,
    fontSize: 18, fontWeight: '700',
    color: T.ink, letterSpacing: -0.3, lineHeight: 22,
  },

  body:        { flex: 1 },
  bodyContent: { paddingBottom: 100 },
  mapWrapper:  { paddingHorizontal: 14 },

  metrics: {
    paddingHorizontal: 14,
    paddingTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    backgroundColor: T.surface,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 12, padding: 10,
  },
  metricAccent: {
    backgroundColor: T.ink, borderColor: T.ink,
  },
  metricLabel: {
    fontFamily: Fonts.sans,
    fontSize: 9.5, fontWeight: '600',
    color: T.muted, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 4,
  },
  metricLabelAccent: { color: 'rgba(250,248,245,0.6)' },
  metricValue: {
    fontFamily: Fonts.sans,
    fontSize: 16, fontWeight: '700',
    color: T.ink, letterSpacing: -0.4, lineHeight: 20,
    textTransform: 'capitalize',
  },
  metricValueAccent: { color: T.bg },
  metricValueSmall:  { fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0 },

  section:      { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 8 },
  sectionLabel: {
    fontFamily: Fonts.sans,
    fontSize: 11, fontWeight: '600',
    color: T.muted, letterSpacing: 0.6,
    textTransform: 'uppercase', marginBottom: 10,
  },

  detailCard: {
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    borderRadius: 14, paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: {
    fontFamily: Fonts.sans,
    fontSize: 11, fontWeight: '600',
    color: T.muted, letterSpacing: 0.4,
    textTransform: 'uppercase', flexShrink: 0, paddingTop: 1,
  },
  detailValue: {
    fontFamily: Fonts.sans,
    fontSize: 13.5, color: T.ink,
    fontWeight: '600', textAlign: 'right',
    letterSpacing: -0.1, flex: 1,
  },
  detailMono: { fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 0.2 },

  actions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingTop: 16,
    flexDirection: 'row', gap: 10,
    backgroundColor: 'transparent',
  },
  primaryBtn: {
    flex: 1.4, height: 50, borderRadius: 25,
    backgroundColor: T.ink,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnText: {
    fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600', color: T.bg,
  },
  secondaryBtn: {
    flex: 1, height: 50, borderRadius: 25,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600', color: T.ink,
  },
});
