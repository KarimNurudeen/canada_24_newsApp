import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Pressable, StyleSheet, Image, ActivityIndicator,
  Share, Linking, StatusBar, type ViewToken, type LayoutChangeEvent, Dimensions,
} from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useInteractions } from '../context/InteractionsContext';
import { requireAuth } from '../utils/requireAuth';
import { fetchVideoFeed } from '../services/newsService';
import type { VideoItem } from '../types/video';
import type { RootStackParamList } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Module-level so FlatList sees the same object on every render (it does not support changing it).
const VIEWABILITY = { itemVisiblePercentThreshold: 70 };
type Tab = 'trending' | 'live';

/**
 * Runs inside the YouTube page that react-native-youtube-iframe loads.
 * 1. The library posts play/pause/mute to `window`, but react-native-webview on Android delivers
 *    messages to `document`, so every command was silently dropped (mute and autoplay never worked).
 *    Forward them across.
 * 2. The page pins the player to a 16:9 box; let it fill the whole view instead, so a portrait
 *    view shows a Short edge to edge.
 */
const YT_INJECTED_JS = `
(function () {
  if (window.__rnBridge) return;
  window.__rnBridge = true;
  document.addEventListener('message', function (e) {
    window.dispatchEvent(new MessageEvent('message', { data: e.data }));
  });
  var s = document.createElement('style');
  s.textContent = 'html,body{height:100%;overflow:hidden;background:#000}' +
    '.container{height:100% !important;padding-bottom:0 !important}';
  document.head.appendChild(s);
})();
true;
`;
const YT_WEBVIEW_PROPS = { injectedJavaScript: YT_INJECTED_JS };
const YT_PARAMS = { loop: true, controls: false, modestbranding: true, rel: false };

