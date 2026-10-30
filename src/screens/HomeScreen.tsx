import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius } from '../theme';
import { NAV_CATEGORIES, findNavCategory } from '../config/nav';
import { ENABLE_USER_POST_CREATION } from '../config/features';
import { filterByTopic } from '../utils/topics';
import TopicDropdown from '../components/TopicDropdown';
import SearchModal from '../components/SearchModal';
import NotificationsSheet from '../components/NotificationsSheet';
import CategoryCards from '../components/CategoryCards';
import BreakingTicker from '../components/BreakingTicker';
import FeaturedUpdates from '../components/FeaturedUpdates';
import ImmigrationByProvince from '../components/ImmigrationByProvince';
import LatestVideosStrip from '../components/LatestVideosStrip';
import ArticleRow from '../components/ArticleRow';
import SlideUpCard from '../components/SlideUpCard';
import ArticleImage from '../components/ArticleImage';
import { useApp } from '../context/AppContext';
import { fetchCategoryArticles } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_LABELS = ['All', ...(ENABLE_USER_POST_CREATION ? ['Community'] : []), ...NAV_CATEGORIES.map(c => c.label)];
const ROW_STORIES = 3;
const NAVY = '#0b1a3a';
const NAVY_MID = '#12306a';
const NAVY_CHROME = 'rgba(11,26,58,0.94)';

/** Wordmark: condensed CANADA over italic "in real time" with a live dot —
 * the same lockup as the web header. */
function Wordmark({ colors }: { colors: ReturnType<typeof useApp>['colors'] }) {
  return (
    <View>
      <Text style={[styles.wordmark, { color: '#fff' }]}>CANADA</Text>
      <View style={styles.wordmarkSub}>
        <View style={[styles.wordmarkRule, { backgroundColor: colors.primary }]} />
        <Text style={[styles.wordmarkTag, { color: 'rgba(255,255,255,0.8)' }]}>in real time</Text>
        <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors, communityStories, topStories, loadingNews, refreshNews } = useApp();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({});

  // Close the search overlay when a result opens another screen.
  useEffect(() => navigation.addListener('blur', () => setSearchOpen(false)), [navigation]);

  useEffect(() => {
    let cancelled = false;
    NAV_CATEGORIES.forEach(category => {
      fetchCategoryArticles(category.section).then(list => {
        if (!cancelled) setCategoryArticles(prev => ({ ...prev, [category.label]: list }));
      });
    });
    return () => { cancelled = true; };
  }, []);

  const images = useMemo(
    () => Object.fromEntries(
      Object.entries(categoryArticles).map(([label, list]) => [label, list.find(a => a.imgUrl)?.imgUrl]),
    ),
    [categoryArticles],
  );

  const hero = topStories[0];
  const activeCategory = findNavCategory(activeFilter);
  const listArticles =
    activeFilter === 'All' ? topStories.slice(1)
      : activeFilter === 'Community' ? communityStories
      : filterByTopic(categoryArticles[activeFilter] ?? [], activeTopic);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 0 }}
        refreshControl={
          <RefreshControl refreshing={loadingNews} onRefresh={refreshNews} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Header: wordmark left, search + alerts right */}
        <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: NAVY_CHROME, borderBottomColor: 'rgba(255,255,255,0.12)' }]}>
          {/* One explicit row: wordmark on the left, search + bell on the right, centred on the same line */}
          <View style={styles.headerRow}>
            <View style={{ flexShrink: 1 }}>
              <Wordmark colors={colors} />
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)' }]}
                onPress={() => setSearchOpen(true)}
                accessibilityLabel="Search"
                activeOpacity={0.8}
              >
                <MaterialIcons name="search" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)' }]}
                onPress={() => setBellOpen(true)}
                accessibilityLabel="Notifications"
                activeOpacity={0.8}
              >
                <MaterialIcons name="notifications-none" size={22} color="#fff" />
                <View style={[styles.badgeDot, { backgroundColor: colors.primary, borderColor: NAVY }]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Breaking bar + trending strip, as on the web */}
        <BreakingTicker articles={topStories} />

        {/* Category cards come first, as on the web landing page */}
        <CategoryCards
          images={images}
          onOpenCategory={section => navigation.navigate('SectionDetail', { section })}
          onOpenVideos={() => (navigation as any).navigate('Watch')}
        />

        {/* Top story */}
        {hero ? (
          <SlideUpCard style={styles.block} delay={150}>
            <BlockTitle title="Top Story" color={colors.primary} textColor={colors.primaryText} />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ArticleDetail', { article: hero })}
              style={[styles.heroCard, { backgroundColor: NAVY, borderColor: NAVY_MID }]}
            >
              <ArticleImage uri={hero.imgUrl} style={styles.heroImage} />
              <View style={styles.heroBody}>
                <View style={styles.heroMeta}>
                  {hero.category ? (
                    <Text style={[styles.heroCategory, { color: colors.primary }]}>{hero.category.toUpperCase()}</Text>
                  ) : null}
                  {hero.isLive ? (
                    <View style={[styles.livePill, { backgroundColor: colors.primary }]}>
                      <Text style={styles.livePillText}>LIVE</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.heroTime, { color: 'rgba(255,255,255,0.6)' }]}>{hero.time}</Text>
                </View>
                <Text style={[styles.heroHeadline, { color: '#fff' }]} numberOfLines={3}>{hero.headline}</Text>
              </View>
            </TouchableOpacity>
          </SlideUpCard>
        ) : null}

        <FeaturedUpdates categoryArticles={categoryArticles} />
        <ImmigrationByProvince />

        {/* Category rows, like the web's section blocks */}
        {NAV_CATEGORIES.map(category => {
          const list = categoryArticles[category.label] ?? [];
          if (list.length === 0) return null;
          return (
            <View key={category.label} style={styles.block}>
              {/* Banner, stories and "See all" live in one card so the section reads as a single unit */}
              <View style={[styles.categoryCard, { borderColor: colors.divider, backgroundColor: colors.surface }]}>
                <BlockTitle
                  flush
                  title={category.label}
                  color={category.color}
                  textColor={colors.primaryText}
                  actionLabel="See all"
                  onAction={() => navigation.navigate('SectionDetail', { section: category.section })}
                />
                <View style={styles.categoryRows}>
                  {list.slice(0, ROW_STORIES).map((article, i) => (
                    <View key={article.id} style={[styles.rowDivider, { borderBottomColor: colors.divider }]}>
                      <ArticleRow article={article} index={i} />
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('SectionDetail', { section: category.section })}
                  style={[styles.categoryFooter, { borderTopColor: colors.divider }]}
                  accessibilityRole="button"
                  accessibilityLabel={`See all ${category.label} stories`}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryFooterText, { color: category.color }]}>See all {category.label} stories</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={category.color} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Latest feed with category filter */}
        <View style={styles.block}>
          <BlockTitle title="Latest News" color={colors.primary} textColor={colors.primaryText} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTER_LABELS.map(label => {
              const active = activeFilter === label;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => { setActiveFilter(label); setActiveTopic(null); }}
                  style={[
                    styles.filterChip,
                    { borderColor: active ? colors.primary : colors.divider, backgroundColor: active ? colors.primary : 'transparent' },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.secondaryText }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {activeCategory ? (
            <View style={{ marginBottom: 8 }}>
              <TopicDropdown topics={activeCategory.topics} value={activeTopic} onChange={setActiveTopic} color={activeCategory.color} />
            </View>
          ) : null}

          {listArticles.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.hint }]}>
              {activeFilter === 'Community'
                ? 'No community stories yet — be the first to post one!'
                : activeTopic ? `No ${activeTopic} stories right now.`
                : loadingNews ? 'Loading…' : 'No stories in this category yet.'}
            </Text>
          ) : (
            listArticles.map((article, i) => (
              <View key={article.id} style={[styles.rowDivider, { borderBottomColor: colors.divider }]}>
                <ArticleRow article={article} index={i} />
              </View>
            ))
          )}
        </View>
        <LatestVideosStrip onOpenVideos={() => (navigation as any).navigate('Watch')} />
        {/* No footer on mobile: saved stories, alerts, feedback, About and the legal pages live in Settings */}
        <View style={{ height: 28 }} />
      </ScrollView>

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsSheet
        visible={bellOpen}
        onClose={() => setBellOpen(false)}
        onManageAll={() => navigation.navigate('AlertSetup')}
      />
    </View>
  );
}

