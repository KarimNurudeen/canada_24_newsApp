import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius } from '../theme';
import { useApp, type Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

interface ArticleRowProps {
  article: Article;
  trailingIcon?: keyof typeof MaterialIcons.glyphMap;
  onTrailingPress?: () => void;
}

export default function ArticleRow({ article, trailingIcon, onTrailingPress }: ArticleRowProps) {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const sourceLabel = article.author || article.category || 'Canada 24/7';
  const initial = sourceLabel.trim().charAt(0).toUpperCase() || 'C';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => navigation.navigate('ArticleDetail', { article })}
      style={styles.row}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <View style={styles.sourceRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={[styles.sourceLabel, { color: colors.secondaryText }]} numberOfLines={1}>
            {sourceLabel}
          </Text>
          {article.isLive ? (
            <View style={[styles.livePill, { backgroundColor: colors.primary }]}>
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.headline, { color: colors.primaryText }]} numberOfLines={3}>
          {article.headline}
        </Text>

        <View style={styles.metaRow}>
          {article.category ? (
            <View style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{article.category}</Text>
            </View>
          ) : null}
          <Text style={[styles.time, { color: colors.hint }]}>{article.time}</Text>
        </View>
      </View>

      <View style={styles.thumbWrap}>
        {article.imgUrl ? (
          <Image source={{ uri: article.imgUrl }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="article" size={22} color={colors.primary} />
          </View>
        )}
        {trailingIcon ? (
          <TouchableOpacity
            onPress={onTrailingPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.trailingBtn, { backgroundColor: colors.background }]}
          >
            <MaterialIcons name={trailingIcon} size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  avatar: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sourceLabel: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  livePill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.pill },
  livePillText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  headline: { fontSize: 15, fontWeight: '700', lineHeight: 20, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  tagText: { fontSize: 10, fontWeight: '700' },
  time: { fontSize: 11, fontWeight: '500' },
  thumbWrap: { width: 72, height: 72, flexShrink: 0 },
  thumb: { width: 72, height: 72, borderRadius: Radius.md },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  trailingBtn: {
    position: 'absolute',
    top: -6, right: -6,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});
