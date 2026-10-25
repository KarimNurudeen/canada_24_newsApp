import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, useWindowDimensions, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * App-wide backdrop, ported from the Uiverse pattern: a 135° repeating
 * stripe gradient with a large, slowly drifting layer of isometric cubes on
 * top (the `cubeMove` animation: translateY 0 → -20%, scale 1 → 1.02,
 * rotate 0 → 1°, 18s, alternating). React Native has no repeating gradient
 * or CSS animation, so the stripes are tiles of one gradient period and the
 * cubes are skewed views animated as a single native-driven layer.
 */

const DARK = {
  base: '#181c21',
  a: '#232526',
  aFade: 'rgba(35,37,38,0.6)',
  b: '#414345',
  cubeTop: 'rgba(255,255,255,0.06)',
  cubeLeft: 'rgba(255,255,255,0.03)',
  cubeRight: 'rgba(0,0,0,0.16)',
};
const LIGHT = {
  base: '#eceef0',
  a: '#f4f5f6',
  aFade: 'rgba(244,245,246,0.6)',
  b: '#dcdfe2',
  cubeTop: 'rgba(255,255,255,0.55)',
  cubeLeft: 'rgba(255,255,255,0.25)',
  cubeRight: 'rgba(0,0,0,0.05)',
};

const PERIOD = 130; // px, one repeat of the stripe gradient
const CUBE_W = 112; // px, width of one isometric cube

type Palette = typeof DARK;

function Cube({ x, y, p }: { x: number; y: number; p: Palette }) {
  const W = CUBE_W;
  const H = W / 2;
  const TILT = '26.565deg'; // atan(1/2): 2:1 isometric
  return (
    <View style={{ position: 'absolute', left: x, top: y, width: W, height: W }}>
      {/* top face: a square squashed into a rhombus */}
      <View
        style={{
          position: 'absolute', left: W / 2 - W / 2 / Math.SQRT2, top: W / 4 - W / 2 / Math.SQRT2,
          width: W / Math.SQRT2, height: W / Math.SQRT2, backgroundColor: p.cubeTop,
          transform: [{ scaleY: 0.5 }, { rotate: '45deg' }],
        }}
      />
      {/* left face: a parallelogram sloping down to the right */}
      <View
        style={{
          position: 'absolute', left: 0, top: (3 * W) / 8, width: W / 2, height: H,
          backgroundColor: p.cubeLeft, transform: [{ skewY: TILT }],
        }}
      />
      {/* right face: sloping up to the right */}
      <View
        style={{
          position: 'absolute', left: W / 2, top: (3 * W) / 8, width: W / 2, height: H,
          backgroundColor: p.cubeRight, transform: [{ skewY: `-${TILT}` }],
        }}
      />
    </View>
  );
}

export default function AppBackground({ dark = true }: { dark?: boolean }) {
  const { width, height } = useWindowDimensions();
  const p = dark ? DARK : LIGHT;
  const drift = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 18000, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, reduceMotion]);

  // Stripes: one column of gradient periods, rotated so the gradient runs at 135°.
  const diagonal = Math.ceil(Math.hypot(width, height));
  const tiles = Math.ceil(diagonal / PERIOD) + 2;

  // Cubes: a hex-style lattice covering the screen plus the area the drift reveals.
  const cubes = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    const rowStep = CUBE_W * 0.75;
    const rows = Math.ceil((height * 1.5) / rowStep) + 1;
    const cols = Math.ceil((width * 1.3) / CUBE_W) + 2;
    for (let r = 0; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        list.push({ x: c * CUBE_W + (r % 2 ? CUBE_W / 2 : 0) - width * 0.15, y: r * rowStep });
      }
    }
    return list;
  }, [width, height]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.2] });
  const scale = drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const rotate = drift.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1deg'] });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: p.base, overflow: 'hidden' }]} pointerEvents="none">
      {/* 135° repeating stripes */}
      <View
        style={{
          position: 'absolute', width: diagonal, height: diagonal,
          left: (width - diagonal) / 2, top: (height - diagonal) / 2,
          transform: [{ rotate: '-45deg' }],
        }}
      >
        {Array.from({ length: tiles }).map((_, i) => (
          <LinearGradient
            key={i}
            colors={[p.a, p.a, p.aFade, p.b]}
            locations={[0, 60 / PERIOD, 70 / PERIOD, 1]}
            style={{ width: diagonal, height: PERIOD }}
          />
        ))}
      </View>

      {/* Drifting cubes */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: 0.7, transform: [{ translateY }, { scale }, { rotate }] }]}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
      >
        {cubes.map((c, i) => (
          <Cube key={i} x={c.x} y={c.y} p={p} />
        ))}
      </Animated.View>
    </View>
  );
}
