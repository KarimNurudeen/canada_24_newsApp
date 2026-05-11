import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, FlatList, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ArticleEngagementRow from '../components/ArticleEngagementRow';
import { useApp } from '../context/AppContext';
import { fetchLocalNews } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

export default function LocalNewsScreen() {
  const { colors, toggleSaveArticle, isArticleSaved, availableRegions, selectedRegions } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const regionTabs = ['All Regions', ...(selectedRegions.length > 0 ? selectedRegions : availableRegions)];
  const [activeCity, setActiveCity] = useState('All Regions');
  const [sortMode, setSortMode] = useState<'editors' | 'time'>('editors');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regionTabs.includes(activeCity)) {
      setActiveCity(regionTabs[0] ?? 'All Regions');
    }
  }, [activeCity, regionTabs]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await fetchLocalNews(activeCity === 'All Regions' ? undefined : activeCity);
        if (!cancelled) {
          setArticles(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCity]);

  const sortedArticles = [...articles].sort((a, b) => {
    if (sortMode === 'editors') {
      return Number(Boolean(b.isUpdated || b.isLive)) - Number(Boolean(a.isUpdated || a.isLive));
    }
    return 0;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* City tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, backgroundColor: colors.primary }}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {regionTabs.map(city => {
          const isActive = city === activeCity;
          return (
            <TouchableOpacity
              key={city}
              onPress={() => setActiveCity(city)}
              style={[
                styles.cityTab,
                { borderBottomColor: isActive ? '#fff' : 'transparent' },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.cityTabText,
                { color: isActive ? '#fff' : 'rgba(255,255,255,0.65)' },
              ]}>{city}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort bar */}
      <View style={[styles.sortBar, { backgroundColor: colors.surface, borderBottomColor: colors.divider + '30' }]}>
        {(['editors', 'time'] as const).map(mode => (
          <TouchableOpacity
            key={mode}
            onPress={() => setSortMode(mode)}
            style={[
              styles.sortBtn,
              {
                borderBottomWidth: 3,
                borderBottomColor: sortMode === mode ? colors.primary : 'transparent',
              },
            ]}
          >
            <Text style={[
              styles.sortBtnText,
              { color: sortMode === mode ? colors.primary : colors.primaryText, opacity: sortMode === mode ? 1 : 0.55 },
            ]}>
              {mode === 'editors' ? "Editors' Picks" : 'By Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Articles */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primaryText }]}>Loading local news...</Text>
        </View>
      ) : (
      <FlatList
        data={sortedArticles}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const saved = isArticleSaved(item.id);
          return (
            <TouchableOpacity
              style={[styles.articleCard, {
                backgroundColor: colors.surface,
                borderColor: colors.primaryText,
              }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
            >
              {item.imgUrl ? (
                <Image
                  source={{ uri: item.imgUrl }}
                  style={styles.articleThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.articleThumb, styles.thumbFallback, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="article" size={24} color="#fff" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                {item.isUpdated && (
                  <View style={[styles.updatedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.updatedText}>UPDATED</Text>
                  </View>
                )}
                <Text style={[styles.articleHeadline, { color: colors.primaryText }]} numberOfLines={3}>
                  {item.headline}
                </Text>
                <Text style={[styles.articleTime, { color: colors.primary }]}>{item.time}</Text>
                <ArticleEngagementRow article={item} style={styles.articleEngagement} />
              </View>
              <TouchableOpacity
                onPress={() => toggleSaveArticle(item)}
                style={{ paddingLeft: 4 }}
              >
                <MaterialIcons
                  name={saved ? 'bookmark' : 'bookmark-border'}
                  size={20}
                  color={saved ? colors.primary : colors.hint as string}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cityTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
  },
  cityTabText: { fontSize: 13, fontWeight: '900' },
  sortBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  sortBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  sortBtnText: { fontSize: 13, fontWeight: '900' },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: { fontSize: 14, fontWeight: '600', opacity: 0.6 },
  articleCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  articleThumb: { width: 90, height: 72, flexShrink: 0 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  updatedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 4,
  },
  updatedText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  articleHeadline: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  articleTime: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  articleEngagement: { marginTop: 8 },
});
