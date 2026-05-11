import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useInteractions } from '../context/InteractionsContext';

type ArticleEngagement = {
  id: string;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
};

interface ArticleEngagementRowProps {
  article: ArticleEngagement;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export default function ArticleEngagementRow({
  article,
  color,
  style,
}: ArticleEngagementRowProps) {
  const { colors } = useApp();
  const { getLikeCount, getCommentCount, getRepostCount } = useInteractions();

  const tone = color ?? colors.hint;
  const likeCount = getLikeCount(article.id) ?? article.likesCount ?? 0;
  const commentCount = getCommentCount(article.id) ?? article.commentsCount ?? 0;
  const repostCount = getRepostCount(article.id) ?? article.repostsCount ?? 0;

  const stats = [
    { icon: 'thumb-up-off-alt' as const, value: likeCount, key: 'likes' },
    { icon: 'chat-bubble-outline' as const, value: commentCount, key: 'comments' },
    { icon: 'repeat' as const, value: repostCount, key: 'reposts' },
  ];

  return (
    <View style={[styles.row, style]}>
      {stats.map(item => (
        <View key={item.key} style={styles.stat}>
          <MaterialIcons name={item.icon} size={13} color={tone} />
          <Text style={[styles.value, { color: tone }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 11,
    fontWeight: '800',
  },
});
