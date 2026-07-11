import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import i18n from 'i18n';
import type { NetworkStats } from '../data/types';
import { formatBRL } from '../data/format';
import { colors } from './theme';

interface Props {
  stats: NetworkStats | null;
  loading: boolean;
}

/** Hero card on the Summary tab: total monthly revenue recovered from churn-risk
 * cases that were resolved in the selected period (`stats.receita_protegida`). */
export function ProtectedRevenueCard({ stats, loading }: Props): JSX.Element {
  const showValue = !loading && stats != null;
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{i18n.t('NETWORK_DIAGNOSTICS.PROTECTED_TITLE')}</Text>
      <Text style={styles.value}>{showValue ? formatBRL(stats?.receita_protegida) : '—'}</Text>
      <Text style={styles.subtitle}>{i18n.t('NETWORK_DIAGNOSTICS.PROTECTED_SUBTITLE')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginHorizontal: 20,
    marginTop: 18,
    gap: 6,
  },
  eyebrow: { fontSize: 11, letterSpacing: 1, color: colors.green, fontWeight: '700' },
  value: { fontSize: 32, fontWeight: '800', color: colors.green },
  subtitle: { fontSize: 12, color: colors.textDim, lineHeight: 17 },
});
