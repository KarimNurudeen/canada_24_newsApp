import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator,
  Share, Linking, StatusBar, type ViewToken, type LayoutChangeEvent, Dimensions,
} from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
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
type Tab = 'trending' | 'live';

function youtubeIdOf(url?: string): string | null {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function RailButton({ icon, label, active, onPress }: {
  icon: keyof typeof MaterialIcons.glyphMap; label?: string; active?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.railBtn} activeOpacity={0.8}>
      <View style={styles.railIconWrap}>
        <MaterialIcons name={icon} size={30} color={active ? '#FF3B5C' : '#fff'} style={styles.shadow} />
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

  useEffect(() => { hydrateVideoInteractions(item); }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!active) { setPaused(false); setProgress(0); } }, [active]);

  const reposted = isReposted(item.id) ?? item.isReposted ?? false;
  const repostCount = getRepostCount(item.id) ?? item.repostsCount ?? 0;

  const onStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis) setProgress(status.positionMillis / status.durationMillis);
  };

  const share = () => {
    void Share.share({ message: item.sourceUrl ? `${item.title}\n${item.sourceUrl}` : item.title });
  };

  return (
    <View style={{ height, width: '100%', backgroundColor: '#000' }}>
      {/* Blurred backdrop so non-vertical video still fills the screen */}
      {item.imgUrl ? (
        <Image source={{ uri: item.imgUrl }} style={StyleSheet.absoluteFillObject} blurRadius={30} resizeMode="cover" />
      ) : null}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />

      {/* Player */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.playerArea}
        onPress={() => direct && setPaused(p => !p)}
      >
        {direct && !failed ? (
          <Video
            ref={videoRef}
            source={{ uri: direct }}
            style={{ width: SCREEN_WIDTH, height }}
            videoStyle={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={active && !paused}
            isLooping
            isMuted={muted}
            onPlaybackStatusUpdate={onStatus}
            onError={() => setFailed(true)}
            posterSource={item.imgUrl ? { uri: item.imgUrl } : undefined}
            usePoster
          />
        ) : ytId ? (
          active ? (
            <YoutubePlayer
              height={(SCREEN_WIDTH * 9) / 16}
              width={SCREEN_WIDTH}
              videoId={ytId}
              play={!paused}
              mute={muted}
              initialPlayerParams={{ loop: true, controls: false, modestbranding: true, rel: false }}
            />
          ) : item.imgUrl ? (
            <Image source={{ uri: item.imgUrl }} style={{ width: SCREEN_WIDTH, height: (SCREEN_WIDTH * 9) / 16 }} resizeMode="cover" />
          ) : null
        ) : (
          <View style={styles.noPlayer}>
            {item.imgUrl ? <Image source={{ uri: item.imgUrl }} style={styles.fill} resizeMode="contain" /> : null}
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

        {direct && paused ? (
          <View style={styles.pauseOverlay} pointerEvents="none">
            <MaterialIcons name="play-arrow" size={84} color="rgba(255,255,255,0.85)" />
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Right action rail */}
      <View style={styles.rail}>
        <RailButton
          icon="repeat"
          label={formatCount(repostCount)}
          active={reposted}
          onPress={() => requireAuth(user, navigation, () => toggleRepost(item.id, reposted))}
        />
        <RailButton icon="share" label="Share" onPress={share} />
        {direct || ytId ? (
          <RailButton icon={muted ? 'volume-off' : 'volume-up'} onPress={onToggleMute} />
        ) : null}
      </View>

      {/* Bottom caption */}
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
          viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
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
  fill: { width: '100%', height: '100%' },
  playerArea: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
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
  rail: { position: 'absolute', right: 10, bottom: 70, alignItems: 'center', gap: 18 },
  railBtn: { alignItems: 'center' },
  railIconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  railLabel: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: -2 },
  caption: { position: 'absolute', left: 14, right: 84, bottom: 26 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  desc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  date: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6, fontWeight: '600' },
  livePill: { backgroundColor: '#FF3B5C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  livePillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressFill: { height: 3, backgroundColor: '#fff' },
  shadow: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
