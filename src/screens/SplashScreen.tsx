import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  StatusBar, Dimensions, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import { useApp } from '../context/AppContext';

const CANADA247_LOGO = require('../../assets/canada247-logo.jpg');

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const { width, height } = Dimensions.get('window');
const CANADA_RED = '#D52B1E';

export default function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { onboardingComplete } = useApp();

  const logoScale  = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      // Slogan fades in
      Animated.timing(sloganOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      // CTA fades in
      Animated.timing(ctaOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top red bar */}
      <View style={styles.topBar} />

      {/* Background map watermark */}
      <View style={styles.mapWrap} pointerEvents="none">
        <Image
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Canada_blank_map.svg/1200px-Canada_blank_map.svg.png' }}
          style={styles.mapImage}
          resizeMode="contain"
          tintColor="rgba(213,43,30,0.06)"
        />
      </View>

      {/* Main content */}
      <View style={styles.content}>

        {/* Canada247 Logo — centrepiece */}
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Image
            source={CANADA247_LOGO}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Slogan */}
        <Animated.View style={[styles.sloganWrap, { opacity: sloganOpacity }]}>
          <View style={styles.sloganPill}>
            <Text style={styles.sloganText}>CANADA IN REAL TIME</Text>
          </View>
          <Text style={styles.tagline}>
            News, opportunities, events & more —{'\n'}everything Canada, as it happens.
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity }]}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.replace(onboardingComplete ? 'Main' : 'RegionSelection')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>{onboardingComplete ? 'CONTINUE' : 'GET STARTED'}</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.taglineSub}>The pulse of Canada · 24/7</Text>
        </Animated.View>

      </View>

      {/* Bottom red bar */}
      <View style={styles.bottomBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  topBar: {
    height: 6,
    backgroundColor: CANADA_RED,
  },
  bottomBar: {
    height: 6,
    backgroundColor: CANADA_RED,
  },
  mapWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    width: width * 1.1,
    height: height * 0.55,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logoWrap: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: width * 0.82,
    height: width * 0.38,
    borderRadius: 8,
  },
  sloganWrap: {
    alignItems: 'center',
    gap: 14,
  },
  sloganPill: {
    backgroundColor: CANADA_RED,
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 3,
  },
  sloganText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  tagline: {
    color: '#555',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 23,
  },
  ctaWrap: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  ctaButton: {
    width: '100%',
    height: 56,
    backgroundColor: CANADA_RED,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 4,
    shadowColor: CANADA_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  taglineSub: {
    color: '#999',
    fontSize: 12,
    letterSpacing: 1,
  },
});
