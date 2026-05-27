import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { T } from '@/constants/theme';

interface PinIconProps { size?: number; color?: string }

export function PinIcon({ size = 14, color = T.faint }: PinIconProps) {
  const h = size * 1.2;
  return (
    <Svg width={size} height={h} viewBox="0 0 12 14">
      <Path
        d="M6 1C3.5 1 1.5 3 1.5 5.5C1.5 8.5 6 13 6 13S10.5 8.5 10.5 5.5C10.5 3 8.5 1 6 1Z"
        stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"
      />
      <Circle cx="6" cy="5.5" r="1.6" fill={color} />
    </Svg>
  );
}

interface PlusIconProps { size?: number; color?: string }

export function PlusIcon({ size = 14, color = '#fff' }: PlusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Path
        d="M7 2v10M2 7h10"
        stroke={color} strokeWidth="2" strokeLinecap="round"
      />
    </Svg>
  );
}

type Dir = 'right' | 'left' | 'down' | 'up';

interface ChevIconProps { size?: number; color?: string; dir?: Dir }

export function ChevIcon({ size = 14, color = T.muted, dir = 'right' }: ChevIconProps) {
  const paths: Record<Dir, string> = {
    right: 'M5 3l5 5-5 5',
    left:  'M9 3l-5 5 5 5',
    down:  'M3 5l5 5 5-5',
    up:    'M3 9l5-5 5 5',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Path
        d={paths[dir]}
        stroke={color} strokeWidth="1.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

interface WifiIconProps { size?: number; color?: string }

export function WifiIcon({ size = 12, color = T.delivered }: WifiIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Circle cx="6" cy="9" r="1" fill={color} />
      <Path
        d="M3 6.5C4 5.5 5.5 5 6 5C6.5 5 8 5.5 9 6.5"
        stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"
      />
      <Path
        d="M1.5 4C3 2.5 5 2 6 2C7 2 9 2.5 10.5 4"
        stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"
      />
    </Svg>
  );
}
