import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import HorizontalScroller from './HorizontalScroller';
import { MaterialIcons } from '@expo/vector-icons';
import { Radius } from '../theme';
import { useApp } from '../context/AppContext';
import { fetchVideoFeed } from '../services/newsService';
import type { VideoItem } from '../types/video';

/** "Latest Videos" strip from the web home page; live items lead. Tapping goes to the Watch tab. */
export default function LatestVideosStrip({ onOpenVideos }: { onOpenVideos: () => void }) {
  const { colors } = useApp();
  const [videos, setVideos] = useState<VideoItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchVideoFeed()
      .then(feed => { if (!cancelled) setVideos([...feed.live, ...feed.trending].slice(0, 6)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (videos.length === 0) return null;

  return (
    <View style={{ paddingTop: 26 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primaryText }]}>Latest Videos</Text>
        <TouchableOpacity onPress={onOpenVideos} style={styles.live}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.liveText, { color: colors.primary }]}>LIVE 24/7</Text>
        </TouchableOpacity>
      </View>
      <HorizontalScroller itemWidth={220} gap={12} padding={20}>
        {videos.map(video => (
          <TouchableOpacity key={video.id} activeOpacity={0.88} onPress={onOpenVideos} style={styles.card}>
            {video.imgUrl ? <Image source={{ uri: video.imgUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
            <View style={styles.shade} />
            <View style={styles.play}><MaterialIcons name="play-arrow" size={26} color="#fff" /></View>
            {video.isLive ? (
              <View style={[styles.liveBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.liveBadgeText}>{video.liveText || 'LIVE'}</Text>
              </View>
            ) : null}
            {video.showDuration && video.duration ? (
              <View style={styles.duration}><Text style={styles.durationText}>{video.duration}</Text></View>
            ) : null}
            <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
          </TouchableOpacity>
        ))}
      </HorizontalScroller>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 12, fontWeight: '800' },
  card: { width: 220, height: 124, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: '#1C1C1C' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  play: { position: 'absolute', top: '50%', left: '50%', marginLeft: -22, marginTop: -26, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  liveBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  liveBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  duration: { position: 'absolute', right: 8, top: 8, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  videoTitle: { position: 'absolute', left: 10, right: 10, bottom: 8, color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 16 },
});
