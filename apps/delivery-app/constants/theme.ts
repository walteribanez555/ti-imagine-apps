import { Platform } from 'react-native';

export const T = {
  bg:           '#FAF8F5',
  surface:      '#FFFFFF',
  surface2:     '#F4F0E9',
  ink:          '#1A1614',
  ink2:         '#4A4541',
  muted:        '#8A847D',
  faint:        '#B8B1A8',
  border:       '#E8E3DC',
  borderStrong: '#D9D2C7',
  accent:       '#F25C05',
  accentInk:    '#7A2D02',
  accentBg:     '#FFE9D7',
  pending:      '#B46E00',
  pendingBg:    '#FFF1CC',
  transit:      '#F25C05',
  transitBg:    '#FFE0CC',
  delivered:    '#1F6F3A',
  deliveredBg:  '#D9ECDD',
  live:         '#E11D48',
} as const;

export const Fonts = {
  sans: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' })!,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })!,
};

export const Colors = {
  light: {
    text: T.ink,
    background: T.bg,
    tint: T.accent,
    icon: T.muted,
    tabIconDefault: T.muted,
    tabIconSelected: T.accent,
  },
  dark: {
    text: T.bg,
    background: T.ink,
    tint: T.accent,
    icon: T.muted,
    tabIconDefault: T.muted,
    tabIconSelected: T.accent,
  },
};
