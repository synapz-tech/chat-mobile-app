import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import i18n from 'i18n';
import type { NetworkStats, NetworkDayBucket } from '../data/types';
import { zeroFillByDay } from '../data/format';
import { colors } from './theme';

interface Props {
  stats: NetworkStats | null;
  from: string;
  to: string;
}

// Day chips are fixed-width so the FlatList can compute layout and scroll a given
// day into view reliably.
const CHIP_WIDTH = 52;
const CHIP_GAP = 6;
const CHIP_STRIDE = CHIP_WIDTH + CHIP_GAP;
const PIE_RADIUS = 74;
const PIE_INNER_RADIUS = 50;
// Subtle ring shown for days with no cases (a real pie can't render from zeros).
const EMPTY_RING_COLOR = '#E8E8E8';

/** `YYYY-MM-DD` -> `DD/MM`. */
function dayLabel(date: string): string {
  const [, m, d] = date.split('-');
  return d && m ? `${d}/${m}` : date;
}

/** Locale-aware word for "cases" (derived from the `{count} casos` string). */
function casesWord(): string {
  return i18n.t('NETWORK_DIAGNOSTICS.CASES_COUNT').replace('{count}', '').trim();
}

export function TrendChart({ stats, from, to }: Props): JSX.Element {
  // Day shown in the donut/breakdown. Selecting via the date chips (a large tap
  // target) avoids needing to hit thin chart bars.
  const [selected, setSelected] = useState<number | null>(null);
  const chipsRef = useRef<FlatList<NetworkDayBucket>>(null);
  const days = useMemo(() => zeroFillByDay(from, to, stats?.by_day), [from, to, stats?.by_day]);

  // Default the breakdown to the most recent day so it isn't empty on first open.
  const activeIndex = Math.min(selected ?? days.length - 1, days.length - 1);
  const activeDay = days[activeIndex];

  const pieData = useMemo(() => {
    if (!activeDay || activeDay.total === 0) return [{ value: 1, color: EMPTY_RING_COLOR }];
    return [
      { value: activeDay.offline, color: colors.red },
      { value: activeDay.instaveis, color: colors.amber },
      { value: activeDay.conexao_observada, color: colors.green },
    ].filter(slice => slice.value > 0);
  }, [activeDay]);

  // Reset the selection when the date range changes (the old index may be out of range).
  useEffect(() => {
    setSelected(null);
  }, [from, to]);

  // Keep the selected day's chip centered/visible.
  useEffect(() => {
    if (days.length === 0) return;
    const id = requestAnimationFrame(() => {
      chipsRef.current?.scrollToIndex({ index: activeIndex, viewPosition: 0.5, animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [activeIndex, days.length]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t('NETWORK_DIAGNOSTICS.TREND_TITLE')}</Text>
      <Text style={styles.subtitle}>{i18n.t('NETWORK_DIAGNOSTICS.TREND_TAP_HINT')}</Text>
      <FlatList
        ref={chipsRef}
        data={days}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={d => d.date}
        style={styles.chips}
        contentContainerStyle={styles.chipsContent}
        getItemLayout={(_, index) => ({
          length: CHIP_STRIDE,
          offset: CHIP_STRIDE * index,
          index,
        })}
        onScrollToIndexFailed={info => {
          chipsRef.current?.scrollToOffset({ offset: CHIP_STRIDE * info.index, animated: true });
        }}
        renderItem={({ item, index }) => (
          <DayChip day={item} active={index === activeIndex} onPress={() => setSelected(index)} />
        )}
      />
      {activeDay && (
        <>
          <View style={styles.pieWrap}>
            <PieChart
              data={pieData}
              donut
              radius={PIE_RADIUS}
              innerRadius={PIE_INNER_RADIUS}
              innerCircleColor={colors.surface}
              centerLabelComponent={() => (
                <View style={styles.pieCenter}>
                  <Text style={styles.pieCenterValue}>{activeDay.total}</Text>
                  <Text style={styles.pieCenterLabel}>{casesWord()}</Text>
                </View>
              )}
            />
          </View>
          <Text style={styles.detailDate}>
            {dayLabel(activeDay.date)} ·{' '}
            {i18n.t('NETWORK_DIAGNOSTICS.CASES_COUNT').replace('{count}', String(activeDay.total))}
          </Text>
          <View style={styles.legend}>
            <LegendValue
              color={colors.red}
              label={i18n.t('NETWORK_DIAGNOSTICS.LEGEND_OFFLINE')}
              value={activeDay.offline}
            />
            <LegendValue
              color={colors.amber}
              label={i18n.t('NETWORK_DIAGNOSTICS.LEGEND_INSTAVEIS')}
              value={activeDay.instaveis}
            />
            <LegendValue
              color={colors.green}
              label={i18n.t('NETWORK_DIAGNOSTICS.LEGEND_CONEXAO')}
              value={activeDay.conexao_observada}
            />
          </View>
        </>
      )}
    </View>
  );
}

function DayChip({
  day,
  active,
  onPress,
}: {
  day: NetworkDayBucket;
  active: boolean;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipDate, active && styles.chipTextActive]}>{dayLabel(day.date)}</Text>
    </Pressable>
  );
}

function LegendValue({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}): JSX.Element {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 14,
  },
  title: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 11.5, color: colors.textDim, marginTop: 3 },
  chips: { marginTop: 14 },
  chipsContent: { paddingRight: 4 },
  chip: {
    width: CHIP_WIDTH,
    marginRight: CHIP_GAP,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.neutralSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brandBorder },
  chipDate: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.brandText },
  pieWrap: { alignItems: 'center', marginTop: 20 },
  pieCenter: { alignItems: 'center' },
  pieCenterValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  pieCenterLabel: { fontSize: 11, color: colors.textDim, marginTop: 1 },
  detailDate: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 18,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { fontSize: 11.5, color: colors.textDim },
  legendValue: { fontSize: 11.5, fontWeight: '700', color: colors.text },
});
