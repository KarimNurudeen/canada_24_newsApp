import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.primaryText, borderBottomColor: colors.divider }]}>
        {title}
      </Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return <Text style={[styles.paragraph, { color: colors.secondaryText }]}>{children}</Text>;
}

export function LegalBullet({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: colors.secondaryText }]}>{'•'}</Text>
      <Text style={[styles.paragraph, { flex: 1, color: colors.secondaryText }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  paragraph: { fontSize: 14, lineHeight: 21 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { fontSize: 14, lineHeight: 21 },
});