/** Navy banner that heads each block, with a coloured category tab on its left. */
function BlockTitle({ title, color, actionLabel, onAction, flush }: {
  title: string; color: string; textColor?: string; actionLabel?: string; onAction?: () => void;
  /** Sits flush at the top of a card: no gap below and square corners (the card clips them). */
  flush?: boolean;
}) {
  return (
    <View style={[styles.blockBanner, flush && styles.blockBannerFlush]}>
      <View style={[styles.blockAccent, { backgroundColor: color }]} />
      <Text style={styles.blockTitle}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.blockAction}>{actionLabel} ›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  wordmark: { fontFamily: 'BebasNeue_400Regular', fontSize: 30, letterSpacing: 5, lineHeight: 32 },
  wordmarkSub: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  wordmarkRule: { width: 16, height: 2 },
  wordmarkTag: { fontSize: 13, fontStyle: 'italic', fontWeight: '500', letterSpacing: 0.5 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeDot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  block: { paddingHorizontal: 20, paddingTop: 26 },
  blockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
    backgroundColor: NAVY, borderRadius: 14, paddingVertical: 12, paddingRight: 16, overflow: 'hidden',
  },
  blockBannerFlush: { marginBottom: 0, borderRadius: 0 },
  categoryCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  categoryRows: { paddingHorizontal: 8, paddingVertical: 6 },
  categoryFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth,
  },
  categoryFooterText: { fontSize: 14, fontWeight: '800' },
  blockAccent: { width: 5, alignSelf: 'stretch', marginVertical: -12 },
  blockTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  blockAction: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  heroCard: { borderRadius: Radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  heroImage: { width: '100%', height: 200 },
  heroBody: { padding: 16 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  heroCategory: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTime: { fontSize: 12, fontWeight: '500' },
  heroHeadline: { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  livePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  livePillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  rowDivider: {},
  filterRow: { gap: 8, paddingBottom: 14 },
  filterChip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 13, fontWeight: '600', paddingVertical: 16 },
});
