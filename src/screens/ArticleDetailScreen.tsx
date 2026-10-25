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
import { Audio } from 'expo-av';
import { Linking } from 'react-native';
import ArticleRow from '../components/ArticleRow';
import * as Clipboard from 'expo-clipboard';
import { Radius, SoftShadow } from '../theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useInteractions } from '../context/InteractionsContext';
import { requireAuth } from '../utils/requireAuth';
import UserAvatar from '../components/UserAvatar';
import ArticleImage from '../components/ArticleImage';
import LikersSheet from '../components/LikersSheet';
import { fetchLikers, fetchArticleById, timeAgo, type Liker } from '../services/socialService';
import { ENABLE_SOCIAL_PROFILES } from '../config/features';
import { bodyFontSize } from '../utils/textSize';
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

function RailAction({ icon, label, active, activeColor = '#FF453A', onPress, accessibilityLabel }: {
  icon: keyof typeof MaterialIcons.glyphMap; label?: string | number; active?: boolean;
  activeColor?: string; onPress: () => void; accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={railStyles.item} activeOpacity={0.8} accessibilityLabel={accessibilityLabel}>
      <View style={railStyles.bubble}>
        <MaterialIcons name={icon} size={27} color={active ? activeColor : '#fff'} />
      </View>
      {label !== undefined ? <Text style={railStyles.label}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const railStyles = StyleSheet.create({
  item: { alignItems: 'center' },
  bubble: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
});

export default function ArticleDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<ArticleDetailRouteProp>();
  const { article } = route.params;
  const { colors, toggleSaveArticle, isArticleSaved, topStories, communityStories, textScale } = useApp();
  const bodySize = bodyFontSize(textScale);
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
  const [likers, setLikers] = useState<{ count: number; likers: Liker[] }>({ count: 0, likers: [] });
  const [likersOpen, setLikersOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  // Related coverage is enriched in the background on the server, so refetch while it is PENDING.
  const [fresh, setFresh] = useState<{ related?: typeof article.relatedCoverage; status?: string; readTime?: number; audioUrl?: string | null; audioStatus?: string }>({});

  const rawBody: string | undefined = (article as any).body;
  const bodyText = rawBody ? [rawBody] : BODY_PARAGRAPHS;

  const fullText = [article.headline, ...(rawBody ? [stripHtml(rawBody)] : BODY_PARAGRAPHS)].join('. ');
  const authorTime = formatAuthorTime((article as any).publishedAt ?? (article as any).createdAt, article.time);

  const moreInCategory = article.category
    ? [...topStories, ...communityStories]
        .filter(a => a.category === article.category && a.id !== article.id)
        .filter((a, i, all) => all.findIndex(b => b.id === a.id) === i)
        .slice(0, 4)
    : [];

  const reaction = getReaction(article.id) ?? article.userReaction ?? null;
  const likeCount = getLikeCount(article.id) ?? article.likesCount ?? 0;
  const dislikeCount = getDislikeCount(article.id) ?? article.dislikesCount ?? 0;
  const comments = getComments(article.id);
  const commentCount = getCommentCount(article.id) ?? article.commentsCount ?? comments.length;
  const reposted = isReposted(article.id) ?? article.isReposted ?? false;
  const repostCount = getRepostCount(article.id) ?? article.repostsCount ?? 0;

  useEffect(() => {
    return () => {
      Speech.stop();
      void soundRef.current?.unloadAsync();
    };
  }, []);

  // Pull the newest copy of this story (read time, audio, related coverage) and poll while coverage is pending.
  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const load = async () => {
      const latest = await fetchArticleById(article.id);
      if (cancelled || !latest) return;
      setFresh({
        related: latest.relatedCoverage,
        status: latest.relatedCoverageStatus,
        readTime: latest.readTimeMinutes,
        audioUrl: latest.audioUrl,
        audioStatus: latest.audioStatus,
      });
      if (latest.relatedCoverageStatus === 'PENDING' && tries++ < 8) setTimeout(load, 4000);
    };
    void load();
    return () => { cancelled = true; };
  }, [article.id]);

  useEffect(() => {
    void hydrateArticleInteractions(article);
  }, [article.id]);

  // Who liked this story; refreshed whenever the viewer's own reaction changes.
  useEffect(() => {
    if (!ENABLE_SOCIAL_PROFILES) return; // needs the likers endpoint — see docs/BACKEND_DEPENDENCIES.md
    let cancelled = false;
    fetchLikers(article.id).then(result => { if (!cancelled) setLikers(result); });
    return () => { cancelled = true; };
  }, [article.id, reaction]);

  const openProfile = (userId: string | number | undefined, name?: string, avatar?: string) => {
    if (!ENABLE_SOCIAL_PROFILES || userId === undefined || userId === '') return;
    navigation.navigate('PublicProfile', { userId: String(userId), name, avatar });
  };

  const audioUrl = fresh.audioUrl ?? article.audioUrl;
  const audioStatus = fresh.audioStatus ?? article.audioStatus;

  const handleStop = useCallback(async () => {
    await Speech.stop();
    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setIsSpeaking(false);
  }, []);

  // Prefer the server-generated narration; fall back to the phone's own voice.
  const handleListen = useCallback(async () => {
    if (isSpeaking) {
      await handleStop();
      return;
    }
    setIsSpeaking(true);
    if (audioStatus === 'DONE' && audioUrl) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            setIsSpeaking(false);
            void sound.unloadAsync();
            soundRef.current = null;
          }
        });
        return;
      } catch {
        // fall through to on-device speech
      }
    }
    Speech.speak(fullText, {
      language: 'en-CA',
      rate: 0.92,
      pitch: 1.0,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [fullText, isSpeaking, audioStatus, audioUrl, handleStop]);

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
          <View style={{ height: 470 }}>
            {article.imgUrl ? (
              <ArticleImage uri={article.imgUrl} style={StyleSheet.absoluteFillObject} />
            ) : (
              // No picture: show the whole logo card above the headline instead of cropping it behind the text.
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0B2545' }]}>
                <ArticleImage uri={undefined} resizeMode="contain" style={{ width: '100%', height: 250, marginTop: 64 }} />
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

            {article.isLive ? (
              <View style={styles.heroLive}>
                <View style={styles.heroLiveDot} />
                <Text style={styles.heroLiveText}>LIVE</Text>
              </View>
            ) : null}

            {/* Category + headline overlay */}
            <View style={styles.heroTextWrap}>
              {article.category ? (
                <Text style={styles.heroCategory}>{article.category}</Text>
              ) : null}
              <Text style={styles.heroHeadline}>{article.headline}</Text>
            </View>

            {/* TikTok-style action rail */}
            <View style={styles.rail}>
              <RailAction
                icon={reaction === 'like' ? 'favorite' : 'favorite-border'}
                label={likeCount}
                active={reaction === 'like'}
                accessibilityLabel="Like"
                onPress={() => requireAuth(user, navigation, () => toggleLike(article.id))}
              />
              <RailAction
                icon={reaction === 'dislike' ? 'thumb-down' : 'thumb-down-off-alt'}
                label={dislikeCount}
                active={reaction === 'dislike'}
                activeColor="#FFB020"
                accessibilityLabel="Dislike"
                onPress={() => requireAuth(user, navigation, () => toggleDislike(article.id))}
              />
              <RailAction
                icon="chat-bubble-outline"
                label={commentCount}
                accessibilityLabel="Comments"
                onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              />
              <RailAction
                icon={saved ? 'bookmark' : 'bookmark-border'}
                label={saved ? 'Saved' : 'Save'}
                active={saved}
                activeColor="#FFD54A"
                accessibilityLabel="Save"
                onPress={() => requireAuth(user, navigation, () => toggleSaveArticle(article))}
              />
              <RailAction
                icon="repeat"
                label={repostCount}
                active={reposted}
                activeColor="#4CD964"
                accessibilityLabel="Repost"
                onPress={() => requireAuth(user, navigation, () => toggleRepost(article.id, reposted))}
              />
            </View>
          </View>

          {/* Content sheet */}
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            {/* Author row */}
            <View style={styles.authorRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.authorName, { color: colors.primaryText }]}>{article.author ?? 'Canada 24/7'}</Text>
                <Text style={[styles.authorTime, { color: colors.hint }]}>
                  {authorTime}{(fresh.readTime ?? article.readTimeMinutes) ? `  ·  ${fresh.readTime ?? article.readTimeMinutes} min read` : ''}
                </Text>
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
              <EnrichedText style={{ ...styles.bodyText, fontSize: bodySize, lineHeight: bodySize * 1.6, color: colors.primaryText }}>
                {rawBody}
              </EnrichedText>
            ) : (
              bodyText.map((para, i) => (
                <Text key={i} style={[styles.bodyText, { fontSize: bodySize, lineHeight: bodySize * 1.6, color: colors.primaryText }]}>{para}</Text>
              ))
            )}

            {/* Liked by */}
            {ENABLE_SOCIAL_PROFILES && likers.count > 0 ? (
              <TouchableOpacity style={styles.likedBy} onPress={() => setLikersOpen(true)} activeOpacity={0.8}>
                <View style={styles.likedStack}>
                  {likers.likers.slice(0, 4).map((l, i) => (
                    <View key={l.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                      <UserAvatar uri={l.avatar} name={l.displayName} size={26} ringColor={colors.background} />
                    </View>
                  ))}
                </View>
                <Text style={[styles.likedByText, { color: colors.secondaryText }]} numberOfLines={1}>
                  Liked by <Text style={{ fontWeight: '800', color: colors.primaryText }}>{likers.likers[0]?.displayName}</Text>
                  {likers.count > 1 ? ` and ${likers.count - 1} other${likers.count - 1 === 1 ? '' : 's'}` : ''}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Related coverage from other outlets */}
          {(fresh.related ?? article.relatedCoverage ?? []).length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={[styles.relatedTitle, { color: colors.primaryText }]}>Related coverage</Text>
              {(fresh.related ?? article.relatedCoverage ?? []).map(item => (
                <TouchableOpacity
                  key={item.url}
                  activeOpacity={0.85}
                  onPress={() => void Linking.openURL(item.url)}
                  style={[styles.coverageCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                >
                  <View style={styles.coverageSource}>
                    {item.sourceFavicon ? <Image source={{ uri: item.sourceFavicon }} style={styles.favicon} /> : null}
                    <Text style={[styles.coverageHost, { color: colors.hint }]} numberOfLines={1}>{item.sourceHostname}</Text>
                    {item.age ? <Text style={[styles.coverageHost, { color: colors.hint }]}>· {item.age}</Text> : null}
                  </View>
                  <Text style={[styles.coverageTitle, { color: colors.primaryText }]} numberOfLines={2}>{item.title}</Text>
                  {item.snippet ? <Text style={[styles.coverageSnippet, { color: colors.secondaryText }]} numberOfLines={2}>{item.snippet}</Text> : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : (fresh.status ?? article.relatedCoverageStatus) === 'PENDING' ? (
            <View style={styles.relatedSection}>
              <Text style={[styles.relatedTitle, { color: colors.primaryText }]}>Related coverage</Text>
              <Text style={[styles.coverageSnippet, { color: colors.hint }]}>Finding coverage from other outlets…</Text>
            </View>
          ) : null}

          {/* More in this category */}
          {moreInCategory.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={[styles.relatedTitle, { color: colors.primaryText }]}>More in {article.category}</Text>
              {moreInCategory.map((a, i) => (
                <ArticleRow key={a.id} article={a} index={i} />
              ))}
            </View>
          ) : null}

          {/* Comments */}
          <View style={[styles.commentsSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.commentsTitle, { color: colors.primaryText }]}>Comments ({commentCount})</Text>

            <View style={styles.commentInputRow}>
              <UserAvatar uri={user?.avatar} name={user?.displayName} size={32} />
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
                  <UserAvatar
                    uri={ENABLE_SOCIAL_PROFILES ? c.authorAvatar : undefined}
                    name={c.authorName}
                    size={38}
                    onPress={ENABLE_SOCIAL_PROFILES && c.authorId && /^\d+$/.test(c.authorId) ? () => openProfile(c.authorId, c.authorName, c.authorAvatar) : undefined}
                  />
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      disabled={!(ENABLE_SOCIAL_PROFILES && c.authorId && /^\d+$/.test(c.authorId))}
                      onPress={() => openProfile(c.authorId, c.authorName, c.authorAvatar)}
                    >
                      <Text style={[styles.commentAuthor, { color: colors.hint }]}>{c.authorName}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.commentText, { color: colors.primaryText, fontSize: Math.max(13, bodySize - 2), lineHeight: Math.max(13, bodySize - 2) * 1.45 }]}>{c.text}</Text>
                    <Text style={[styles.commentDate, { color: colors.hint }]}>{timeAgo(c.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LikersSheet
        visible={likersOpen}
        count={likers.count}
        likers={likers.likers}
        onClose={() => setLikersOpen(false)}
        onOpenProfile={l => { setLikersOpen(false); openProfile(l.id, l.displayName, l.avatar); }}
      />

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
  heroLive: { position: 'absolute', left: 20, top: 104, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D52B1E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  heroLiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  heroLiveText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  heroTextWrap: { position: 'absolute', left: 20, right: 84, bottom: 24 },
  rail: { position: 'absolute', right: 12, bottom: 20, gap: 14, alignItems: 'center' },
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
  relatedSection: { paddingHorizontal: 20, paddingTop: 22 },
  relatedTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  coverageCard: { padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  coverageSource: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  favicon: { width: 16, height: 16, borderRadius: 4 },
  coverageHost: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  coverageTitle: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  coverageSnippet: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 4 },
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
  commentAuthor: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  likedBy: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 4 },
  likedStack: { flexDirection: 'row', alignItems: 'center' },
  likedByText: { flex: 1, fontSize: 13, fontWeight: '500' },
  commentDate: { fontSize: 12, fontWeight: '600', marginTop: 6 },
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
