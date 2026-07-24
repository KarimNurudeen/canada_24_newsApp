import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius, SoftShadow } from '../theme';
import { ENABLE_USER_POST_CREATION } from '../config/features';
import { CATEGORY_DEFINITIONS } from '../config/content';
import ArticleRow from '../components/ArticleRow';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/requireAuth';
import { fetchCategoryArticles } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

const CANADA247_LOGO = require('../../assets/canada247-logo.jpg');
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FILTER_LABELS = ['All', 'Community', ...CATEGORY_DEFINITIONS.filter(c => c.code !== 'GENERAL').map(c => c.label)];

export default function HomeScreen() {
  const { colors, communityStories, topStories, loadingNews, refreshNews } = useApp();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState('All');
  const [categoryArticles, setCategoryArticles] = useState<Article[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  useEffect(() => {
    if (activeFilter === 'All' || activeFilter === 'Community') return;
    let cancelled = false;
    setLoadingCategory(true);
    fetchCategoryArticles(activeFilter)
      .then(data => { if (!cancelled) setCategoryArticles(data); })
      .finally(() => { if (!cancelled) setLoadingCategory(false); });
    return () => { cancelled = true; };
  }, [activeFilter]);

  const hero = topStories[0];
  const listArticles =
    activeFilter === 'All' ? topStories.slice(1)
      : activeFilter === 'Community' ? communityStories
      : categoryArticles;
  const hasStories = topStories.length > 0;

  if (!hasStories && !loadingNews) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
        <MaterialIcons name="newspaper" size={52} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>No stories yet</Text>
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          Pull to refresh once the backend has content.
        </Text>
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
        <MaterialIcons name="hourglass-empty" size={52} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>Loading stories</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={loadingNews} onRefresh={refreshNews} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Hero */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => navigation.navigate('ArticleDetail', { article: hero })}
          style={{ height: SCREEN_HEIGHT * 0.52 }}
        >
          {hero.imgUrl ? (
            <Image source={{ uri: hero.imgUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialIcons name="article" size={48} color="#fff" />
            </View>
          )}

          {/* Header row overlaid on hero */}
          <View style={[styles.headerRow, { paddingTop: insets.top + 8 }]}>
            <Image source={CANADA247_LOGO} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('AlertSetup')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="notifications-none" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.heroGradient}
          />

          {hero.isLive ? (
            <View style={[styles.livePill, { backgroundColor: colors.primary }]}>
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          ) : null}

          <View style={styles.heroContent}>
            <View style={styles.heroMetaRow}>
              <View style={[styles.heroAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.heroAvatarText}>{(hero.author ?? 'C').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.heroSource} numberOfLines={1}>
                {hero.author ?? 'Canada 24/7'}{hero.category ? ` · ${hero.category}` : ''}
              </Text>
            </View>
            <Text style={styles.heroHeadline} numberOfLines={3}>{hero.headline}</Text>
            <TouchableOpacity
              style={[styles.readMoreBtn, { backgroundColor: '#fff' }]}
              onPress={() => navigation.navigate('ArticleDetail', { article: hero })}
              activeOpacity={0.85}
            >
              <Text style={[styles.readMoreText, { color: colors.primaryText }]}>Read More</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Latest News header */}
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Latest News</Text>

        {/* Category filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_LABELS.map(label => {
            const active = activeFilter === label;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setActiveFilter(label)}
                style={[styles.filterTab, active && { borderBottomColor: colors.primaryText, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.filterTabText, { color: active ? colors.primaryText : colors.hint }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Article list */}
        <View style={styles.listPadding}>
          {loadingCategory ? (
            <Text style={[styles.loadingText, { color: colors.hint }]}>Loading…</Text>
          ) : listArticles.length === 0 ? (
            <Text style={[styles.loadingText, { color: colors.hint }]}>
              {activeFilter === 'Community' ? 'No community stories yet — be the first to post one!' : 'No stories in this category yet.'}
            </Text>
          ) : (
            listArticles.map(article => (
              <View key={article.id} style={[styles.rowDivider, { borderBottomColor: colors.divider }]}>
                <ArticleRow article={article} />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {ENABLE_USER_POST_CREATION ? (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }, SoftShadow]}
          onPress={() => requireAuth(user, navigation, () => navigation.navigate('CreatePost'))}
          activeOpacity={0.85}
        >
          <MaterialIcons name="edit" size={20} color="#fff" />
          <Text style={styles.fabText}>Post News</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  logo: { width: 110, height: 32 },
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '55%',
  },
  livePill: {
    position: 'absolute',
    top: 60, right: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  livePillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  heroContent: {
    position: 'absolute',
    left: 20, right: 20, bottom: 24,
  },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  heroAvatar: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  heroSource: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  heroHeadline: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 30, marginBottom: 16 },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  readMoreText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 4,
  },
  filterRow: { paddingHorizontal: 20, gap: 20, paddingBottom: 12 },
  filterTab: { paddingBottom: 8 },
  filterTabText: { fontSize: 14, fontWeight: '600' },
  listPadding: { paddingHorizontal: 20 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  loadingText: { fontSize: 13, fontWeight: '600', paddingVertical: 16 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
  },
  fabText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptyText: { fontSize: 14, fontWeight: '600', lineHeight: 21, textAlign: 'center' },
});
