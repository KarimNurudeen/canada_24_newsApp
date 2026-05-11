import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, StatusBar, Share, Animated,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp, type NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useInteractions } from '../context/InteractionsContext';
import { requireAuth } from '../utils/requireAuth';
import type { RootStackParamList } from '../navigation/types';

type ArticleDetailRouteProp = RouteProp<RootStackParamList, 'ArticleDetail'>;

const BODY_PARAGRAPHS = [
  "Canada's political landscape shifted significantly today as federal leaders convened an emergency session to address pressing national concerns. Analysts say the outcome could reshape public policy for years to come.",
  "Speaking to reporters outside Parliament Hill, officials confirmed that deliberations are ongoing and that a joint statement is expected before the end of the week. The move was described as \"unprecedented\" by senior advisors familiar with the situation.",
  "Meanwhile, citizens across the country are watching closely. Community groups in major cities have organized town hall meetings to discuss what the developments could mean for everyday Canadians — from housing affordability to healthcare access.",
  "Opposition leaders have called for greater transparency, urging the government to release relevant documents to the public. \"Canadians deserve to know what decisions are being made on their behalf,\" said one prominent critic.",
  "The situation continues to evolve. Canada 24/7 will provide live updates throughout the day as more information becomes available.",
];

function SoundWave({ color }: { color: string }) {
  const anims = React.useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    const animations = anims.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 1, duration: 300 + i * 80, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.2, duration: 300 + i * 80, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={waveStyles.row}>
      {anims.map((bar, i) => (
        <Animated.View
          key={i}
          style={[waveStyles.bar, { backgroundColor: color, transform: [{ scaleY: bar }] }]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 },
  bar: { width: 3, height: 20, borderRadius: 2 },
});

export default function ArticleDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<ArticleDetailRouteProp>();
  const { article } = route.params;
  const { colors, toggleSaveArticle, isArticleSaved } = useApp();
  const { user } = useAuth();
  const {
    hydrateArticleInteractions,
    getReaction, getLikeCount, getDislikeCount,
    getComments, getCommentCount, isReposted, getRepostCount,
    toggleLike, toggleDislike, addComment, toggleRepost,
  } = useInteractions();
  const insets = useSafeAreaInsets();
  const saved = isArticleSaved(article.id);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Article body: use user-post body if available, else static paragraphs
  const bodyText = (article as any).body
    ? [(article as any).body]
    : BODY_PARAGRAPHS;

  const fullText = [article.headline, ...bodyText].join('. ');

  const reaction = getReaction(article.id) ?? article.userReaction ?? null;
  const likeCount = getLikeCount(article.id) ?? article.likesCount ?? 0;
  const dislikeCount = getDislikeCount(article.id) ?? article.dislikesCount ?? 0;
  const comments = getComments(article.id);
  const commentCount = getCommentCount(article.id) ?? article.commentsCount ?? comments.length;
  const reposted = isReposted(article.id) ?? article.isReposted ?? false;
  const repostCount = getRepostCount(article.id) ?? article.repostsCount ?? 0;

  // Stop speech when leaving screen
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  useEffect(() => {
    void hydrateArticleInteractions(article);
  }, [article.id]);

  const handleListen = useCallback(async () => {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(fullText, {
      language: 'en-CA',
      rate: 0.92,
      pitch: 1.0,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [fullText]);

  const handleStop = useCallback(async () => {
    await Speech.stop();
    setIsSpeaking(false);
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({ message: article.headline });
    } catch {}
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    requireAuth(user, navigation, () => {
      if (!user) return;
      addComment(article.id, commentText, user);
      setCommentText('');
    });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-CA', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleListen}
            style={[styles.listenBtn, { backgroundColor: isSpeaking ? '#fff' : 'rgba(255,255,255,0.2)' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name={isSpeaking ? 'stop' : 'headphones'}
              size={18}
              color={isSpeaking ? colors.primary : '#fff'}
            />
            <Text style={[styles.listenBtnText, { color: isSpeaking ? colors.primary : '#fff' }]}>
              {isSpeaking ? 'STOP' : 'LISTEN'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={{ marginLeft: 16 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="share" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => requireAuth(user, navigation, () => toggleSaveArticle(article))} style={{ marginLeft: 16 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons
              name={saved ? 'bookmark' : 'bookmark-border'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: isSpeaking ? 120 : 48 }}
        >
          {/* Hero image */}
          {article.imgUrl ? (
            <View style={{ height: 240, position: 'relative' }}>
              <Image
                source={{ uri: article.imgUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay} />
              {article.isLive && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
              {article.duration && (
                <View style={styles.durationBadge}>
                  <MaterialIcons name="play-arrow" size={14} color="#fff" />
                  <Text style={styles.durationText}>{article.duration}</Text>
                </View>
              )}
            </View>
          ) : null}

          <View style={styles.content}>
            {/* Category + time */}
            <View style={styles.metaRow}>
              {article.category ? (
                <Text style={[styles.category, { color: colors.primary }]}>
                  {article.category} ·{' '}
                </Text>
              ) : null}
              <Text style={[styles.time, { color: colors.primaryText }]}>{article.time}</Text>
            </View>

            {/* Headline */}
            <Text style={[styles.headline, { color: colors.primaryText }]}>
              {article.headline}
            </Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.primary }]} />

            {/* Body text */}
            {bodyText.map((para, i) => (
              <Text key={i} style={[styles.bodyText, { color: colors.primaryText }]}>
                {para}
              </Text>
            ))}

            {/* Tags */}
            <View style={styles.tagsRow}>
              {['Canada', 'News', article.category ?? 'General'].filter(Boolean).map(tag => (
                <View key={tag} style={[styles.tag, { borderColor: colors.primary }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Save CTA */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: saved ? colors.secondary : colors.primary }]}
              onPress={() => requireAuth(user, navigation, () => toggleSaveArticle(article))}
              activeOpacity={0.85}
            >
              <MaterialIcons name={saved ? 'bookmark' : 'bookmark-border'} size={20} color="#fff" />
              <Text style={styles.saveBtnText}>
                {saved ? 'Saved to Library' : 'Save This Story'}
              </Text>
            </TouchableOpacity>

            {/* ── Interaction bar ── */}
            <View style={[styles.interactionBar, { borderColor: colors.primaryText + '20' }]}>
              {/* Like */}
              <TouchableOpacity
                style={styles.interactionBtn}
                onPress={() => requireAuth(user, navigation, () => toggleLike(article.id))}
                activeOpacity={0.75}
              >
                <MaterialIcons
                  name={reaction === 'like' ? 'thumb-up' : 'thumb-up-off-alt'}
                  size={22}
                  color={reaction === 'like' ? colors.primary : colors.primaryText}
                />
                <Text style={[styles.interactionCount, { color: reaction === 'like' ? colors.primary : colors.primaryText }]}>
                  {likeCount}
                </Text>
              </TouchableOpacity>

              {/* Dislike */}
              <TouchableOpacity
                style={styles.interactionBtn}
                onPress={() => requireAuth(user, navigation, () => toggleDislike(article.id))}
                activeOpacity={0.75}
              >
                <MaterialIcons
                  name={reaction === 'dislike' ? 'thumb-down' : 'thumb-down-off-alt'}
                  size={22}
                  color={reaction === 'dislike' ? '#D32F2F' : colors.primaryText}
                />
                <Text style={[styles.interactionCount, { color: reaction === 'dislike' ? '#D32F2F' : colors.primaryText }]}>
                  {dislikeCount}
                </Text>
              </TouchableOpacity>

              {/* Comments */}
              <TouchableOpacity
                style={styles.interactionBtn}
                onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
                activeOpacity={0.75}
              >
                <MaterialIcons name="chat-bubble-outline" size={22} color={colors.primaryText} />
                <Text style={[styles.interactionCount, { color: colors.primaryText }]}>
                  {commentCount}
                </Text>
              </TouchableOpacity>

              {/* Repost */}
              <TouchableOpacity
                style={styles.interactionBtn}
                onPress={() => requireAuth(user, navigation, () => toggleRepost(article.id, reposted))}
                activeOpacity={0.75}
              >
                <MaterialIcons
                  name="repeat"
                  size={24}
                  color={reposted ? '#2E7D32' : colors.primaryText}
                />
                <Text style={[styles.interactionCount, { color: reposted ? '#2E7D32' : colors.primaryText }]}>
                  {repostCount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Comments section ── */}
          <View style={[styles.commentsSection, { backgroundColor: colors.surface }]}>
            <View style={[styles.commentsHeader, { borderBottomColor: colors.primaryText + '15' }]}>
              <Text style={[styles.commentsTitle, { color: colors.primaryText }]}>
                COMMENTS ({commentCount})
              </Text>
            </View>

            {/* Comment input */}
            <View style={[styles.commentInputRow, { borderBottomColor: colors.primaryText + '15' }]}>
              <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.commentAvatarText}>
                  {user ? (user.displayName?.[0]?.toUpperCase() ?? '?') : '?'}
                </Text>
              </View>
              <TextInput
                style={[styles.commentInput, {
                  color: colors.primaryText,
                  borderColor: colors.primaryText + '30',
                  backgroundColor: colors.background,
                }]}
                placeholder={user ? 'Write a comment…' : 'Sign in to comment…'}
                placeholderTextColor={colors.primaryText + '60'}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                onFocus={() => {
                  if (!user) {
                    requireAuth(user, navigation, () => {});
                  }
                }}
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, {
                  backgroundColor: commentText.trim() ? colors.primary : colors.primaryText + '30',
                }]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim()}
              >
                <MaterialIcons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Comment list */}
            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <MaterialIcons name="chat-bubble-outline" size={32} color={colors.primaryText} style={{ opacity: 0.2 }} />
                <Text style={[styles.noCommentsText, { color: colors.primaryText }]}>
                  Be the first to comment
                </Text>
              </View>
            ) : (
              comments.map(c => (
                <View key={c.id} style={[styles.commentItem, { borderBottomColor: colors.primaryText + '10' }]}>
                  <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.commentAvatarText}>{c.authorName?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentMeta}>
                      <Text style={[styles.commentAuthor, { color: colors.primary }]}>{c.authorName}</Text>
                      <Text style={[styles.commentDate, { color: colors.primaryText }]}>{formatDate(c.createdAt)}</Text>
                    </View>
                    <Text style={[styles.commentText, { color: colors.primaryText }]}>{c.text}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating audio player bar */}
      {isSpeaking && (
        <View style={[styles.playerBar, { backgroundColor: colors.primary, paddingBottom: insets.bottom || 16 }]}>
          <View style={styles.playerLeft}>
            <SoundWave color="#fff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.playerLabel}>NOW READING</Text>
              <Text style={styles.playerTitle} numberOfLines={1}>{article.headline}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleStop} style={styles.stopBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="stop-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 56,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
  },
  listenBtnText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  liveBadge: {
    position: 'absolute',
    top: 12, left: 12,
    backgroundColor: '#1976D2',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  durationBadge: {
    position: 'absolute',
    bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  content: { padding: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 11, fontWeight: '900' },
  time: { fontSize: 11, fontWeight: '700', opacity: 0.6 },
  headline: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  divider: { height: 3, width: 48, marginBottom: 20 },
  bodyText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 26,
    marginBottom: 16,
    opacity: 0.85,
  },
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8, marginBottom: 24 },
  tag: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '900' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  saveBtnText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: '#fff',
    letterSpacing: 0.5,
  },
  // Interaction bar
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  interactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  interactionCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Comments
  commentsSection: {
    marginTop: 8,
  },
  commentsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  commentsTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    fontWeight: '600',
    minHeight: 96,
    maxHeight: 180,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  commentSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    flexShrink: 0,
  },
  noComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  noCommentsText: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.4,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: { fontSize: 13, fontWeight: '900' },
  commentDate: { fontSize: 11, fontWeight: '600', opacity: 0.5 },
  commentText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  // Audio player
  playerBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  playerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  playerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  playerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  stopBtn: { padding: 4 },
});
