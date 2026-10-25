import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Radius } from '../theme';
import ArticleRow from './ArticleRow';
import { useApp } from '../context/AppContext';
import { searchArticles } from '../services/newsService';
import type { Article } from '../context/AppContext';

const TRENDING = ['Study Permit', 'Work Permit', 'Housing', 'Mortgage', 'Citizenship', 'Jobs', 'Auto Insurance', 'Express Entry'];

/** Search as an overlay over the current screen (matches the web's search
 * popup) instead of a separate page. */
export default function SearchModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  const runSearch = useCallback(async (q: string) => {
    const id = ++requestId.current;
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const res = await searchArticles(q);
    if (id !== requestId.current) return; // a newer search superseded this one
    setResults(res);
    setLoading(false);
  }, []);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (text.trim()) {
      // Show "searching" straight away instead of flashing the trending chips while the debounce runs.
      setSearched(true);
      setLoading(true);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 400);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.bar}>
          <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: focused ? colors.primary : 'transparent' }]}>
            <MaterialIcons name="search" size={20} color={focused ? colors.primary : colors.hint} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={onChangeText}
              placeholder="Search Canada247"
              placeholderTextColor={colors.hint}
              style={[styles.input, { color: colors.primaryText }]}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="search"
              onSubmitEditing={() => runSearch(query)}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => { setQuery(''); runSearch(''); }}>
                <MaterialIcons name="close" size={18} color={colors.hint} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {!searched ? (
            <>
              <Text style={[styles.label, { color: colors.secondaryText }]}>TRENDING TOPICS</Text>
              <View style={styles.chips}>
                {TRENDING.map(topic => (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.chip, { borderColor: colors.divider }]}
                    onPress={() => { setQuery(topic); runSearch(topic); }}
                  >
                    <Text style={[styles.chipText, { color: colors.primaryText }]}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
          ) : results.length === 0 ? (
            <View style={styles.centered}>
              <MaterialIcons name="search-off" size={48} color={colors.hint} />
              <Text style={[styles.noResults, { color: colors.primaryText }]}>No results for "{query}"</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.count, { color: colors.hint }]}>
                {results.length} result{results.length === 1 ? '' : 's'} for "{query.trim()}"
              </Text>
              {results.map((item, i) => (
                <ArticleRow key={item.id} article={item} index={i} />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.pill, paddingHorizontal: 16, height: 46, borderWidth: 1.5 },
  input: {
    flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  count: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  cancel: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  centered: { alignItems: 'center', gap: 12, paddingTop: 48 },
  noResults: { fontSize: 15, fontWeight: '600' },
});
