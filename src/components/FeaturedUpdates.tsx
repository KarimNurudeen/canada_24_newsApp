import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius } from '../theme';
import ArticleImage from './ArticleImage';
import { useApp } from '../context/AppContext';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

const FEATURED = [
  { label: 'Jobs & Money', color: '#E65100' },
  { label: 'Housing', color: '#00695C' },
  { label: 'Auto', color: '#37474F' },
] as const;

function shortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

/** "Featured Updates": the newest story from Jobs & Money, Housing and Auto as
 * three large cards (categories with no stories yet are dropped). */
export default function FeaturedUpdates({ categoryArticles }: { categoryArticles: Record<string, Article[]> }) {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const cards = FEATURED.map(f => ({ ...f, article: categoryArticles[f.label]?.[0] })).filter(c => c.article);
  if (cards.length === 0) return null;

  return (
    <View style={{ paddingTop: 26 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primaryText }]}>Featured Updates</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Explore')} style={styles.viewAll}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
          <MaterialIcons name="arrow-forward" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
        {cards.map(({ label, color, article }) => (
          <TouchableOpacity
            key={label}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('ArticleDetail', { article: article! })}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
          >
            <View style={[styles.image, { backgroundColor: color }]}>
              <ArticleImage uri={article!.imgUrl} style={StyleSheet.absoluteFill} />
              <View style={[styles.badge, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>{label.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.body}>
              <Text style={[styles.headline, { color: colors.primaryText }]} numberOfLines={3}>{article!.headline}</Text>
              <Text style={[styles.date, { color: colors.hint }]}>{shortDate(article!.publishedAt) || article!.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: '700' },
  card: { width: 270, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  image: { height: 150 },
  badge: { position: 'absolute', left: 10, top: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  body: { padding: 14 },
  headline: { fontSize: 16, fontWeight: '800', lineHeight: 21 },
  date: { fontSize: 12, fontWeight: '600', marginTop: 8 },
});
