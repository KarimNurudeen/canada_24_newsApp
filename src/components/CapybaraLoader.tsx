import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Capybara-on-a-treadmill launch loader, ported from the CSS/styled-components
 * original to React Native. Every size is in "em" units: `U` px = 1em, and the
 * original's `transform: scale(0.75)` is baked in (16 * 0.75 = 12).
 */
const U = 12;
const COLOR = 'rgb(204, 125, 45)';
const COLOR2 = 'rgb(83, 56, 28)';

const px = (em: number) => em * U;

/** One looping 0→1 value driven natively. */
function useLoop(duration: number, delayMs = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    value.setValue(0);
    const run = () =>
      Animated.loop(
        Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      ).start();
    if (delayMs > 0) {
      const t = setTimeout(run, delayMs);
      return () => { clearTimeout(t); value.stopAnimation(); };
    }
    run();
    return () => value.stopAnimation();
  }, [value, duration, delayMs]);
  return value;
}

export default function CapybaraLoader() {
  const body = useLoop(1000);
  const legA = useLoop(1000);
  const legB = useLoop(1000, 75);
  const line = useLoop(10000);

  // movebody: translateX 0% → 2% → 0%
  const bodyShift = (width: number) =>
    body.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, width * 0.02, 0] });
  const bodyStyle = (width: number) => ({ transform: [{ translateX: bodyShift(width) }] });

  // moveleg: rotate -45° ↔ 45° with a small slide
  const legRotate = legA.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-45deg', '45deg', '-45deg'] });
  const legSlide = legA.interpolate({ inputRange: [0, 0.5, 1], outputRange: [px(-1.75 * 0.05), px(1.75 * 0.05), px(-1.75 * 0.05)] });
  // moveleg2: rotate 45° ↔ -45°
  const leg2Rotate = legB.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['45deg', '-45deg', '45deg'] });

  // moveline: slide left 70% of its width, fading in at 5% and out at 95%
  const lineX = line.interpolate({ inputRange: [0, 1], outputRange: [0, px(-50 * 0.7)] });
  const lineOpacity = line.interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Loading Canada247">
      <View style={styles.capybaraLoader}>
        <View style={styles.capybara}>
          {/* Head (drawn in front); the dark offset behind it is the original's box-shadow */}
          <Animated.View style={[styles.headWrap, bodyStyle(px(7.5))]}>
            <View style={styles.headShadow} />
            <View style={styles.head}>
              {/* Ears */}
              <LinearGradient colors={[COLOR2, COLOR]} locations={[0, 0.9]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.ear}>
                <View style={styles.earInner} />
              </LinearGradient>
              <LinearGradient colors={[COLOR2, COLOR]} locations={[0, 0.9]} start={{ x: 0.2, y: 1 }} end={{ x: 0.8, y: 0 }} style={[styles.ear, { left: px(5) }]} />
              {/* Mouth */}
              <View style={styles.mouth}>
                <View style={[styles.lips, { transform: [{ rotate: '-45deg' }] }]} />
                <View style={[styles.lips, { transform: [{ rotate: '45deg' }] }]} />
              </View>
              {/* Eyes */}
              <View style={[styles.eye, { transform: [{ rotate: '45deg' }] }]} />
              <View style={[styles.eye, { left: px(5.5), width: px(1.75), transform: [{ rotate: '-45deg' }] }]} />
            </View>
          </Animated.View>

          {/* Back leg block */}
          <Animated.View style={[styles.legBlock, bodyStyle(px(6))]}>
            <LinearGradient colors={[COLOR, COLOR2]} locations={[0.95, 1]} style={StyleSheet.absoluteFill} />
          </Animated.View>

          {/* Legs */}
          <Animated.View
            style={[styles.leg2, { width: px(1.25), left: px(0.5), height: px(2), transform: [{ rotate: leg2Rotate }] }]}
          >
            <LinearGradient colors={[COLOR, COLOR2]} locations={[0.8, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.legSole} />
          </Animated.View>
          <Animated.View
            style={[styles.leg2, { transform: [{ rotate: legRotate }, { translateX: legSlide }] }]}
          >
            <LinearGradient colors={[COLOR, COLOR2]} locations={[0.8, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.legSole} />
          </Animated.View>

          {/* Body */}
          <Animated.View style={[styles.bodyShape, bodyStyle(px(11.9))]}>
            <LinearGradient colors={[COLOR, COLOR2]} locations={[0.9, 1]} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>

        {/* Treadmill dashes */}
        <View style={styles.track}>
          <Animated.View style={[styles.dashRow, { opacity: lineOpacity, transform: [{ translateX: lineX }] }]}>
            {Array.from({ length: 22 }).map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  capybaraLoader: { width: px(14), height: px(10) },
  capybara: { width: '100%', height: px(7.5) },
  track: { width: '100%', height: px(2.5), overflow: 'hidden' },
  dashRow: { flexDirection: 'row', width: px(50), paddingTop: px(0.5) },
  dash: { width: px(1.5), height: px(0.5), borderRadius: px(0.1), backgroundColor: COLOR2, marginRight: px(1.1) },

  bodyShape: {
    position: 'absolute', left: 0, bottom: 0, width: px(11.9), height: px(7.5),
    borderRadius: px(3.4), overflow: 'hidden',
  },
  headWrap: { position: 'absolute', right: 0, bottom: 0, width: px(7.5), height: px(7), zIndex: 3 },
  headShadow: {
    position: 'absolute', left: -px(1), top: 0, width: px(7.5), height: px(7),
    borderRadius: px(3.5), backgroundColor: COLOR2,
  },
  head: {
    position: 'absolute', left: 0, top: 0, width: px(7.5), height: px(7),
    borderRadius: px(3.5), backgroundColor: COLOR,
  },
  ear: { position: 'absolute', top: 0, left: 0, width: px(2), height: px(2), borderRadius: px(1), overflow: 'hidden' },
  earInner: {
    position: 'absolute', bottom: 0, left: px(0.5), width: px(2), height: px(1),
    borderRadius: px(1), backgroundColor: COLOR2, transform: [{ rotate: '-45deg' }],
  },
  mouth: {
    position: 'absolute', bottom: 0, left: px(2.5), width: px(3.5), height: px(2),
    borderRadius: px(1), backgroundColor: COLOR2, flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center', padding: px(0.5),
  },
  lips: { width: px(0.25), height: px(0.75), borderRadius: px(0.2), backgroundColor: COLOR },
  eye: {
    position: 'absolute', bottom: px(3.5), left: px(1.5), width: px(2), height: px(0.5),
    borderRadius: px(0.25), backgroundColor: COLOR2,
  },
  legBlock: {
    position: 'absolute', left: 0, bottom: 0, width: px(6), height: px(5),
    borderRadius: px(2), overflow: 'hidden', zIndex: 2,
  },
  leg2: {
    position: 'absolute', left: px(3.25), bottom: 0, width: px(1.75), height: px(3),
    borderRadius: px(0.75), overflow: 'hidden', zIndex: 2,
  },
  legSole: { position: 'absolute', left: 0, right: 0, bottom: 0, height: px(0.5), backgroundColor: COLOR2 },
});
