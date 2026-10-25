import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  StatusBar, Animated, Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { useApp } from '../context/AppContext';

const ONBOARDING_IMAGE = require('../../assets/onboarding-screen.png');
const CANADA_RED = '#D52B1E';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { onboardingComplete } = useApp();

  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(160)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(ctaOpacity, {
        toValue: 1, duration: 400, delay: 200, useNativeDriver: true,
      }),
      Animated.timing(ctaTranslateY, {
        toValue: 0, duration: 500, delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Image source={ONBOARDING_IMAGE} style={styles.image} resizeMode="contain" />

      <Animated.View
        style={[
          styles.ctaWrap,
          {
            opacity: ctaOpacity,
            paddingBottom: insets.bottom + 24,
            transform: [{ translateY: ctaTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.replace(onboardingComplete ? 'Main' : 'RegionSelection')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{onboardingComplete ? 'CONTINUE' : 'GET STARTED'}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 32,
    paddingTop: 28,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaButton: {
    width: '100%',
    height: 60,
    backgroundColor: CANADA_RED,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 30,
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
});
