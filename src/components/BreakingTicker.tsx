import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ArticleImage from './ArticleImage';
import { useApp } from '../context/AppContext';
import { fetchBreakingNews } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

/** Breaking bar (only when an editor has flagged a story) above a "Trending"
 * strip of headline chips — the same two-tier ticker as the web home page. */
export default function BreakingTicker({ articles }: { articles: Article[] }) {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [breaking, setBreaking] = useState<Article | null>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBreakingNews().then(a => { if (!cancelled) setBreaking(a); });
    return () => { cancelled = true; };
  }, []);

  const trending = articles.slice(0, 8);
  if (!breaking && trending.length === 0) return null;

  return (
    <View style={{ marginTop: 14 }}>
      {breaking ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('ArticleDetail', { article: breaking })}>
          <View style={styles.breakingBar}>
            {/* The story's own picture (or the logo card) behind a red wash, so the text stays readable */}
            <ArticleImage uri={breaking.imgUrl} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(142,23,16,0.97)', 'rgba(190,34,24,0.93)', 'rgba(213,43,30,0.72)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.breakingTag}>
              <MaterialIcons name="bolt" size={16} color="#fff" />
              <Text style={styles.breakingTagText}>BREAKING</Text>
            </View>
            <Text style={styles.breakingText}>{breaking.headline}</Text>
            <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.85)" style={{ marginRight: 8, alignSelf: 'center' }} />
          </View>
        </TouchableOpacity>
      ) : null}

      {trending.length > 0 ? (
        <View style={[styles.trendRow, { backgroundColor: '#0b1a3a', borderColor: 'rgba(255,255,255,0.14)' }]}>
          <Text style={[styles.trendLabel, { color: 'rgba(255,255,255,0.7)', borderRightColor: 'rgba(255,255,255,0.14)' }]}>TRENDING</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={e => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              setAtEnd(contentOffset.x + layoutMeasurement.width >= contentSize.width - 8);
            }}
            scrollEventThrottle={50}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 10, alignItems: 'center' }}
          >
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
          </ScrollView>
          {/* Right-edge fade: hints that there is more to swipe to */}
          {!atEnd ? (
            <View style={styles.moreHint} pointerEvents="none">
              <LinearGradient
                colors={['rgba(11,26,58,0)', 'rgba(11,26,58,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.moreFade}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  breakingBar: { flexDirection: 'row', alignItems: 'stretch', minHeight: 56, marginHorizontal: 20, borderRadius: 12, overflow: 'hidden' },
  breakingTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.25)' },
  breakingTagText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  breakingText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 19, paddingHorizontal: 12, paddingVertical: 11, alignSelf: 'center' },
  trendRow: { flexDirection: 'row', alignItems: 'center', minHeight: 78, marginTop: 10, marginHorizontal: 20, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  trendLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 12, borderRightWidth: StyleSheet.hairlineWidth, alignSelf: 'stretch', textAlignVertical: 'center', lineHeight: 78 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, width: 236, minHeight: 56, overflow: 'hidden' },
  chipShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,14,30,0.62)' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: '700', lineHeight: 16, flexShrink: 1, color: '#fff' },
  moreHint: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  moreFade: { ...StyleSheet.absoluteFillObject },
});
