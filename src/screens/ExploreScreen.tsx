import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius } from '../theme';
import { ENABLE_MANAGE_REGIONS } from '../config/features';
import { NAV_CATEGORIES } from '../config/nav';
import { fetchCategoryArticles } from '../services/newsService';
import ArticleRow from '../components/ArticleRow';
import { useApp } from '../context/AppContext';
import { searchArticles } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The same five-category navigation as the web app; topics open the section
// pre-filtered. Housing has no backend section yet, so it shows the empty state.
const TRENDING_GROUPS = NAV_CATEGORIES.map(c => ({ label: c.label, section: c.section, items: c.topics }));

export default function ExploreScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, availableRegions, selectedRegions, toggleRegion } = useApp();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [view, setView] = useState<'gallery' | 'list'>('gallery');
  const [thumbs, setThumbs] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    let cancelled = false;
    NAV_CATEGORIES.forEach(c => {
      fetchCategoryArticles(c.section).then(list => {
        const img = list.find(a => a.imgUrl)?.imgUrl;
        if (!cancelled && img) setThumbs(prev => ({ ...prev, [c.label]: img }));
      });
    });
    return () => { cancelled = true; };
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      setResults(await searchArticles(q));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 600);
  };

  const visibleGroups = TRENDING_GROUPS;

  const regionSet = useMemo(() => new Set(selectedRegions), [selectedRegions]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Search bar */}
      <View style={[styles.searchBar, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.searchPill, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="search" size={20} color={colors.hint} />
          <TextInput
            value={query}
            onChangeText={onChangeText}
            placeholder="Search any news"
            placeholderTextColor={colors.hint}
            style={[styles.searchInput, { color: colors.primaryText }]}
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <MaterialIcons name="close" size={18} color={colors.hint} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {searched ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : results.length === 0 ? (
            <View style={styles.centered}>
              <MaterialIcons name="search-off" size={48} color={colors.hint} />
              <Text style={[styles.noResults, { color: colors.primaryText }]}>No results for "{query}"</Text>
            </View>
          ) : (
            results.map(item => (
              <View key={item.id} style={[styles.rowDivider, { borderBottomColor: colors.divider }]}>
                <ArticleRow article={item} />
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={styles.exploreHead}>
            <Text style={[styles.sectionTitle, { color: colors.primaryText, padding: 0 }]}>EXPLORE CATEGORIES</Text>
            <View style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
              {(['list', 'gallery'] as const).map(mode => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setView(mode)}
                  accessibilityLabel={mode === 'list' ? 'List view' : 'Gallery view'}
                  style={[styles.toggleBtn, view === mode && { backgroundColor: colors.primary }]}
                >
                  <MaterialIcons name={mode === 'list' ? 'view-list' : 'grid-view'} size={18} color={view === mode ? '#fff' : colors.hint} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={view === 'gallery' ? styles.gallery : styles.listWrap}>
            {NAV_CATEGORIES.concat([{ label: 'Video', section: '__video', color: colors.primary, topics: [], description: '' }]).map(c => (
              <TouchableOpacity
                key={c.label}
                activeOpacity={0.88}
                onPress={() => (c.section === '__video' ? (navigation as any).navigate('Watch') : navigation.navigate('SectionDetail', { section: c.section }))}
                style={[view === 'gallery' ? styles.tile : styles.tileRow, { backgroundColor: '#0b1a3a' }]}
              >
                <View style={[view === 'gallery' ? styles.tileImage : styles.tileThumb, { backgroundColor: c.color }]}>
                  {thumbs[c.label] ? <Image source={{ uri: thumbs[c.label] }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
                </View>
                <View style={styles.tileFooter}>
                  <View style={styles.tileBody}>
                    <Text style={styles.tileTitle}>{c.label}</Text>
                    <Text style={styles.tileSub}>View stories</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Browse by topic</Text>
          {visibleGroups.map(group => (
            <View key={group.label} style={styles.groupRow}>
              <TouchableOpacity onPress={() => navigation.navigate('SectionDetail', { section: group.section })}>
                <Text style={[styles.groupLabel, { color: colors.secondaryText }]}>{group.label} ›</Text>
              </TouchableOpacity>
              <View style={styles.chipWrap}>
                {group.items.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, { borderColor: colors.divider }]}
                    onPress={() => navigation.navigate('SectionDetail', { section: group.section, topic: item })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: colors.primaryText }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Location</Text>
          <View style={{ paddingHorizontal: 20 }}>
            {availableRegions.map(region => {
              const isSelected = regionSet.has(region);
              return (
                <TouchableOpacity
                  key={region}
                  style={[styles.locationRow, { borderBottomColor: colors.divider }]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('LocalNews', { region })}
                >
                  <MaterialIcons name="location-on" size={20} color={colors.primary} />
                  <Text style={[styles.locationLabel, { color: colors.primaryText }]}>{region}</Text>
                  {ENABLE_MANAGE_REGIONS ? (
                    <TouchableOpacity
                      onPress={() => toggleRegion(region)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons
                        name={isSelected ? 'star' : 'star-border'}
                        size={20}
                        color={isSelected ? colors.primary : colors.hint}
                      />
                    </TouchableOpacity>
                  ) : (
                    <MaterialIcons name="arrow-forward-ios" size={14} color={colors.hint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { paddingHorizontal: 20, paddingBottom: 12 },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 48 },
  noResults: { fontSize: 15, fontWeight: '600' },
  rowDivider: {},
  exploreHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  toggle: { flexDirection: 'row', borderRadius: 999, padding: 3, borderWidth: StyleSheet.hairlineWidth },
  toggleBtn: { width: 34, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  listWrap: { gap: 10, paddingHorizontal: 20 },
  tile: { width: '47.5%', borderRadius: 14, overflow: 'hidden' },
  tileImage: { width: '100%', aspectRatio: 4 / 3 },
  tileRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, overflow: 'hidden', paddingRight: 12 },
  tileThumb: { width: 62, height: 62 },
  tileFooter: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  tileBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  tileTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  tileSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', marginTop: 2 },
  sectionTitle: { fontSize: 20, fontWeight: '800', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  groupRow: { paddingHorizontal: 20, marginBottom: 16 },
  groupLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 20, marginBottom: 8,
  },
  showMoreText: { fontSize: 13, fontWeight: '700' },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
