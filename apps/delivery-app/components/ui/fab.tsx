import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { T, Fonts } from '@/constants/theme';
import { PlusIcon } from './icons';

interface FabProps {
  label?: string;
  onPress?: () => void;
}

export function Fab({ label = 'New order', onPress }: FabProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <PlusIcon size={16} color="#fff" />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 18,
    height: 52,
    paddingHorizontal: 20,
    paddingLeft: 16,
    borderRadius: 26,
    backgroundColor: T.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 20,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.1,
  },
});
