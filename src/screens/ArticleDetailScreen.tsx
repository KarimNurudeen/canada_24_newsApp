import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Share, Animated, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp, type NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EnrichedText } from 'react-native-enriched-html';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { Radius, SoftShadow } from '../theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useInteractions } from '../context/InteractionsContext';
import { requireAuth } from '../utils/requireAuth';
import { stripHtml } from '../utils/stripHtml';
import type { RootStackParamList } from '../navigation/types';

type ArticleDetailRouteProp = RouteProp<RootStackParamList, 'ArticleDetail'>;

const BODY_PARAGRAPHS = [
  "Canada's political landscape shifted significantly today as federal leaders convened an emergency session to address pressing national concerns. Analysts say the outcome could reshape public policy for years to come.",
  "Speaking to reporters outside Parliament Hill, officials confirmed that deliberations are ongoing and that a joint statement is expected before the end of the week. The move was described as \"unprecedented\" by senior advisors familiar with the situation.",
  "Meanwhile, citizens across the country are watching closely. Community groups in major cities have organized town hall meetings to discuss what the developments could mean for everyday Canadians — from housing affordability to healthcare access.",
  "Opposition leaders have called for greater transparency, urging the government to release relevant documents to the public. \"Canadians deserve to know what decisions are being made on their behalf,\" said one prominent critic.",
  "The situation continues to evolve. Canada 24/7 will provide live updates throughout the day as more information becomes available.",
];

