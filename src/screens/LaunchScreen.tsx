import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useApp } from '../context/AppContext';

const LAUNCH_IMAGE = require('../../assets/launch-screen.png');
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LaunchScreen() {
  const navigation = useNavigation<Nav>();
  const { onboardingComplete } = useApp();

  const screenOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(screenOpacity, {
      toValue: 1, duration: 420, useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 320, useNativeDriver: true,
      }).start(() => {
        navigation.replace(onboardingComplete ? 'Main' : 'Splash');
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [onboardingComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Image source={LAUNCH_IMAGE} style={styles.image} resizeMode="contain" />
    </Animated.View>
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
});
