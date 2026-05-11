import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ArticleEngagementRow from '../components/ArticleEngagementRow';
import { useApp } from '../context/AppContext';
import { searchArticles } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TRENDING_TOPICS = [
  'Ukraine', 'Climate', 'Housing', 'Economy', 'Health',
  'Federal Budget', 'Alberta', 'Ontario',
];

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
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

  const onPressTopic = (topic: string) => {
    setQuery(topic);
    runSearch(topic);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.primary, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onChangeText}
          placeholder="Search Canada 24/7..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          style={[styles.input, { color: '#fff' }]}
          returnKeyType="search"
          onSubmitEditing={() => runSearch(query)}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <MaterialIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Trending topics */}
      {!searched && (
        <View style={styles.topicsSection}>
          <Text style={[styles.topicsTitle, { color: colors.primaryText }]}>TRENDING TOPICS</Text>
          <View style={styles.topicsWrap}>
            {TRENDING_TOPICS.map(topic => (
              <TouchableOpacity
                key={topic}
                style={[styles.topicChip, { borderColor: colors.primary }]}
                onPress={() => onPressTopic(topic)}
                activeOpacity={0.7}
              >
                <Text style={[styles.topicText, { color: colors.primary }]}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primaryText }]}>Searching...</Text>
        </View>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <View style={styles.centered}>
          <MaterialIcons name="search-off" size={56} color={colors.primaryText} style={{ opacity: 0.3 }} />
          <Text style={[styles.noResultTitle, { color: colors.primaryText }]}>No results for "{query}"</Text>
          <Text style={[styles.noResultSub, { color: colors.primaryText }]}>Try a different keyword or topic</Text>
        </View>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, i) => item.id + i}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: colors.primaryText }]}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.primaryText }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
            >
              {item.imgUrl ? (
                <Image source={{ uri: item.imgUrl }} style={styles.resultThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.resultThumb, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                  <MaterialIcons name="article" size={28} color="#fff" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                {item.category ? (
                  <Text style={[styles.resultCategory, { color: colors.primary }]}>{item.category}</Text>
                ) : null}
                <Text style={[styles.resultHeadline, { color: colors.primaryText }]} numberOfLines={3}>
                  {item.headline}
                </Text>
                <Text style={[styles.resultTime, { color: colors.primary }]}>{item.time}</Text>
                <ArticleEngagementRow article={item} style={styles.resultEngagement} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.4)',
  },
  topicsSection: { padding: 20 },
  topicsTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    letterSpacing: 1,
    marginBottom: 12,
  },
  topicsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topicText: { fontSize: 13, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  noResultTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  noResultSub: { fontSize: 13, fontWeight: '600', opacity: 0.6, textAlign: 'center' },
  resultCount: { fontSize: 13, fontWeight: '700', opacity: 0.6, marginBottom: 4 },
  resultCard: {
    borderWidth: 2,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  resultThumb: { width: 90, height: 80, flexShrink: 0 },
  resultCategory: { fontSize: 10, fontWeight: '900', paddingHorizontal: 10, paddingTop: 8 },
  resultHeadline: { fontSize: 14, fontWeight: '700', lineHeight: 19, paddingHorizontal: 10 },
  resultTime: { fontSize: 11, fontWeight: '700', paddingHorizontal: 10, marginTop: 4 },
  resultEngagement: { paddingHorizontal: 10, paddingBottom: 10 },
});
