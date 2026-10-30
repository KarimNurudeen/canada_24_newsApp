import React, { useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface Props {
  /** Fixed width of every child; drives snapping and the page dots. */
  itemWidth: number;
  gap?: number;
  /** Left/right inset of the row. */
  padding?: number;
  /** 'dark' when the row sits on a navy surface. */
  tone?: 'light' | 'dark';
  children: React.ReactNode;
}

/** A snapping horizontal row that says it scrolls: a floating arrow on the side
 * that still has more (tap to advance), and page dots underneath. Swipe works as
 * usual — the cues are there for people who would not think to try. */
export default function HorizontalScroller({ itemWidth, gap = 12, padding = 20, tone = 'light', children }: Props) {
  const { colors } = useApp();
  const items = React.Children.toArray(children);
  const ref = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const step = itemWidth + gap;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const i = Math.min(items.length - 1, Math.max(0, Math.round(contentOffset.x / step)));
    setIndex(i);
    setAtStart(contentOffset.x < 8);
    setAtEnd(contentOffset.x + layoutMeasurement.width >= contentSize.width - 8);
  };

  const go = (dir: 1 | -1) => ref.current?.scrollTo({ x: Math.max(0, (index + dir) * step), animated: true });

  const activeDot = atEnd ? items.length - 1 : index;
  const dotIdle = tone === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(128,128,128,0.35)';
  const dotOn = tone === 'dark' ? '#fff' : colors.primary;

  return (
    <View>
      <View>
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={step}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={32}
          contentContainerStyle={{ paddingHorizontal: padding, gap, alignItems: 'center' }}
        >
          {children}
        </ScrollView>
        {!atStart ? (
          <TouchableOpacity
            onPress={() => go(-1)}
            style={[styles.arrow, { left: 6 }]}
            accessibilityLabel="Previous"
            activeOpacity={0.85}
          >
            <MaterialIcons name="chevron-left" size={24} color="#0b1a3a" />
          </TouchableOpacity>
        ) : null}
        {!atEnd ? (
          <TouchableOpacity
            onPress={() => go(1)}
            style={[styles.arrow, { right: 6 }]}
            accessibilityLabel="Next"
            activeOpacity={0.85}
          >
            <MaterialIcons name="chevron-right" size={24} color="#0b1a3a" />
          </TouchableOpacity>
        ) : null}
      </View>
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === activeDot ? dotOn : dotIdle }, i === activeDot && styles.dotOn]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 6,
  },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { width: 18 },
});
