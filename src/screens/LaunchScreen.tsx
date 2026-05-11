import React, { useEffect, useRef } from 'react';
import {
  View, Image, StyleSheet, Animated,
  Dimensions, StatusBar, Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const CANADA247_LOGO = require('../../assets/canada247-logo.jpg');
type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const RED = '#D52B1E';
const SLOGAN = ['CANADA', 'IN', 'REAL', 'TIME'];

export default function LaunchScreen() {
  const navigation = useNavigation<Nav>();

  // Bars slide in from edges
  const topBarX    = useRef(new Animated.Value(-width)).current;
  const bottomBarX = useRef(new Animated.Value(width)).current;

  // Logo
  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Slogan pill
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillY       = useRef(new Animated.Value(14)).current;

  // Slogan words (stagger)
  const wordOpacities  = useRef(SLOGAN.map(() => new Animated.Value(0))).current;
  const wordTranslates = useRef(SLOGAN.map(() => new Animated.Value(10))).current;

  // Progress bar (useNativeDriver false — width)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Dots
  const dotOpacities = useRef([0, 1, 2].map(() => new Animated.Value(0.15))).current;
  const dotScales    = useRef([0, 1, 2].map(() => new Animated.Value(0.7))).current;

  // Screen fade out
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // ── Phase 1 (0ms): Bars slide in from edges ──────────────────────
    Animated.parallel([
      Animated.timing(topBarX, {
        toValue: 0, duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bottomBarX, {
        toValue: 0, duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // ── Phase 2 (180ms): Logo springs in ─────────────────────────────
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1, tension: 62, friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 480,
          useNativeDriver: true,
        }),
      ]).start();
    }, 180);

    // ── Phase 3 (560ms): Slogan words stagger up ─────────────────────
    setTimeout(() => {
      Animated.stagger(
        80,
        SLOGAN.map((_, i) =>
          Animated.parallel([
            Animated.timing(wordOpacities[i], {
              toValue: 1, duration: 300, useNativeDriver: true,
            }),
            Animated.timing(wordTranslates[i], {
              toValue: 0, duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        )
      ).start();

      // Pill fades in after words
      Animated.parallel([
        Animated.timing(pillOpacity, {
          toValue: 1, duration: 350, delay: 320, useNativeDriver: true,
        }),
        Animated.timing(pillY, {
          toValue: 0, duration: 350, delay: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 560);

    // ── Phase 4 (720ms): Progress line sweeps ────────────────────────
    setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: 1, duration: 1280,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();
    }, 720);

    // ── Phase 5 (820ms): Dots wave pulse ─────────────────────────────
    setTimeout(() => {
      const pulseDot = (i: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(dotOpacities[i], { toValue: 1, duration: 380, useNativeDriver: true }),
              Animated.timing(dotScales[i], { toValue: 1.25, duration: 380, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(dotOpacities[i], { toValue: 0.15, duration: 380, useNativeDriver: true }),
              Animated.timing(dotScales[i], { toValue: 0.7, duration: 380, useNativeDriver: true }),
            ]),
          ])
        ).start();
      };
      pulseDot(0);
      setTimeout(() => pulseDot(1), 250);
      setTimeout(() => pulseDot(2), 500);
    }, 820);

    // ── Phase 6 (2200ms): Fade out + navigate ────────────────────────
    setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 380, useNativeDriver: true,
      }).start(() => navigation.replace('Splash'));
    }, 2200);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top bar — slides in from left */}
      <View style={styles.barWrapper}>
        <Animated.View style={[styles.bar, { transform: [{ translateX: topBarX }] }]} />
      </View>

      {/* Main content */}
      <View style={styles.content}>

        {/* Logo */}
        <Animated.Image
          source={CANADA247_LOGO}
          style={[styles.logo, {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }]}
          resizeMode="contain"
        />

        {/* Slogan pill with staggered words */}
        <Animated.View style={[styles.pillWrap, { opacity: pillOpacity, transform: [{ translateY: pillY }] }]}>
          <View style={styles.pill}>
            {SLOGAN.map((word, i) => (
              <Animated.Text
                key={word}
                style={[
                  styles.pillWord,
                  {
                    opacity: wordOpacities[i],
                    transform: [{ translateY: wordTranslates[i] }],
                  },
                ]}
              >
                {word}{i < SLOGAN.length - 1 ? ' ' : ''}
              </Animated.Text>
            ))}
          </View>
        </Animated.View>

        {/* Progress track */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          {/* Shimmer tip */}
          <Animated.View
            style={[
              styles.progressTip,
              {
                left: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Pulsing dots */}
        <View style={styles.dotsRow}>
          {dotOpacities.map((opacity, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [{ scale: dotScales[i] }],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom bar — slides in from right */}
      <View style={styles.barWrapper}>
        <Animated.View style={[styles.bar, { transform: [{ translateX: bottomBarX }] }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  barWrapper: {
    width: '100%',
    height: 5,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    height: 5,
    backgroundColor: RED,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 22,
  },
  logo: {
    width: width * 0.8,
    height: width * 0.37,
  },
  pillWrap: {
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: RED,
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 3,
  },
  pillWord: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 3.5,
  },
  progressTrack: {
    width: width * 0.55,
    height: 2,
    backgroundColor: '#ECECEC',
    borderRadius: 1,
    overflow: 'visible',
    marginTop: 4,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: RED,
    borderRadius: 1,
  },
  progressTip: {
    position: 'absolute',
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
    marginLeft: -4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: RED,
  },
});
