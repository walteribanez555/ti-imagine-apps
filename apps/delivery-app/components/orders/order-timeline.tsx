import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { T, Fonts } from '@/constants/theme';
import { PulseDot } from '@/components/ui/pulse-dot';
import { OrderStatus } from '@/types/order';

type StepState = 'done' | 'active' | 'pending';

interface TimelineStep {
  label:   string;
  time?:   string;
  state:   StepState;
  detail?: string;
}

export function buildSteps(status: OrderStatus, createdAt: string): TimelineStep[] {
  const createdTime = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  const steps: TimelineStep[] = [
    {
      label: 'Order created',
      time:  createdTime,
      state: 'done',
    },
    {
      label:  'Picked up by driver',
      state:  status === OrderStatus.PENDING ? 'pending' : 'done',
    },
    {
      label:  'In transit',
      state:  status === OrderStatus.IN_TRANSIT
                ? 'active'
                : status === OrderStatus.DELIVERED
                  ? 'done'
                  : 'pending',
      detail: status === OrderStatus.IN_TRANSIT
        ? 'WebSocket event · order:status_updated'
        : undefined,
    },
    {
      label: 'Delivered',
      state: status === OrderStatus.DELIVERED ? 'done' : 'pending',
    },
  ];

  return steps;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <View>
      {steps.map((step, i) => (
        <TimelineRow key={i} step={step} isLast={i === steps.length - 1} />
      ))}
    </View>
  );
}

function TimelineRow({
  step, isLast,
}: { step: TimelineStep; isLast: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <TimelineDot state={step.state} />
        {!isLast && (
          <View
            style={[
              styles.connector,
              { backgroundColor: step.state === 'pending' ? T.border : T.borderStrong },
            ]}
          />
        )}
      </View>

      <View style={[styles.content, !isLast && { paddingBottom: 14 }]}>
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              {
                fontWeight: step.state === 'active' ? '700' : '600',
                color: step.state === 'pending' ? T.muted : T.ink,
              },
            ]}
          >
            {step.label}
          </Text>
          {step.time != null && (
            <Text style={styles.time}>{step.time}</Text>
          )}
        </View>
        {step.detail != null && (
          <Text style={styles.detail}>{step.detail}</Text>
        )}
      </View>
    </View>
  );
}

function TimelineDot({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <View style={styles.dotDone}>
        <Svg width={9} height={9} viewBox="0 0 9 9">
          <Path
            d="M1.5 4.5l2 2 4-4"
            stroke="#fff" strokeWidth="1.8" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  }
  if (state === 'active') {
    return (
      <View style={styles.dotActive}>
        <PulseDot color={T.accent} size={6} />
      </View>
    );
  }
  return <View style={styles.dotPending} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rail: {
    alignItems: 'center',
    paddingTop: 2,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 22,
    marginTop: 2,
  },
  content: { flex: 1, paddingBottom: 4 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: T.ink,
    letterSpacing: -0.2,
  },
  time: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: T.muted,
    letterSpacing: 0.3,
  },
  detail: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    color: T.accent,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  dotDone: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: T.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: T.accentBg,
    borderWidth: 2, borderColor: T.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  dotPending: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: T.bg,
    borderWidth: 1.5, borderColor: T.borderStrong,
    borderStyle: 'dashed',
  },
});
