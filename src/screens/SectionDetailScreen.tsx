import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius } from '../theme';
import ArticleRow from '../components/ArticleRow';
import { useApp } from '../context/AppContext';
import { fetchCategoryArticles } from '../services/newsService';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type SectionDetailRouteProp = RouteProp<RootStackParamList, 'SectionDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const SECTION_COLORS: Record<string, string> = {
  Business:      '#2c3e50',
  Health:        '#27ae60',
  Entertainment: '#8e44ad',
  Technology:    '#2980b9',
  Sports:        '#e67e22',
  Indigenous:    '#d35400',
  World:         '#7f8c8d',
  Politics:      '#1976D2',
  Immigration:   '#b03a2e',
  Aviation:      '#2471a3',
  Events:        '#af2d63',
  'Auto News':   '#37474f',
  'Blacks in Canada': '#1a1a1a',
  'Education in Canada': '#6a1b9a',
  Opportunities: '#00695c',
  General:       '#455a64',
};

export default function SectionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SectionDetailRouteProp>();
  const { section } = route.params;
  const { colors } = useApp();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sectionColor = SECTION_COLORS[section] ?? colors.primary;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchCategoryArticles(section);
        if (!cancelled) {
          setArticles(data);
          if (data.length === 0) setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [section]);

  const refresh = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchCategoryArticles(section);
      setArticles(data);
      if (data.length === 0) setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={sectionColor} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: sectionColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{section.toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>Canada 24/7</Text>
        </View>
        <TouchableOpacity onPress={refresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={sectionColor} />
          <Text style={[styles.loadingText, { color: colors.primaryText }]}>Loading {section} news...</Text>
        </View>
      )}

      {/* Error / no results */}
      {!loading && error && (
        <View style={styles.centered}>
          <MaterialIcons name="cloud-off" size={56} color={colors.primaryText} style={{ opacity: 0.3 }} />
          <Text style={[styles.errorTitle, { color: colors.primaryText }]}>Unable to load {section} news</Text>
          <Text style={[styles.errorSub, { color: colors.primaryText }]}>Check your connection</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: sectionColor }]} onPress={refresh}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Article list */}
      {!loading && !error && (
        <FlatList
          data={articles}
          keyExtractor={(item, i) => item.id + i}
          contentContainerStyle={{ paddingVertical: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginHorizontal: 20 }} />}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 20 }}>
              <ArticleRow article={item} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: '#fff',
    letterSpacing: 1,
    lineHeight: 26,
  },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, fontWeight: '600', opacity: 0.6 },
  errorTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  errorSub: { fontSize: 13, fontWeight: '600', opacity: 0.6 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8, borderRadius: Radius.pill },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
});
