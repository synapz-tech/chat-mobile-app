import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import i18n from 'i18n';
import type { NetworkStats } from '../data/types';
import { zeroFillByDay, formatBRL } from '../data/format';
import { colors } from './theme';

interface Props {
  stats: NetworkStats | null;
  from: string;
  to: string;
}

const CHART_HEIGHT = 140;
const SECTIONS = 4;
// gifted-charts renders the y-axis labels to the *left* of the passed `width`, so
// the chart's real footprint is `width + yAxisLabelWidth`. Subtract it from the
// measured container width so the chart doesn't overflow on the right. BRL labels
// (`R$ 105`) are wider than the library default (35), so reserve a bit more.
const Y_AXIS_LABEL_WIDTH = 48;

/** `YYYY-MM-DD` -> `DD/MM`. */
function dayLabel(date: string): string {
  const [, m, d] = date.split('-');
  return d && m ? `${d}/${m}` : date;
}

/** Show at most ~6 x-axis labels to avoid crowding on long ranges. */
function labelStep(n: number): number {
  return Math.max(1, Math.ceil(n / 6));
}

/** Short BRL for the y-axis (`R$ 70`, no cents). */
function shortBRL(value: number): string {
  return formatBRL(Math.round(value)).replace(/,\d{2}$/, '');
}

export function RevenueChart({ stats, from, to }: Props): JSX.Element {
  const [width, setWidth] = useState(0);
  const days = useMemo(() => zeroFillByDay(from, to, stats?.by_day), [from, to, stats?.by_day]);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const step = labelStep(days.length);
  const data = useMemo(
    () =>
      days.map((d, i) => ({
        value: d.valor_protegido ?? 0,
        label: i % step === 0 ? dayLabel(d.date) : '',
        dateLabel: dayLabel(d.date),
      })),
    [days, step],
  );

  const rawMax = Math.max(0, ...days.map(d => d.valor_protegido ?? 0));
  const maxValue = rawMax === 0 ? SECTIONS : Math.ceil(rawMax / SECTIONS) * SECTIONS;
  const yAxisLabelTexts = Array.from({ length: SECTIONS + 1 }, (_, i) =>
    shortBRL((maxValue / SECTIONS) * i),
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t('NETWORK_DIAGNOSTICS.REVENUE_TREND_TITLE')}</Text>
      <Text style={styles.subtitle}>{i18n.t('NETWORK_DIAGNOSTICS.REVENUE_TREND_SUBTITLE')}</Text>
      <View style={styles.chartWrap} onLayout={onLayout}>
        {width > 0 && (
          <LineChart
            data={data}
            width={Math.max(0, width - Y_AXIS_LABEL_WIDTH)}
            yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
            adjustToWidth
            height={CHART_HEIGHT}
            maxValue={maxValue}
            noOfSections={SECTIONS}
            yAxisLabelTexts={yAxisLabelTexts}
            initialSpacing={8}
            endSpacing={8}
            thickness={2}
            color={colors.green}
            areaChart
            startFillColor={colors.green}
            endFillColor={colors.green}
            startOpacity={0.22}
            endOpacity={0.02}
            dataPointsColor={colors.green}
            dataPointsRadius={3}
            yAxisThickness={0}
            xAxisColor={colors.border}
            rulesColor={colors.border}
            xAxisLabelTextStyle={styles.axisLabel}
            yAxisTextStyle={styles.axisLabel}
            isAnimated
            pointerConfig={{
              pointerColor: colors.green,
              pointerStripColor: colors.border,
              pointerStripHeight: CHART_HEIGHT,
              radius: 5,
              pointerLabelWidth: 130,
              pointerLabelHeight: 52,
              autoAdjustPointerLabelPosition: true,
              activatePointersOnLongPress: false,
              pointerLabelComponent: (items: { value?: number; dateLabel?: string }[]) => {
                const it = items?.[0];
                if (!it) return null;
                return (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipTitle}>{it.dateLabel}</Text>
                    <Text style={styles.tooltipValue}>{formatBRL(it.value)}</Text>
                  </View>
                );
              },
            }}
          />
        )}
      </View>
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
  chartWrap: { marginTop: 16 },
  axisLabel: { fontSize: 10, color: colors.eyebrow },
  tooltip: {
    backgroundColor: colors.menu,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 110,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tooltipTitle: { fontSize: 11, color: colors.textDim },
  tooltipValue: { fontSize: 14, fontWeight: '700', color: colors.green },
});
