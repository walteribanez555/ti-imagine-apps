import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T, Fonts } from '@/constants/theme';
import { useOrders } from '@/hooks/use-orders';
import { PinIcon } from '@/components/ui/icons';

export default function CreateOrderModal() {
  const insets = useSafeAreaInsets();
  const { createOrder } = useOrders();

  const [customerName,    setCustomerName]    = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [errors,          setErrors]          = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!customerName.trim())    next.customerName    = 'Customer name is required';
    if (!deliveryAddress.trim()) next.deliveryAddress = 'Delivery address is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;

    try {
      setLoading(true);
      await createOrder({
        customerName:    customerName.trim(),
        deliveryAddress: deliveryAddress.trim(),
      });
      router.back();
    } catch (e: any) {
      setErrors({ submit: e?.message ?? 'Failed to create order' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.handle} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerMeta}>POST /orders</Text>
          <Text style={styles.headerTitle}>New delivery</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field
          label="Customer name"
          required
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="e.g. María García"
          error={errors.customerName}
          autoFocus
        />

        <Field
          label="Delivery address"
          required
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          placeholder="e.g. Insurgentes Sur 1234, CDMX"
          error={errors.deliveryAddress}
          helper={
            deliveryAddress.trim().length > 4
              ? 'Coordinates will be auto-simulated'
              : undefined
          }
          withPin
        />

        <View>
          <FieldLabel label="Pickup origin" />
          <View style={styles.pickupRow}>
            <View style={styles.pickupIcon}>
              <PinIcon size={14} color={T.accent} />
            </View>
            <View style={styles.pickupText}>
              <Text style={styles.pickupName}>Warehouse · Bodega Norte</Text>
              <Text style={styles.pickupCoords}>4.6762, −74.0489</Text>
            </View>
          </View>
        </View>

        {errors.submit != null && (
          <Text style={styles.submitError}>{errors.submit}</Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnLoading]}
          onPress={handleCreate}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.createBtnText}>Create order</Text>
              <View style={styles.createBtnBadge}>
                <Text style={styles.createBtnBadgeText}>⏎</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {required && <Text style={styles.fieldRequired}>REQUIRED</Text>}
    </View>
  );
}

interface FieldProps {
  label:         string;
  required?:     boolean;
  value:         string;
  onChangeText?: (v: string) => void;
  placeholder?:  string;
  helper?:       string;
  error?:        string;
  withPin?:      boolean;
  autoFocus?:    boolean;
}

function Field({
  label, required, value, onChangeText,
  placeholder, helper, error, withPin, autoFocus,
}: FieldProps) {
  const focused = value.length > 0;

  return (
    <View style={styles.fieldWrapper}>
      <FieldLabel label={label} required={required} />
      <View
        style={[
          styles.fieldInput,
          focused && styles.fieldInputFocused,
          error != null && styles.fieldInputError,
        ]}
      >
        {withPin && <PinIcon size={14} color={T.accent} />}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.faint}
          autoFocus={autoFocus}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>
      {helper != null && <Text style={styles.fieldHelper}>{helper}</Text>}
      {error  != null && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
    paddingTop: 12,
    paddingHorizontal: 18,
  },

  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: T.borderStrong,
    alignSelf: 'center', marginBottom: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10, color: T.muted, letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: Fonts.sans,
    fontSize: 22, fontWeight: '700',
    color: T.ink, letterSpacing: -0.5, marginTop: 2,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: T.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 20, color: T.ink2, lineHeight: 28 },

  form: { flex: 1 },
  formContent: { gap: 14, paddingTop: 14, paddingBottom: 20 },

  fieldWrapper: { gap: 0 },
  fieldLabelRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: Fonts.sans,
    fontSize: 11, fontWeight: '600',
    color: T.ink2, letterSpacing: 0.3, textTransform: 'uppercase',
  },
  fieldRequired: {
    fontFamily: Fonts.mono,
    fontSize: 9, color: T.accent, letterSpacing: 0.4,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldInputFocused: { borderColor: T.accent },
  fieldInputError:   { borderColor: T.live },
  input: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: T.ink,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  fieldHelper: {
    fontFamily: Fonts.mono,
    fontSize: 10, color: T.muted,
    marginTop: 6, paddingLeft: 2, letterSpacing: 0.3,
  },
  fieldError: {
    fontFamily: Fonts.sans,
    fontSize: 11, color: T.live,
    marginTop: 4, paddingLeft: 2,
  },
  submitError: {
    fontFamily: Fonts.sans,
    fontSize: 13, color: T.live,
    textAlign: 'center', marginTop: 8,
  },

  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.surface,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 12, padding: 10,
  },
  pickupIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: T.accentBg,
    alignItems: 'center', justifyContent: 'center',
  },
  pickupText:   { flex: 1 },
  pickupName:   { fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600', color: T.ink },
  pickupCoords: { fontFamily: Fonts.mono, fontSize: 10.5, color: T.muted, marginTop: 1 },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 24,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600', color: T.ink,
  },
  createBtn: {
    flex: 2, height: 48, borderRadius: 24,
    backgroundColor: T.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: T.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 16, elevation: 6,
  },
  createBtnLoading: { opacity: 0.7 },
  createBtnText: {
    fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600', color: '#fff',
  },
  createBtnBadge: {
    paddingVertical: 2, paddingHorizontal: 6,
    borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)',
  },
  createBtnBadgeText: {
    fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.85)',
  },
});
