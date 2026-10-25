import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { Radius } from '../theme';
import { useApp } from '../context/AppContext';
import { NAV_CATEGORIES } from '../config/nav';
import { fetchVideoFeed } from '../services/newsService';
import type { VideoItem } from '../types/video';

const CARD_WIDTH = 260;
const IMAGE_HEIGHT = 150;

interface Props {
  /** First story image per category label, fetched by the Home screen. */
  images: Record<string, string | undefined>;
  onOpenCategory: (section: string) => void;
  onOpenVideos: () => void;
}

/** Home category cards (mirrors the web landing page): one card per category,
 * in nav order, then Video — whose card plays a muted looping preview. */
export default function CategoryCards({ images, onOpenCategory, onOpenVideos }: Props) {
  const { colors } = useApp();
  const [videoThumb, setVideoThumb] = useState<string | undefined>();
  const [previewVideo, setPreviewVideo] = useState<VideoItem | undefined>();

  useEffect(() => {
    let cancelled = false;
    fetchVideoFeed()
      .then(feed => {
        if (cancelled) return;
        setVideoThumb(feed.trending.find(v => v.imgUrl)?.imgUrl);
        setPreviewVideo(feed.trending.find(v => v.videoUrl));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const cards = [
    ...NAV_CATEGORIES.map(c => ({
      key: c.label, title: c.label, description: c.description, color: c.color,
      image: images[c.label], onPress: () => onOpenCategory(c.section), isVideo: false,
    })),
    {
      key: 'Video', title: 'Video', description: 'Watch the latest news videos and live coverage.',
      color: colors.primary, image: videoThumb, onPress: onOpenVideos, isVideo: true,
    },
  ];

  return (
    <View style={{ paddingTop: 8 }}>
      <Text style={[styles.heading, { color: colors.primaryText }]}>Explore Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {cards.map(card => (
          <TouchableOpacity
            key={card.key}
            activeOpacity={0.85}
            onPress={card.onPress}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            accessibilityRole="button"
            accessibilityLabel={`${card.title} — view stories`}
          >
            <View style={[styles.imageWrap, { backgroundColor: card.color }]}>
              {card.isVideo && previewVideo?.videoUrl ? (
                <Video
                  source={{ uri: previewVideo.videoUrl }}
                  posterSource={card.image ? { uri: card.image } : undefined}
                  usePoster
                  shouldPlay
                  isLooping
                  isMuted
                  resizeMode={ResizeMode.COVER}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
              ) : card.image ? (
                <Image source={{ uri: card.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : null}
              {card.isVideo ? (
                <View style={styles.watchBadge}>
                  <MaterialIcons name="play-arrow" size={14} color="#fff" />
                  <Text style={styles.watchText}>WATCH</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.body}>
              <Text style={[styles.title, { color: colors.primaryText }]}>{card.title}</Text>
              <View style={[styles.rule, { backgroundColor: card.color }]} />
              <Text style={[styles.desc, { color: colors.secondaryText }]} numberOfLines={3}>{card.description}</Text>
              <View style={[styles.button, { backgroundColor: '#0b1a3a' }]}>
                <Text style={styles.buttonText}>View stories</Text>
                <MaterialIcons name="chevron-right" size={18} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: '800', paddingHorizontal: 20, paddingBottom: 12 },
  row: { paddingHorizontal: 20, gap: 14 },
  card: { width: CARD_WIDTH, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
  imageWrap: { height: IMAGE_HEIGHT, width: '100%' },
  watchBadge: {
    position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, gap: 2,
  },
  watchText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  body: { padding: 16 },
  title: { fontSize: 19, fontWeight: '800' },
  rule: { width: 34, height: 3, marginTop: 8, marginBottom: 10 },
  desc: { fontSize: 13, fontWeight: '500', lineHeight: 19, minHeight: 57 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'flex-start',
    gap: 14, paddingLeft: 16, paddingRight: 10, paddingVertical: 10, marginTop: 14,
  },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
