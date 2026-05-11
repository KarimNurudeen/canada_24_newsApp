import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';
import { fetchVideoFeed } from '../services/newsService';
import type { VideoFeed, VideoItem } from '../types/video';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 200;

function VideoCard({ item, colors }: { item: VideoItem; colors: ReturnType<typeof useApp>['colors'] }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      style={[styles.videoCard, { marginRight: 12 }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('VideoPlayer', { item })}
    >
      <View style={styles.videoThumbContainer}>
        {item.imgUrl ? (
          <>
            <Image source={{ uri: item.imgUrl }} style={styles.videoThumb} resizeMode="cover" />
            <View style={styles.videoOverlay} />
          </>
        ) : (
          <View style={styles.videoPlaceholder}>
            <MaterialIcons name="video-library" size={34} color="rgba(255,255,255,0.9)" />
            <Text style={styles.videoPlaceholderText}>Admin Upload</Text>
          </View>
        )}

        {/* Play button */}
        <View style={styles.playCircle}>
          <MaterialIcons name="play-circle-outline" size={40} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Live / Coming Up badge */}
        {item.isLive && (
          <View style={[styles.liveBadge, item.liveText === 'COMING UP' && styles.comingUpBadge]}>
            <Text style={styles.liveBadgeText}>{item.liveText || 'LIVE'}</Text>
          </View>
        )}

        {/* Duration */}
        {item.showDuration && item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.videoTitle, { color: colors.primaryText }]} numberOfLines={2}>
        {item.title}
      </Text>
      {item.description ? (
        <Text style={[styles.videoDescription, { color: colors.primaryText }]} numberOfLines={3}>
          {item.description}
        </Text>
      ) : null}
      <Text style={[styles.videoDate, { color: colors.primary }]}>{item.date}</Text>
    </TouchableOpacity>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  linkText?: string;
  colors: ReturnType<typeof useApp>['colors'];
}

function SectionHeader({ title, subtitle, linkText, colors }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.primaryText }]}>{subtitle}</Text>
      </View>
      {linkText ? (
        <TouchableOpacity>
          <Text style={[styles.sectionLink, { color: colors.primary }]}>{linkText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function VideoFeedScreen() {
  const { colors } = useApp();
  const [videoFeed, setVideoFeed] = useState<VideoFeed>({ trending: [], live: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVideoFeed = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchVideoFeed();
      setVideoFeed(payload);
    } catch {
      setVideoFeed({ trending: [], live: [] });
      setError('Unable to load video stories right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVideoFeed();
  }, []);

  const hasTrending = videoFeed.trending.length > 0;
  const hasLive = videoFeed.live.length > 0;
  const hasAnyVideos = hasTrending || hasLive;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 32 }}>
      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.primaryText }]}>Loading video stories...</Text>
        </View>
      ) : null}

      {!loading && !hasAnyVideos ? (
        <View style={styles.stateContainer}>
          <Text style={[styles.stateText, { color: colors.primaryText }]}>
            {error ?? 'No admin-uploaded videos are available yet.'}
          </Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => void loadVideoFeed()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && hasTrending ? (
        <>
          <SectionHeader
            title="Trending Video"
            subtitle="Uploaded locally from Django admin"
            colors={colors}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
          >
            {videoFeed.trending.map(item => <VideoCard key={item.id} item={item} colors={colors} />)}
          </ScrollView>
        </>
      ) : null}

      {!loading && hasTrending && hasLive ? (
        <View style={[styles.divider, { backgroundColor: colors.secondary }]} />
      ) : null}

      {!loading && hasLive ? (
        <>
          <SectionHeader
            title="Live Coverage"
            subtitle="Stories currently flagged as live by the backend feed"
            colors={colors}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
          >
            {videoFeed.live.map(item => <VideoCard key={item.id} item={item} colors={colors} />)}
          </ScrollView>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  sectionSubtitle: { fontSize: 13, fontWeight: '700', opacity: 0.6 },
  sectionLink: { fontSize: 12, fontWeight: '700' },
  videoCard: { width: CARD_WIDTH },
  videoThumbContainer: { height: 130, position: 'relative', marginBottom: 8 },
  videoThumb: { width: '100%', height: '100%' },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0b1f33',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  playCircle: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 8, left: 8,
    backgroundColor: '#1976D2',
    paddingHorizontal: 6, paddingVertical: 2,
  },
  comingUpBadge: {
    backgroundColor: '#1a1a1a',
  },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  durationBadge: {
    position: 'absolute',
    bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6, paddingVertical: 2,
  },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  videoTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  videoDescription: {
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.75,
    marginTop: 4,
  },
  videoDate: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  divider: { height: 2, marginHorizontal: 0, marginVertical: 16 },
  stateContainer: {
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
