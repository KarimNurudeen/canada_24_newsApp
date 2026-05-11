import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Dimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type VideoPlayerRouteProp = RouteProp<RootStackParamList, 'VideoPlayer'>;

const SAMPLE_VIDEOS: Record<string, string> = {
  default: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  news:    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  live:    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
};

const { width } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute<VideoPlayerRouteProp>();
  const { item } = route.params;
  const sourceUrl = item.sourceUrl;
  const { colors } = useApp();
  const videoRef = useRef<Video>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const hasDirectVideo = Boolean(item.videoUrl);

  const videoUrl = item.videoUrl || SAMPLE_VIDEOS[item.isLive ? 'live' : 'news'];

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
      {!error && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* Info panel */}
      <View style={[styles.infoPanel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoTitle, { color: colors.primaryText }]} numberOfLines={2}>
          {item.title}
        </Text>
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

        {!hasDirectVideo ? (
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

        {/* Controls row */}
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
  infoTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    lineHeight: 24,
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
