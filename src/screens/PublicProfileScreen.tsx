import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import UserAvatar from '../components/UserAvatar';
import { useApp } from '../context/AppContext';
import { fetchPublicProfile, fetchArticleById, timeAgo, type PublicProfile } from '../services/socialService';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Stat({ value, label, colors }: { value: number; label: string; colors: ReturnType<typeof useApp>['colors'] }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.primaryText }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.hint }]}>{label}</Text>
    </View>
  );
}

/** Another reader's public profile: avatar, bio, counts and their latest
 * comments (tap one to jump to that story). Opened from comments and "liked by". */
export default function PublicProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'PublicProfile'>>();
  const insets = useSafeAreaInsets();
  const { colors } = useApp();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublicProfile(params.userId).then(p => {
      if (cancelled) return;
      setProfile(p);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [params.userId]);

  const name = profile?.displayName ?? params.name ?? 'Reader';
  const avatar = profile?.avatar ?? params.avatar;
  const handle = name.replace(/\s+/g, '').toLowerCase();

  const openArticle = async (articleId: number) => {
    const article = await fetchArticleById(articleId);
    if (article) navigation.navigate('ArticleDetail', { article });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.topBtn}>
          <MaterialIcons name="arrow-back-ios-new" size={22} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.primaryText }]} numberOfLines={1}>@{handle}</Text>
        <View style={styles.topBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <UserAvatar uri={avatar} name={name} size={96} />
          <Text style={[styles.name, { color: colors.primaryText }]}>{name}</Text>
          {profile?.bio ? <Text style={[styles.bio, { color: colors.secondaryText }]}>{profile.bio}</Text> : null}
          {profile ? (
            <Text style={[styles.joined, { color: colors.hint }]}>
              Joined {new Date(profile.joinedAt).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : profile ? (
          <>
            <View style={styles.stats}>
              <Stat value={profile.commentsCount} label="Comments" colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <Stat value={profile.likesCount} label="Likes given" colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <Stat value={profile.postsCount} label="Posts" colors={colors} />
            </View>

            <Text style={[styles.section, { color: colors.primaryText }]}>Recent comments</Text>
            {profile.recentComments.length === 0 ? (
              <Text style={[styles.empty, { color: colors.hint }]}>No comments yet.</Text>
            ) : (
              profile.recentComments.map(c => (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => void openArticle(c.articleId)}
                  style={[styles.commentCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                >
                  <Text style={[styles.commentText, { color: colors.primaryText }]}>{c.text}</Text>
                  <View style={styles.commentMeta}>
                    <MaterialIcons name="article" size={14} color={colors.primary} />
                    <Text style={[styles.commentOn, { color: colors.hint }]} numberOfLines={1}>{c.articleHeadline}</Text>
                    <Text style={[styles.commentTime, { color: colors.hint }]}>{timeAgo(c.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <Text style={[styles.empty, { color: colors.hint, marginTop: 32 }]}>
            This profile couldn’t be loaded right now.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  topBtn: { width: 40 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },
  identity: { alignItems: 'center', paddingTop: 12, paddingHorizontal: 32 },
  name: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  bio: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginTop: 6 },
  joined: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  stat: { alignItems: 'center', paddingHorizontal: 22 },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 26 },
  section: { fontSize: 17, fontWeight: '800', paddingHorizontal: 20, marginTop: 28, marginBottom: 10 },
  empty: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  commentCard: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  commentText: { fontSize: 15, fontWeight: '500', lineHeight: 21 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  commentOn: { flex: 1, fontSize: 12, fontWeight: '600' },
  commentTime: { fontSize: 12, fontWeight: '600' },
});
