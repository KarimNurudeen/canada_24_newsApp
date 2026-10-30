import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ArticleImage from './ArticleImage';
import HorizontalScroller from './HorizontalScroller';
import { useApp } from '../context/AppContext';
import { fetchBreakingNews } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

const CHIP_WIDTH = 236;

/** Breaking card (only when an editor has flagged a story) above a "Trending"
 * strip of headline chips — the same two-tier ticker as the web home page. */
export default function BreakingTicker({ articles }: { articles: Article[] }) {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [breaking, setBreaking] = useState<Article | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    fetchBreakingNews().then(a => { if (!cancelled) setBreaking(a); });
    return () => { cancelled = true; };
  }, []);

  // A soft pulse on the live dot, so the card reads as "happening now".
  useEffect(() => {
    if (!breaking) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breaking, pulse]);

  const trending = articles.slice(0, 8);
  if (!breaking && trending.length === 0) return null;

  return (
    <View style={{ marginTop: 14 }}>
      {breaking ? (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('ArticleDetail', { article: breaking })}
          accessibilityRole="button"
          accessibilityLabel={`Breaking news: ${breaking.headline}. Read the story`}
          style={styles.breakingCard}
        >
          {/* The story's own picture (or the logo card) behind a red wash, so the text stays readable */}
          <ArticleImage uri={breaking.imgUrl} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(142,23,16,0.97)', 'rgba(190,34,24,0.93)', 'rgba(213,43,30,0.78)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.breakingBody}>
            <View style={styles.breakingTag}>
              <Animated.View style={[styles.pulseDot, { opacity: pulse }]} />
              <Text style={styles.breakingTagText}>BREAKING NEWS</Text>
            </View>
            <Text style={styles.breakingText} numberOfLines={3}>{breaking.headline}</Text>
            <View style={styles.readBtn}>
              <Text style={styles.readBtnText}>Read the story</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#B3261E" />
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      {trending.length > 0 ? (
        <View style={styles.trendBox}>
          <View style={styles.trendHead}>
            <MaterialIcons name="trending-up" size={16} color={colors.primary} />
            <Text style={styles.trendLabel}>TRENDING</Text>
            <Text style={styles.trendHint}>Swipe for more</Text>
            <MaterialIcons name="east" size={14} color="rgba(255,255,255,0.65)" />
          </View>
          <HorizontalScroller itemWidth={CHIP_WIDTH} gap={8} padding={14} tone="dark">
            {trending.map(article => (
              <TouchableOpacity
                key={article.id}
                onPress={() => navigation.navigate('ArticleDetail', { article })}
                style={styles.chip}
                activeOpacity={0.8}
              >
                <ArticleImage uri={article.imgUrl} style={StyleSheet.absoluteFill} />
                <View style={styles.chipShade} />
                {article.isLive ? <View style={[styles.liveDot, { backgroundColor: colors.primary }]} /> : null}
                <Text style={styles.chipText} numberOfLines={3}>{article.headline}</Text>
              </TouchableOpacity>
            ))}
          </HorizontalScroller>
          <View style={{ height: 12 }} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  breakingCard: {
    marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', backgroundColor: '#8E1710',
    shadowColor: '#D52B1E', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  breakingBody: { padding: 16, gap: 10 },
  breakingTag: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  breakingTagText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  breakingText: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 23 },
  readBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  readBtnText: { color: '#B3261E', fontSize: 13, fontWeight: '800' },
  trendBox: {
    marginTop: 12, marginHorizontal: 20, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#0b1a3a', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)',
  },
  trendHead: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  trendLabel: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  trendHint: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, width: CHIP_WIDTH, minHeight: 64, overflow: 'hidden' },
  chipShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,14,30,0.62)' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: '700', lineHeight: 16, flexShrink: 1, color: '#fff' },
});
