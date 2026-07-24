import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Dimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp, type NavigationProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useInteractions } from '../context/InteractionsContext';
import { requireAuth } from '../utils/requireAuth';
import type { RootStackParamList } from '../navigation/types';

type VideoPlayerRouteProp = RouteProp<RootStackParamList, 'VideoPlayer'>;

const SAMPLE_VIDEOS: Record<string, string> = {
  default: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  news:    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  live:    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
};

const { width } = Dimensions.get('window');

// The backend never sets a direct playable video_url for YouTube/TikTok-sourced
// videos (there isn't one to give — YouTube/TikTok don't expose raw file URLs).
// Those only ever carry a source_url pointing at the watch/share page, which a
// native <Video> player can't open. YouTube goes through react-native-youtube-iframe
// (a raw WebView iframe embed renders a blank/black box — Google's embedded player
// silently refuses to paint without the IFrame Player API handshake this library
// does for you); TikTok, lacking an equivalent RN library, uses a plain WebView
// embed. Direct file uploads (NewsVideo) keep using the native <Video> player.
function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

function extractTikTokVideoId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return match ? match[1] : null;
}

export default function VideoPlayerScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<VideoPlayerRouteProp>();
  const { item } = route.params;
  const sourceUrl = item.sourceUrl;
  const { colors } = useApp();
  const { user } = useAuth();
  const { hydrateVideoInteractions, isReposted, getRepostCount, toggleRepost } = useInteractions();
  const videoRef = useRef<Video>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const hasDirectVideo = Boolean(item.videoUrl);

  const youtubeId = hasDirectVideo ? null : extractYouTubeId(sourceUrl);
  const tiktokId = hasDirectVideo ? null : extractTikTokVideoId(sourceUrl);
  const tiktokEmbedUrl = tiktokId ? `https://www.tiktok.com/embed/v2/${tiktokId}` : null;
  const usesYoutube = Boolean(youtubeId);
  const usesTikTok = Boolean(tiktokEmbedUrl);
  const usesEmbed = usesYoutube || usesTikTok;
  const [ytPlaying, setYtPlaying] = useState(true);

  const videoUrl = item.videoUrl || SAMPLE_VIDEOS[item.isLive ? 'live' : 'news'];

  useEffect(() => {
    hydrateVideoInteractions(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const reposted = isReposted(item.id) ?? item.isReposted ?? false;
  const repostCount = getRepostCount(item.id) ?? item.repostsCount ?? 0;

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const durationMs = status?.isLoaded ? (status.durationMillis ?? 0) : 0;
  const positionMs = status?.isLoaded ? (status.positionMillis ?? 0) : 0;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        {item.isLive && (
          <View style={styles.livePill}>
            <Text style={styles.livePillText}>{item.liveText ?? 'LIVE'}</Text>
          </View>
        )}
      </View>

      {/* Video player */}
      <View style={styles.videoWrapper}>
        {loading && !error && (
          <ActivityIndicator size="large" color="#1976D2" style={StyleSheet.absoluteFillObject} />
        )}
        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={48} color="#1976D2" />
            <Text style={styles.errorText}>Unable to load video.{'\n'}Check your connection and try again.</Text>
          </View>
        ) : usesYoutube ? (
          <YoutubePlayer
            height={width * 0.5625}
            width={width}
            videoId={youtubeId!}
            play={ytPlaying}
            onChangeState={(state: string) => {
              if (state === 'playing' || state === 'video_cued') setLoading(false);
            }}
            onError={() => { setLoading(false); setError(true); }}
          />
        ) : usesTikTok ? (
          <WebView
            source={{ uri: tiktokEmbedUrl! }}
            style={styles.video}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            onHttpError={() => { setLoading(false); setError(true); }}
          />
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            onPlaybackStatusUpdate={(s) => {
              setStatus(s);
              if (s.isLoaded) setLoading(false);
            }}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}
      </View>

      {/* Progress bar (when not using native controls) */}
      {!error && !usesEmbed && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* Info panel */}
      <View style={[styles.infoPanel, { backgroundColor: colors.surface }]}>
        <View style={styles.infoTitleRow}>
          <Text style={[styles.infoTitle, { color: colors.primaryText, flex: 1 }]} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.repostBtn}
            onPress={() => requireAuth(user, navigation, () => toggleRepost(item.id, reposted))}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="repeat" size={20} color={reposted ? '#2E7D32' : colors.primaryText} />
            <Text style={[styles.repostCount, { color: reposted ? '#2E7D32' : colors.primaryText }]}>{repostCount}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoMeta}>
          <Text style={[styles.infoDate, { color: colors.primary }]}>{item.date}</Text>
          {item.duration && (
            <Text style={[styles.infoDuration, { color: colors.primaryText }]}>
              {formatTime(positionMs)} / {item.duration}
            </Text>
          )}
        </View>

        {item.description ? (
          <Text style={[styles.infoDescription, { color: colors.primaryText }]}>
            {item.description}
          </Text>
        ) : null}

        {!hasDirectVideo && !usesEmbed ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              Demo playback only. This story does not have a real video stream URL configured yet.
            </Text>
            {sourceUrl ? (
              <TouchableOpacity onPress={() => void Linking.openURL(sourceUrl)}>
                <Text style={[styles.sourceLink, { color: colors.primary }]}>Open source story</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Controls row — the embedded YouTube/TikTok player has its own controls */}
        {!usesEmbed && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (isPlaying) {
                videoRef.current?.pauseAsync();
              } else {
                videoRef.current?.playAsync();
              }
              setPaused(!paused);
            }}
          >
            <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primaryText }]}
            onPress={() => videoRef.current?.setPositionAsync(0)}
          >
            <MaterialIcons name="replay" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primaryText }]}
            onPress={() => videoRef.current?.setPositionAsync(Math.max(0, positionMs - 15000))}
          >
            <MaterialIcons name="replay-10" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primaryText }]}
            onPress={() => videoRef.current?.setPositionAsync(positionMs + 15000)}
          >
            <MaterialIcons name="forward-10" size={24} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  livePill: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  livePillText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  videoWrapper: {
    width,
    height: width * 0.5625,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: '100%' },
  errorBox: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 21,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976D2',
  },
  infoPanel: {
    flex: 1,
    padding: 20,
    gap: 8,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    lineHeight: 24,
  },
  repostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  repostCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoDate: { fontSize: 12, fontWeight: '700' },
  infoDuration: { fontSize: 12, fontWeight: '700', opacity: 0.6 },
  infoDescription: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.82,
  },
  noticeBox: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'rgba(25,118,210,0.12)',
    gap: 8,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#e6eef8',
  },
  sourceLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  controlBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
