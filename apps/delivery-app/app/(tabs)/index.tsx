import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { T, Fonts } from '@/constants/theme';
import { useOrders } from '@/hooks/use-orders';
import { OrderStatus } from '@/types/order';
import type { IOrder } from '@/types/order';

import { AppHeader }   from '@/components/ui/app-header';
import { Fab }         from '@/components/ui/fab';
import { PulseDot }    from '@/components/ui/pulse-dot';
import { StatsStrip }  from '@/components/orders/stats-strip';
import { FilterChips } from '@/components/orders/filter-chips';
import type { FilterKey } from '@/components/orders/filter-chips';
import { OrderCard }   from '@/components/orders/order-card';

export default function DashboardScreen() {
  const { orders, loading, error, wsConnected, incomingOrder } = useOrders();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => ({
    all:        orders.length,
    pending:    orders.filter(o => o.status === OrderStatus.PENDING).length,
    in_transit: orders.filter(o => o.status === OrderStatus.IN_TRANSIT).length,
    delivered:  orders.filter(o => o.status === OrderStatus.DELIVERED).length,
  }), [orders]);

  const filtered = useMemo(() => {
    const byStatus = filter === 'all' ? orders : orders.filter(o => o.status === (filter as OrderStatus));
    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.trim().toLowerCase();
    return byStatus.filter(o =>
      o.customerName.toLowerCase().includes(q) ||
      o.deliveryAddress.toLowerCase().includes(q) ||
      o._id.toLowerCase().includes(q),
    );
  }, [orders, filter, searchQuery]);

  const now = new Date().toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <AppHeader
        title="Dispatch"
        subtitle="LIVE · WS CONNECTED"
        connected={wsConnected}
        right={
          <HeaderActions
            searchActive={searchOpen}
            onSearchPress={() => {
              if (searchOpen) { setSearchOpen(false); setSearchQuery(''); }
              else setSearchOpen(true);
            }}
            onFilterPress={() => setFilterVisible(true)}
          />
        }
      />

      {searchOpen && (
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Customer, address, order ID…"
              placeholderTextColor={T.faint}
              autoFocus
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity
            style={styles.searchCancelBtn}
            onPress={() => { setSearchOpen(false); setSearchQuery(''); }}
            activeOpacity={0.8}
          >
            <Text style={styles.searchCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <StatsStrip
          pending={counts.pending}
          transit={counts.in_transit}
          delivered={counts.delivered}
        />
      </View>

      <View style={styles.section}>
        <FilterChips active={filter} counts={counts} onChange={setFilter} />
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>
          {searchQuery.trim()
            ? `Results · ${filtered.length} order${filtered.length !== 1 ? 's' : ''}`
            : `Today · ${filtered.length} order${filtered.length !== 1 ? 's' : ''}`}
        </Text>
        <Text style={styles.updatedAt}>UPDATED {now}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList<IOrder>
          data={filtered}
          keyExtractor={o => o._id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              live={incomingOrder?._id === item._id}
              onPress={() => router.push(`/order/${item._id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {incomingOrder != null && <LiveToast order={incomingOrder} />}

      <Fab onPress={() => router.push('/modal')} />

      <FilterModal
        visible={filterVisible}
        active={filter}
        counts={counts}
        onApply={(key) => { setFilter(key); setFilterVisible(false); }}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

function HeaderActions({
  searchActive, onSearchPress, onFilterPress,
}: { searchActive: boolean; onSearchPress: () => void; onFilterPress: () => void }) {
  return (
    <View style={styles.headerActions}>
      <TouchableOpacity
        style={[styles.iconBtn, searchActive && styles.iconBtnActive]}
        onPress={onSearchPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.iconBtnText, searchActive && styles.iconBtnTextActive]}>⌕</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={onFilterPress}>
        <Text style={styles.iconBtnText}>≡</Text>
      </TouchableOpacity>
    </View>
  );
}

function LiveToast({ order }: { order: IOrder }) {
  const orderId = order._id.slice(-4).toUpperCase();
  return (
    <View style={styles.toast} pointerEvents="none">
      <PulseDot color={T.accent} size={8} />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>New order · ORD-{orderId}</Text>
        <Text style={styles.toastSub}>{order.customerName} · pushed via WebSocket</Text>
      </View>
      <Text style={styles.toastTime}>NOW</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyIconBorder} />
        <View style={styles.emptyIconCenter} />
      </View>

      <View style={styles.emptyText}>
        <Text style={styles.emptyTitle}>No orders</Text>
        <Text style={styles.emptyBody}>
          There are no orders to display right now. New deliveries will appear here in real time.
        </Text>
      </View>

      <View style={styles.wsChip}>
        <PulseDot color={T.delivered} size={6} />
        <Text style={styles.wsChipText}>LISTENING ON wss://api/orders</Text>
      </View>
    </View>
  );
}

const FILTER_OPTIONS: { id: FilterKey; label: string; color: string; bg: string }[] = [
  { id: 'all',                   label: 'All orders',  color: T.ink,      bg: T.surface2  },
  { id: OrderStatus.PENDING,     label: 'Pending',     color: T.pending,  bg: T.pendingBg },
  { id: OrderStatus.IN_TRANSIT,  label: 'In transit',  color: T.transit,  bg: T.transitBg },
  { id: OrderStatus.DELIVERED,   label: 'Delivered',   color: T.delivered,bg: T.deliveredBg },
];

interface FilterModalProps {
  visible:  boolean;
  active:   FilterKey;
  counts:   Record<FilterKey, number>;
  onApply:  (key: FilterKey) => void;
  onClose:  () => void;
}

function FilterModal({ visible, active, counts, onApply, onClose }: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<FilterKey>(active);

  React.useEffect(() => { if (visible) setSelected(active); }, [visible, active]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <Pressable style={fStyles.backdrop} onPress={onClose} />

      <View style={[fStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={fStyles.handle} />

        <View style={fStyles.header}>
          <View>
            <Text style={fStyles.headerMeta}>FILTER ORDERS</Text>
            <Text style={fStyles.headerTitle}>Search by status</Text>
          </View>
          <TouchableOpacity style={fStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={fStyles.closeBtnText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={fStyles.options}>
          {FILTER_OPTIONS.map(opt => {
            const on = selected === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[fStyles.option, on && fStyles.optionActive]}
                onPress={() => setSelected(opt.id)}
                activeOpacity={0.8}
              >
                <View style={[fStyles.optionDot, { backgroundColor: opt.bg }]}>
                  <View style={[fStyles.optionDotInner, { backgroundColor: opt.color }]} />
                </View>
                <Text style={[fStyles.optionLabel, on && fStyles.optionLabelActive]}>
                  {opt.label}
                </Text>
                <View style={[fStyles.optionBadge, { backgroundColor: on ? opt.bg : T.surface2 }]}>
                  <Text style={[fStyles.optionCount, { color: on ? opt.color : T.muted }]}>
                    {counts[opt.id]}
                  </Text>
                </View>
                {on && <View style={fStyles.checkMark}><Text style={fStyles.checkMarkText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={fStyles.searchBtn}
          onPress={() => onApply(selected)}
          activeOpacity={0.85}
        >
          <Text style={fStyles.searchBtnText}>Search</Text>
          <View style={fStyles.searchBtnBadge}>
            <Text style={fStyles.searchBtnBadgeText}>{counts[selected]}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  section: { marginBottom: 12 },

  sectionHeading: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  updatedAt: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: T.faint,
    letterSpacing: 0.4,
  },

  list:      { paddingHorizontal: 14, paddingBottom: 120 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: Fonts.sans, fontSize: 14, color: T.muted },

  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: T.accentBg, borderColor: T.accent },
  iconBtnText: { fontSize: 18, color: T.ink },
  iconBtnTextActive: { color: T.accent },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 10, gap: 8,
  },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.accent,
    borderRadius: 12, paddingHorizontal: 12, height: 42,
  },
  searchIcon: { fontSize: 17, color: T.accent },
  searchInput: {
    flex: 1, fontFamily: Fonts.sans, fontSize: 14,
    color: T.ink, fontWeight: '500',
  },
  searchCancelBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  searchCancelText: {
    fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600', color: T.accent,
  },

  toast: {
    position: 'absolute',
    left: 14, right: 14, top: 108, zIndex: 30,
    backgroundColor: T.ink, borderRadius: 14,
    padding: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28, shadowRadius: 28, elevation: 12,
  },
  toastContent: { flex: 1 },
  toastTitle: {
    fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600',
    color: T.bg, letterSpacing: -0.1,
  },
  toastSub: {
    fontFamily: Fonts.sans, fontSize: 11,
    color: 'rgba(250,248,245,0.65)', marginTop: 1,
  },
  toastTime: {
    fontFamily: Fonts.mono, fontSize: 10,
    color: 'rgba(250,248,245,0.5)',
  },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 18,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 22,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyIconBorder: {
    position: 'absolute',
    top: 18, bottom: 18, left: 18, right: 18,
    borderWidth: 1.5, borderColor: T.borderStrong,
    borderRadius: 14, borderStyle: 'dashed',
  },
  emptyIconCenter: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: T.accentBg, borderWidth: 1.5, borderColor: T.accent,
  },
  emptyText:  { alignItems: 'center', gap: 6 },
  emptyTitle: {
    fontFamily: Fonts.sans, fontSize: 22, fontWeight: '700',
    color: T.ink, letterSpacing: -0.5,
  },
  emptyBody: {
    fontFamily: Fonts.sans, fontSize: 14, color: T.ink2,
    lineHeight: 20, textAlign: 'center', maxWidth: 280,
  },
  wsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, backgroundColor: T.surface,
    borderWidth: 1, borderColor: T.border,
  },
  wsChipText: {
    fontFamily: Fonts.mono, fontSize: 10,
    color: T.muted, letterSpacing: 0.5,
  },
  createBtn: {
    marginTop: 10, height: 48, paddingHorizontal: 22,
    borderRadius: 24, backgroundColor: T.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
  },
  createBtnText: {
    fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600', color: '#fff',
  },
});

const fStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,22,20,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: T.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 16,
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: T.borderStrong,
    alignSelf: 'center', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  headerMeta: {
    fontFamily: Fonts.mono, fontSize: 10,
    color: T.muted, letterSpacing: 0.6,
  },
  headerTitle: {
    fontFamily: Fonts.sans, fontSize: 20, fontWeight: '700',
    color: T.ink, letterSpacing: -0.4, marginTop: 2,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: T.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 20, color: T.ink2, lineHeight: 28 },

  options: { gap: 8, marginBottom: 20 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14,
  },
  optionActive: { borderColor: T.ink, backgroundColor: T.surface },
  optionDot: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  optionDotInner: { width: 12, height: 12, borderRadius: 6 },
  optionLabel: {
    flex: 1, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600',
    color: T.ink2,
  },
  optionLabelActive: { color: T.ink },
  optionBadge: {
    paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionCount: { fontFamily: Fonts.mono, fontSize: 11, fontWeight: '600' },
  checkMark: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: T.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMarkText: { fontSize: 11, color: T.bg, lineHeight: 16 },

  searchBtn: {
    height: 52, borderRadius: 26,
    backgroundColor: T.accent,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    shadowColor: T.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 16, elevation: 6,
  },
  searchBtnText: {
    fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700', color: '#fff',
    letterSpacing: 0.1,
  },
  searchBtnBadge: {
    paddingVertical: 3, paddingHorizontal: 9,
    borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchBtnBadgeText: {
    fontFamily: Fonts.mono, fontSize: 12, color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
});
