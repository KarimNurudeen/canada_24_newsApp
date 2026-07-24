import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius } from '../theme';
import { ENABLE_MANAGE_REGIONS } from '../config/features';
import ArticleRow from '../components/ArticleRow';
import { useApp } from '../context/AppContext';
import { searchArticles } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TRENDING_GROUPS = [
  { label: 'News', items: ['Politics', 'World', 'Indigenous'] },
  { label: 'Life & Society', items: ['Business', 'Health', 'Education in Canada', 'Events'] },
  { label: 'Tech, Auto & Aviation', items: ['Technology', 'Auto News', 'Aviation'] },
  { label: 'Immigration & Opportunities', items: ['Immigration', 'Opportunities'] },
  { label: 'Culture & Community', items: ['Sports', 'Entertainment', 'Blacks in Canada'] },
];

export default function ExploreScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, availableRegions, selectedRegions, toggleRegion } = useApp();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const visibleGroups = showAllGroups ? TRENDING_GROUPS : TRENDING_GROUPS.slice(0, 2);

  const regionSet = useMemo(() => new Set(selectedRegions), [selectedRegions]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Trending</Text>
          {visibleGroups.map(group => (
            <View key={group.label} style={styles.groupRow}>
              <Text style={[styles.groupLabel, { color: colors.secondaryText }]}>{group.label}</Text>
              <View style={styles.chipWrap}>
                {group.items.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, { borderColor: colors.divider }]}
                    onPress={() => navigation.navigate('SectionDetail', { section: item })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: colors.primaryText }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          {!showAllGroups && (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllGroups(true)}>
              <Text style={[styles.showMoreText, { color: colors.primary }]}>Show more</Text>
              <MaterialIcons name="expand-more" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}

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
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
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
