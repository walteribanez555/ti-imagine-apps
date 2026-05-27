import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { T, Fonts } from '@/constants/theme';
import { OrderStatus } from '@/types/order';

export type FilterKey = 'all' | OrderStatus;

interface Chip {
  id:    FilterKey;
  label: string;
}

const CHIPS: Chip[] = [
  { id: 'all'                   as FilterKey, label: 'All'        },
  { id: OrderStatus.PENDING     as FilterKey, label: 'Pending'    },
  { id: OrderStatus.IN_TRANSIT  as FilterKey, label: 'In transit' },
  { id: OrderStatus.DELIVERED   as FilterKey, label: 'Delivered'  },
];

interface FilterChipsProps {
  active:   FilterKey;
  counts:   Record<FilterKey, number>;
  onChange: (key: FilterKey) => void;
}

export function FilterChips({ active, counts, onChange }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CHIPS.map(chip => {
        const on = chip.id === active;
        return (
          <TouchableOpacity
            key={chip.id}
            style={[
              styles.chip,
              { borderColor: on ? T.ink : T.border, backgroundColor: on ? T.ink : T.surface },
            ]}
            onPress={() => onChange(chip.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipLabel, { color: on ? T.bg : T.ink2 }]}>
              {chip.label}
            </Text>
            <Text
              style={[
                styles.chipCount,
                {
                  backgroundColor: on ? 'rgba(255,255,255,0.15)' : T.surface2,
                  color: on ? T.bg : T.muted,
                },
              ]}
            >
              {counts[chip.id]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    gap: 6,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  chipCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