function formatAuthorTime(iso: string | undefined, fallback: string): string {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  const time = date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) return `Today at ${time}`;
  return `${date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} at ${time}`;
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const rawBody: string | undefined = (article as any).body;
  const bodyText = rawBody ? [rawBody] : BODY_PARAGRAPHS;

  const fullText = [article.headline, ...(rawBody ? [stripHtml(rawBody)] : BODY_PARAGRAPHS)].join('. ');
  const authorTime = formatAuthorTime((article as any).publishedAt ?? (article as any).createdAt, article.time);

  const reaction = getReaction(article.id) ?? article.userReaction ?? null;
  const likeCount = getLikeCount(article.id) ?? article.likesCount ?? 0;
  const dislikeCount = getDislikeCount(article.id) ?? article.dislikesCount ?? 0;
  const comments = getComments(article.id);
  const commentCount = getCommentCount(article.id) ?? article.commentsCount ?? comments.length;
  const reposted = isReposted(article.id) ?? article.isReposted ?? false;
  const repostCount = getRepostCount(article.id) ?? article.repostsCount ?? 0;

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
    setMenuOpen(false);
    try {
      await Share.share({ message: article.headline });
    } catch {}
  };

  const handleCopyLink = async () => {
    setMenuOpen(false);
    await Clipboard.setStringAsync(article.sourceUrl ?? article.headline);
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: isSpeaking ? 120 : 48 }}>
          {/* Hero image with overlaid header + headline */}
          <View style={{ height: 320 }}>
            {article.imgUrl ? (
              <Image source={{ uri: article.imgUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                <MaterialIcons name="article" size={48} color="#fff" />
              </View>
            )}

            <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent']} style={styles.topScrim} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bottomScrim} />

            {/* Header icons */}
            <View style={[styles.headerRow, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleListen} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name={isSpeaking ? 'stop' : 'headphones'} size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="ios-share" size={19} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="more-horiz" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category + headline overlay */}
            <View style={styles.heroTextWrap}>
              {article.category ? (
                <Text style={styles.heroCategory}>{article.category}</Text>
              ) : null}
              <Text style={styles.heroHeadline}>{article.headline}</Text>
            </View>
          </View>

          {/* Content sheet */}
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            {/* Floating engagement pill */}
            <View style={[styles.pillWrap, { backgroundColor: colors.surface }, SoftShadow]}>
              <TouchableOpacity
                style={styles.pillItem}
                onPress={() => requireAuth(user, navigation, () => toggleLike(article.id))}
                activeOpacity={0.75}
              >
                <MaterialIcons
                  name={reaction === 'like' ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={reaction === 'like' ? colors.primary : colors.primaryText}
                />
                <Text style={[styles.pillCount, { color: colors.primaryText }]}>{likeCount}</Text>
              </TouchableOpacity>
              <View style={[styles.pillDivider, { backgroundColor: colors.divider }]} />
              <TouchableOpacity
                style={styles.pillItem}
                onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
                activeOpacity={0.75}
              >
                <MaterialIcons name="chat-bubble-outline" size={19} color={colors.primaryText} />
                <Text style={[styles.pillCount, { color: colors.primaryText }]}>{commentCount}</Text>
              </TouchableOpacity>
              <View style={[styles.pillDivider, { backgroundColor: colors.divider }]} />
              <TouchableOpacity
                style={styles.pillItem}
                onPress={() => requireAuth(user, navigation, () => toggleSaveArticle(article))}
                activeOpacity={0.75}
              >
                <MaterialIcons name={saved ? 'bookmark' : 'bookmark-border'} size={20} color={saved ? colors.primary : colors.primaryText} />
              </TouchableOpacity>
            </View>

            {/* Author row */}
            <View style={styles.authorRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.authorName, { color: colors.primaryText }]}>{article.author ?? 'Canada 24/7'}</Text>
                <Text style={[styles.authorTime, { color: colors.hint }]}>{authorTime}</Text>
              </View>
              {article.authorAvatar ? (
                <Image source={{ uri: article.authorAvatar }} style={styles.authorAvatar} />
              ) : (
                <View style={[styles.authorAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.authorAvatarText}>{(article.author ?? 'C').charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Body */}
            {rawBody ? (
              <EnrichedText style={{ ...styles.bodyText, color: colors.primaryText }}>
                {rawBody}
              </EnrichedText>
            ) : (
              bodyText.map((para, i) => (
                <Text key={i} style={[styles.bodyText, { color: colors.primaryText }]}>{para}</Text>
              ))
            )}

            {/* Secondary reactions: dislike + repost */}
            <View style={[styles.secondaryRow, { borderTopColor: colors.divider }]}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => requireAuth(user, navigation, () => toggleDislike(article.id))}
                activeOpacity={0.75}
              >
                <MaterialIcons
                  name={reaction === 'dislike' ? 'thumb-down' : 'thumb-down-off-alt'}
                  size={18}
                  color={reaction === 'dislike' ? '#D32F2F' : colors.hint}
                />
                <Text style={[styles.secondaryCount, { color: reaction === 'dislike' ? '#D32F2F' : colors.hint }]}>{dislikeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => requireAuth(user, navigation, () => toggleRepost(article.id, reposted))}
                activeOpacity={0.75}
              >
                <MaterialIcons name="repeat" size={19} color={reposted ? '#2E7D32' : colors.hint} />
                <Text style={[styles.secondaryCount, { color: reposted ? '#2E7D32' : colors.hint }]}>{repostCount}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments */}
          <View style={[styles.commentsSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.commentsTitle, { color: colors.primaryText }]}>Comments ({commentCount})</Text>

            <View style={styles.commentInputRow}>
              <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.commentAvatarText}>{user ? (user.displayName?.[0]?.toUpperCase() ?? '?') : '?'}</Text>
              </View>
              <TextInput
                style={[styles.commentInput, { color: colors.primaryText, backgroundColor: colors.background }]}
                placeholder={user ? 'Write a comment…' : 'Sign in to comment…'}
                placeholderTextColor={colors.hint}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                onFocus={() => { if (!user) requireAuth(user, navigation, () => {}); }}
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.divider }]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim()}
              >
                <MaterialIcons name="send" size={17} color="#fff" />
              </TouchableOpacity>
            </View>

            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={[styles.noCommentsText, { color: colors.hint }]}>Be the first to comment</Text>
              </View>
            ) : (
              comments.map(c => (
                <View key={c.id} style={[styles.commentItem, { borderTopColor: colors.divider }]}>
                  <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.commentAvatarText}>{c.authorName?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentMeta}>
                      <Text style={[styles.commentAuthor, { color: colors.primaryText }]}>{c.authorName}</Text>
                      <Text style={[styles.commentDate, { color: colors.hint }]}>{formatDate(c.createdAt)}</Text>
                    </View>
                    <Text style={[styles.commentText, { color: colors.primaryText }]}>{c.text}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* More-options menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuCard, { top: insets.top + 52, backgroundColor: colors.surface }, SoftShadow]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleCopyLink}>
              <MaterialIcons name="link" size={18} color={colors.primaryText} />
              <Text style={[styles.menuItemText, { color: colors.primaryText }]}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <MaterialIcons name="ios-share" size={18} color={colors.primaryText} />
              <Text style={[styles.menuItemText, { color: colors.primaryText }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
  topScrim: { position: 'absolute', left: 0, right: 0, top: 0, height: 100 },
  bottomScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 },
  headerRow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTextWrap: { position: 'absolute', left: 20, right: 20, bottom: 24 },
  heroCategory: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  heroHeadline: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 30 },
  sheet: {
    marginTop: -20,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pillWrap: {
    position: 'absolute',
    top: -22, right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    height: 44,
  },
  pillItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 },
  pillCount: { fontSize: 13, fontWeight: '700' },
  pillDivider: { width: StyleSheet.hairlineWidth, height: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 20 },
  authorName: { fontSize: 15, fontWeight: '700' },
  authorTime: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  authorAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  bodyText: { fontSize: 16, fontWeight: '400', lineHeight: 26, marginBottom: 16, opacity: 0.85 },
  secondaryRow: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secondaryCount: { fontSize: 13, fontWeight: '700' },
  commentsSection: { marginTop: 8, padding: 20 },
  commentsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 12 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentAvatarText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  commentInput: {
    flex: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontWeight: '500', minHeight: 44, maxHeight: 120, lineHeight: 20,
  },
  commentSendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  noComments: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  noCommentsText: { fontSize: 14, fontWeight: '600' },
  commentItem: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '700' },
  commentDate: { fontSize: 11, fontWeight: '500' },
  commentText: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  modalBackdrop: { flex: 1 },
  menuCard: {
    position: 'absolute',
    right: 16,
    borderRadius: Radius.md,
    paddingVertical: 6,
    minWidth: 160,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  menuItemText: { fontSize: 14, fontWeight: '600' },
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
  playerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  playerLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  playerTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 2 },
  stopBtn: { padding: 4 },
});
