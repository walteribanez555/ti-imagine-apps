import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { T } from '@/constants/theme';

interface StylizedMapProps {
  height?: number;
  progress?: number;
}

export function StylizedMap({ height = 240, progress = 0.55 }: StylizedMapProps) {
  const routePath =
    'M 60 250 L 60 200 L 120 200 L 120 160 L 200 160 L 200 120 L 280 120 L 280 80 L 340 80';
  const totalLen = 800;
  const completed = totalLen * progress;

  const driverX = 60 + (280 - 60) * progress;
  const driverY = 250 - (250 - 80) * progress;

  return (
    <View style={[styles.container, { height }]}>
      <Svg
        viewBox="0 0 400 320"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Rect x="60" y="40" width="80" height="60" fill="#E1EBD9" />
        <Rect x="240" y="200" width="100" height="80" fill="#E1EBD9" />
        <Rect x="320" y="240" width="80" height="80" fill="#D9E5EE" />

        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <Line key={`h${i}`} x1="0" y1={i * 40} x2="400" y2={i * 40}
            stroke={T.border} strokeWidth="1" />
        ))}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <Line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="320"
            stroke={T.border} strokeWidth="1" />
        ))}

        <Line x1="0" y1="120" x2="400" y2="120" stroke={T.borderStrong} strokeWidth="3" />
        <Line x1="200" y1="0" x2="200" y2="320" stroke={T.borderStrong} strokeWidth="3" />
        <Line x1="0" y1="240" x2="400" y2="240" stroke={T.borderStrong} strokeWidth="2" />

        <Path
          d={routePath}
          stroke={T.borderStrong}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${totalLen}`}
          strokeDashoffset="0"
        />
        <Path
          d={routePath}
          stroke={T.accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${totalLen}`}
          strokeDashoffset={`${totalLen - completed}`}
        />

        <G transform="translate(60,250)">
          <Circle r="9" fill="#fff" stroke={T.ink} strokeWidth="2" />
          <Circle r="3.5" fill={T.ink} />
        </G>

        <G transform="translate(340,80)">
          <Circle r="11" fill={T.accent} />
          <Circle r="4" fill="#fff" />
        </G>

        <G transform={`translate(${driverX},${driverY})`}>
          <Circle r="14" fill={T.accent} fillOpacity="0.15" />
          <Circle r="7" fill="#fff" stroke={T.accent} strokeWidth="3" />
          <Circle r="2.5" fill={T.accent} />
        </G>
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.ink }]} />
          <SvgText fill={T.ink2} fontSize="9" fontWeight="600">ORIGIN</SvgText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.accent }]} />
          <SvgText fill={T.ink2} fontSize="9" fontWeight="600">DEST</SvgText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F4F0E9',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E3DC',
    position: 'relative',
  },
  legend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
});
