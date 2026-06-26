import React, { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import i18n from 'i18n';
import type { NetworkCase } from '../data/types';
import { caseDate, caseStatus, outcomeLabelKey, outcomeTone } from '../data/format';
import { colors } from './theme';

const MENU_WIDTH = 220;
/** Approx. menu height for 3 items (each ~44px) plus padding. */
const MENU_MAX_HEIGHT = 160;
const SCREEN_MARGIN = 12;

interface Props {
  item: NetworkCase;
  busy: boolean;
  onToggleStatus: () => void;
  onComment: () => void;
  onOpen?: () => void;
}

const TONE_BG: Record<string, string> = {
  warning: colors.amberSoft,
  danger: colors.redSoft,
  info: colors.brandSoft,
  neutral: colors.neutralSoft,
};
const TONE_FG: Record<string, string> = {
  warning: colors.amber,
  danger: colors.red,
  info: colors.brandText,
  neutral: colors.textDim,
};

export function CaseCard({ item, busy, onToggleStatus, onComment, onOpen }: Props): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<View>(null);
  const status = caseStatus(item);
  const resolved = status === 'resolvido';
  const t = outcomeTone(item.outcome);
  const label = outcomeLabelKey(item.outcome);
  const close = () => setMenuOpen(false);

  const openMenu = () => {
    const node = btnRef.current;
    if (!node) {
      setMenuPos(null);
      setMenuOpen(true);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      const screen = Dimensions.get('window');
      // Horizontal: align menu's right edge with the button's right edge.
      let left = x + width - MENU_WIDTH;
      left = Math.max(SCREEN_MARGIN, Math.min(left, screen.width - MENU_WIDTH - SCREEN_MARGIN));
      // Vertical: open below the button, but flip above when not enough room.
      const spaceBelow = screen.height - (y + height);
      const openUp = spaceBelow < MENU_MAX_HEIGHT + SCREEN_MARGIN;
      const top = openUp ? y - MENU_MAX_HEIGHT - 6 : y + height + 6;
      setMenuPos({ top: Math.max(SCREEN_MARGIN, top), left });
      setMenuOpen(true);
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <Text style={styles.name}>
            {item.cliente_nome || i18n.t('NETWORK_DIAGNOSTICS.ANONYMOUS')}
          </Text>
          {item.churn_risk && (
            <Text style={styles.churn}>⚠ {i18n.t('NETWORK_DIAGNOSTICS.CHURN_RISK')}</Text>
          )}
          <Text style={[styles.outcome, { backgroundColor: TONE_BG[t], color: TONE_FG[t] }]}>
            {label.startsWith('NETWORK_DIAGNOSTICS.') ? i18n.t(label) : label}
          </Text>
        </View>
        <Pressable
          ref={btnRef}
          style={styles.menuBtn}
          onPress={openMenu}
          accessibilityLabel="Ações">
          <Text style={styles.menuGlyph}>⋯</Text>
        </Pressable>
      </View>

      <Text style={styles.reason}>{item.connection_issue_reason || '—'}</Text>

      <View style={styles.footer}>
        <Text style={styles.date}>{caseDate(item)}</Text>
        <View style={styles.footerRight}>
          {!!item.comentario && <Text style={styles.commentDot}>💬</Text>}
          <Text
            style={[styles.statusBadge, resolved ? styles.statusResolved : styles.statusPending]}>
            {resolved
              ? i18n.t('NETWORK_DIAGNOSTICS.STATUS_RESOLVED')
              : i18n.t('NETWORK_DIAGNOSTICS.STATUS_PENDING')}
          </Text>
        </View>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={close}>
          <View
            style={[
              styles.menu,
              menuPos
                ? { top: menuPos.top, left: menuPos.left }
                : { top: '40%', alignSelf: 'center' },
            ]}>
            <MenuItem
              color={colors.green}
              glyph={resolved ? '↺' : '✓'}
              label={
                resolved
                  ? i18n.t('NETWORK_DIAGNOSTICS.MENU_REOPEN')
                  : i18n.t('NETWORK_DIAGNOSTICS.MENU_RESOLVE')
              }
              disabled={busy}
              onPress={() => {
                close();
                onToggleStatus();
              }}
            />
            <MenuItem
              color={colors.text}
              glyph="💬"
              label={i18n.t('NETWORK_DIAGNOSTICS.MENU_COMMENT')}
              disabled={busy}
              onPress={() => {
                close();
                onComment();
              }}
            />
            {onOpen && (
              <MenuItem
                color={colors.text}
                glyph="↗"
                label={i18n.t('NETWORK_DIAGNOSTICS.MENU_OPEN')}
                disabled={false}
                onPress={() => {
                  close();
                  onOpen();
                }}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({
  color,
  glyph,
  label,
  disabled,
  onPress,
}: {
  color: string;
  glyph: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable style={styles.menuItem} onPress={onPress} disabled={disabled}>
      <Text style={[styles.menuItemGlyph, { color }]}>{glyph}</Text>
      <Text style={[styles.menuItemLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
    gap: 11,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  identity: { flex: 1, gap: 9, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 19 },
  churn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.redSoft,
    color: colors.red,
    fontSize: 10,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
    overflow: 'hidden',
  },
  outcome: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 7,
    overflow: 'hidden',
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.neutralSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGlyph: { color: colors.textDim, fontSize: 18, lineHeight: 18 },
  reason: { fontSize: 12.5, lineHeight: 18, color: colors.textDim },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingTop: 3,
  },
  date: { fontSize: 11.5, color: colors.textMuted },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentDot: { fontSize: 11 },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusPending: { backgroundColor: colors.amberSoft, color: colors.amber },
  statusResolved: { backgroundColor: colors.greenSoft, color: colors.green },
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: colors.menu,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemGlyph: { width: 18, textAlign: 'center', fontSize: 14 },
  menuItemLabel: { fontSize: 13.5, fontWeight: '500' },
});