function youtubeIdOf(url?: string): string | null {
  const match = url?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

/** YouTube serves /shorts/<id> only for real Shorts; anything else redirects to /watch. */
const shortsCache = new Map<string, boolean>();
function useIsShort(ytId: string | null, enabled: boolean): boolean | null {
  const [isShort, setIsShort] = useState<boolean | null>(ytId ? shortsCache.get(ytId) ?? null : null);
  useEffect(() => {
    if (!ytId || !enabled || isShort !== null) return;
    let cancelled = false;
    // If the check is slow, assume widescreen rather than leave the page empty.
    const timer = setTimeout(() => { if (!cancelled) setIsShort(false); }, 2500);
    fetch(`https://www.youtube.com/shorts/${ytId}`, { method: 'HEAD' })
      .then(res => {
        const short = res.url.includes('/shorts/');
        shortsCache.set(ytId, short);
        if (!cancelled) setIsShort(short);
      })
      .catch(() => { if (!cancelled) setIsShort(false); })
      .finally(() => clearTimeout(timer));
    return () => { cancelled = true; clearTimeout(timer); };
  }, [ytId, enabled, isShort]);
  return isShort;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Round, dark-backed button so it stays visible over any picture. */
function RailButton({ icon, label, active, onPress, accessibilityLabel }: {
  icon: keyof typeof MaterialIcons.glyphMap; label?: string; active?: boolean; onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.railBtn}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.railIconWrap, active && styles.railIconActive]}>
        <MaterialIcons name={icon} size={26} color="#fff" />
      </View>
      {label !== undefined ? <Text style={[styles.railLabel, styles.shadow]}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

function VideoPage({ item, height, active, muted, onToggleMute }: {
  item: VideoItem; height: number; active: boolean; muted: boolean; onToggleMute: () => void;
}) {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hydrateVideoInteractions, isReposted, getRepostCount, toggleRepost } = useInteractions();
  const videoRef = useRef<Video>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);

  const direct = item.videoUrl;
  const ytId = direct ? null : youtubeIdOf(item.sourceUrl);
  const isShort = useIsShort(ytId, active);

  useEffect(() => { hydrateVideoInteractions(item); }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!active) { setPaused(false); setProgress(0); } }, [active]);

  const reposted = isReposted(item.id) ?? item.isReposted ?? false;
  const repostCount = getRepostCount(item.id) ?? item.repostsCount ?? 0;

  const wantPlay = active && !paused;

  /** Push play / mute straight to the direct-file player. expo-av does not reliably pick up prop
   * changes after mount on Android, so scroll-to-play and mute go through imperative calls. */
  const applyPlayback = useCallback(() => {
    videoRef.current
      ?.setStatusAsync({ shouldPlay: wantPlay, isMuted: muted, volume: muted ? 0 : 1 })
      .catch(() => {}); // not loaded yet: onLoad applies it
  }, [wantPlay, muted]);

  useEffect(() => { applyPlayback(); }, [applyPlayback]);
  // A page that scrolls off restarts from the beginning next time it is reached.
  useEffect(() => { if (!active) videoRef.current?.setPositionAsync(0).catch(() => {}); }, [active]);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.durationMillis) setProgress(status.positionMillis / status.durationMillis);
    // Self-heal if the player ever drifts from what the screen wants.
    if (status.isMuted !== muted || status.shouldPlay !== wantPlay) applyPlayback();
  };

  const share = () => {
    void Share.share({ message: item.sourceUrl ? `${item.title}\n${item.sourceUrl}` : item.title });
  };

  // Widescreen clips are scaled so the picture fills the full height and the sides are cropped,
  // like TikTok / Shorts. Portrait Shorts already fit the screen exactly.
  const wideW = (height * 16) / 9;

  return (
    <View style={{ height, width: '100%', backgroundColor: '#000' }}>
      {/* Poster shown until the player has loaded */}
      {item.imgUrl ? (
        <Image source={{ uri: item.imgUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : null}

      {/* Player, edge to edge */}
      <View style={StyleSheet.absoluteFill}>
        {direct && !failed ? (
          <Video
            ref={videoRef}
            source={{ uri: direct }}
            style={{ width: SCREEN_WIDTH, height }}
            videoStyle={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={wantPlay}
            isLooping
            isMuted={muted}
            volume={muted ? 0 : 1}
            onLoad={applyPlayback}
            onPlaybackStatusUpdate={onStatus}
            onError={() => setFailed(true)}
            posterSource={item.imgUrl ? { uri: item.imgUrl } : undefined}
            usePoster
          />
        ) : ytId ? (
          active && isShort !== null ? (
            <View
              style={
                isShort
                  ? { width: SCREEN_WIDTH, height }
                  : { position: 'absolute', top: 0, height, width: wideW, left: (SCREEN_WIDTH - wideW) / 2 }
              }
            >
              <YoutubePlayer
                height={height}
                width={isShort ? SCREEN_WIDTH : wideW}
                videoId={ytId}
                // No autoplay: the video waits on YouTube's own play button and starts when tapped.
                play={false}
                mute={muted}
                initialPlayerParams={YT_PARAMS}
                webViewProps={YT_WEBVIEW_PROPS}
              />
            </View>
          ) : active ? (
            <View style={styles.center}><ActivityIndicator color="#fff" /></View>
          ) : null
        ) : (
          <View style={styles.noPlayer}>
            {item.sourceUrl ? (
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => void Linking.openURL(item.sourceUrl!)}
                accessibilityLabel="Play video"
              >
                <MaterialIcons name="play-arrow" size={44} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {/* Direct video files have no controls of their own, so tap to pause/resume. YouTube videos
          keep YouTube's play button and must receive the taps themselves, so no layer sits on them. */}
      {direct && !failed ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setPaused(p => !p)}
          accessibilityLabel={paused ? 'Play video' : 'Pause video'}
        />
      ) : null}

      {direct && !failed && paused ? (
        <View style={styles.pauseOverlay} pointerEvents="none">
          <MaterialIcons name="play-arrow" size={84} color="rgba(255,255,255,0.85)" />
        </View>
      ) : null}

      {/* Over a YouTube video the WebView takes the touches, so leave two transparent strips that
          pass vertical swipes to the pager: the left edge and the caption area. */}
      {ytId ? (
        <>
          <View style={styles.swipeLeft} />
          <View style={styles.swipeBottom} />
        </>
      ) : null}

      {/* Caption: a small scrim along the bottom keeps the text readable over any picture */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
        style={styles.scrim}
        pointerEvents="none"
      />
      <View style={styles.caption} pointerEvents="none">
        {item.isLive ? (
          <View style={[styles.livePill, { alignSelf: 'flex-start', marginBottom: 8 }]}>
            <Text style={styles.livePillText}>{item.liveText || 'LIVE'}</Text>
          </View>
        ) : null}
        <Text style={[styles.title, styles.shadow]} numberOfLines={2}>{item.title}</Text>
        {item.description ? (
          <Text style={[styles.desc, styles.shadow]} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <Text style={[styles.date, styles.shadow]}>{item.date}</Text>
      </View>

      {/* Right action rail: repost, share, sound */}
      <View style={styles.rail}>
        <RailButton
          icon="repeat"
          label={formatCount(repostCount)}
          active={reposted}
          accessibilityLabel={reposted ? 'Remove repost' : 'Repost'}
          onPress={() => requireAuth(user, navigation, () => toggleRepost(item.id, reposted))}
        />
        <RailButton icon="share" label="Share" accessibilityLabel="Share video" onPress={share} />
        {direct || ytId ? (
          <RailButton
            icon={muted ? 'volume-off' : 'volume-up'}
            label={muted ? 'Muted' : 'Sound'}
            active={muted}
            accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            onPress={onToggleMute}
          />
        ) : null}
      </View>

      {direct ? (
        <View style={styles.progressTrack} pointerEvents="none">
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

/** TikTok-style Videos tab: full-screen vertical pager, one video at a time,
 * autoplay on the visible page, action rail on the right, caption bottom-left. */
export default function VideoFeedScreen() {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [feed, setFeed] = useState<{ trending: VideoItem[]; live: VideoItem[] }>({ trending: [], live: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('trending');
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [muted, setMuted] = useState(false);
  const listRef = useRef<FlatList<VideoItem>>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFeed(await fetchVideoFeed());
    } catch {
      setFeed({ trending: [], live: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const hasLive = feed.live.length > 0;
  const data = tab === 'live' && hasLive ? feed.live : feed.trending;

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first && typeof first.index === 'number') setActiveIndex(first.index);
  }).current;

  const switchTab = (next: Tab) => {
    setTab(next);
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const onLayout = (e: LayoutChangeEvent) => setPageHeight(e.nativeEvent.layout.height);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <StatusBar barStyle="light-content" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="video-library" size={56} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyText}>No videos yet</Text>
          <TouchableOpacity style={[styles.retry, { backgroundColor: colors.primary }]} onPress={() => void load()}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : pageHeight > 0 ? (
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={item => item.id}
          pagingEnabled
          snapToInterval={pageHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={VIEWABILITY}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          removeClippedSubviews
          renderItem={({ item, index }) => (
            <VideoPage
              item={item}
              height={pageHeight}
              active={isFocused && index === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted(m => !m)}
            />
          )}
        />
      ) : null}

      {/* Top tabs overlay */}
      <View style={[styles.topTabs, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        {(['trending', 'live'] as const).map(t => {
          const disabled = t === 'live' && !hasLive;
          const selected = tab === t;
          return (
            <TouchableOpacity key={t} onPress={() => !disabled && switchTab(t)} disabled={disabled} style={styles.topTab}>
              <Text style={[styles.topTabText, styles.shadow, { opacity: selected ? 1 : disabled ? 0.25 : 0.6 }]}>
                {t === 'trending' ? 'For You' : 'Live'}
              </Text>
              {selected ? <View style={styles.topTabUnderline} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyText: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '700' },
  retry: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999 },
  retryText: { color: '#fff', fontWeight: '800' },
  pauseOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  noPlayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    position: 'absolute', width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
  },
  topTabs: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 28,
  },
  topTab: { alignItems: 'center', paddingVertical: 6 },
  topTabText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  topTabUnderline: { marginTop: 4, width: 26, height: 3, borderRadius: 2, backgroundColor: '#fff' },
  rail: { position: 'absolute', right: 10, bottom: 56, alignItems: 'center', gap: 16 },
  railBtn: { alignItems: 'center' },
  railIconWrap: {
    width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  railIconActive: { backgroundColor: '#FF3B5C', borderColor: '#FF3B5C' },
  railLabel: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 4 },
  swipeLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 36 },
  swipeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 190 },
  caption: { position: 'absolute', left: 14, right: 84, bottom: 22 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  desc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  date: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6, fontWeight: '600' },
  livePill: { backgroundColor: '#FF3B5C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  livePillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressFill: { height: 3, backgroundColor: '#fff' },
  shadow: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
