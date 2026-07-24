import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ArticleRow from '../components/ArticleRow';
import { useApp } from '../context/AppContext';
import { fetchLocalNews } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type LocalNewsRouteProp = RouteProp<RootStackParamList, 'LocalNews'>;

export default function LocalNewsScreen() {
  const { colors, availableRegions, selectedRegions } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LocalNewsRouteProp>();
  const insets = useSafeAreaInsets();
  const regionTabs = ['All Regions', ...(selectedRegions.length > 0 ? selectedRegions : availableRegions)];
  const [activeCity, setActiveCity] = useState(route.params?.region ?? 'All Regions');
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
      {/* Back header */}
      <View style={[styles.backHeader, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.backHeaderTitle, { color: colors.primaryText }]}>Local News</Text>
        <View style={{ width: 24 }} />
      </View>

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
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }} />}
        renderItem={({ item }) => <ArticleRow article={item} />}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backHeaderTitle: { fontSize: 17, fontWeight: '700' },
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
});
