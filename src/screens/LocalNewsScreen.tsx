import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Pressable,
  StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ArticleRow from '../components/ArticleRow';
import { useApp } from '../context/AppContext';
import { fetchTopStories, fetchRegions, fetchRegionArticles, slugifyValue } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type LocalNewsRouteProp = RouteProp<RootStackParamList, 'LocalNews'>;
type SortMode = 'recent' | 'oldest' | 'popular';
type Tab = { slug: string; name: string };

const ALL_CANADA: Tab = { slug: 'all', name: 'All Canada' };

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'recent', label: 'Most Recent' },
  { mode: 'oldest', label: 'Oldest First' },
  { mode: 'popular', label: 'Most Popular' },
];

function engagement(a: Article): number {
  return (a.likesCount ?? 0) + (a.commentsCount ?? 0) + (a.repostsCount ?? 0) + (a.savesCount ?? 0);
}

function time(a: Article): number {
  return new Date(a.publishedAt ?? 0).getTime();
}

/** "Across Canada": national news plus one tab per region that currently has
 * news. A region tab appears as soon as stories tagged to it exist. */
export default function LocalNewsScreen() {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LocalNewsRouteProp>();
  const insets = useSafeAreaInsets();

  const [tabs, setTabs] = useState<Tab[]>([ALL_CANADA]);
  const [byTab, setByTab] = useState<Record<string, Article[]>>({});
  const [activeSlug, setActiveSlug] = useState(ALL_CANADA.slug);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [national, regions] = await Promise.all([fetchTopStories(), fetchRegions()]);
      const results = await Promise.all(
        regions.map(async region => [region, await fetchRegionArticles(region.slug)] as const),
      );
      if (cancelled) return;
      const withNews = results.filter(([, list]) => list.length > 0);
      setTabs([ALL_CANADA, ...withNews.map(([r]) => ({ slug: r.slug, name: r.name }))]);
      setByTab({
        [ALL_CANADA.slug]: national,
        ...Object.fromEntries(withNews.map(([r, list]) => [r.slug, list])),
      });
      // Open on the region the user came from, if it has news.
      const requested = route.params?.region ? slugifyValue(route.params.region) : null;
      if (requested && withNews.some(([r]) => r.slug === requested)) setActiveSlug(requested);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [route.params?.region]);

  const activeName = tabs.find(t => t.slug === activeSlug)?.name ?? ALL_CANADA.name;

  const sorted = useMemo(() => {
    const list = [...(byTab[activeSlug] ?? [])];
    return list.sort((a, b) => {
      if (sortMode === 'oldest') return time(a) - time(b);
      if (sortMode === 'popular') return engagement(b) - engagement(a) || time(b) - time(a);
      return time(b) - time(a);
    });
  }, [byTab, activeSlug, sortMode]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[styles.backHeader, { paddingTop: insets.top + 8, backgroundColor: colors.chrome }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.backHeaderTitle, { color: colors.primaryText }]}>Across Canada</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Region tabs — only regions that have news */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, backgroundColor: colors.primary }}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {tabs.map(tab => {
          const isActive = tab.slug === activeSlug;
          return (
            <TouchableOpacity
              key={tab.slug}
              onPress={() => setActiveSlug(tab.slug)}
              style={[styles.cityTab, { borderBottomColor: isActive ? '#fff' : 'transparent' }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.cityTabText, { color: isActive ? '#fff' : 'rgba(255,255,255,0.65)' }]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filter menu */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => setFilterOpen(true)}
          style={[styles.filterBtn, { borderColor: colors.divider }]}
          accessibilityLabel="Filter stories"
          activeOpacity={0.8}
        >
          <MaterialIcons name="filter-list" size={18} color={colors.primary} />
          <Text style={[styles.filterText, { color: colors.primaryText }]}>
            {SORT_OPTIONS.find(o => o.mode === sortMode)?.label}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primaryText }]}>Loading news...</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ListEmptyComponent={
            <Text style={[styles.loadingText, { color: colors.primaryText, textAlign: 'center', paddingTop: 48 }]}>
              No news available for {activeName} right now.
            </Text>
          }
          renderItem={({ item }) => <ArticleRow article={item} />}
        />
      )}

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]}>
            {SORT_OPTIONS.map(option => {
              const active = option.mode === sortMode;
              return (
                <TouchableOpacity
                  key={option.mode}
                  onPress={() => { setSortMode(option.mode); setFilterOpen(false); }}
                  style={[styles.option, { borderBottomColor: colors.divider }]}
                >
                  <Text style={[styles.optionText, { color: active ? colors.primary : colors.primaryText }, active && { fontWeight: '800' }]}>
                    {option.label}
                  </Text>
                  {active ? <MaterialIcons name="check" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backHeaderTitle: { fontSize: 17, fontWeight: '700' },
  cityTab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 3 },
  cityTabText: { fontSize: 13, fontWeight: '900' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  filterText: { fontSize: 13, fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, fontWeight: '600', opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 16, fontWeight: '600' },
});
