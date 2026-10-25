import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const NO_NETWORK_IMAGE = require('../../assets/no-network.png');

export default function NoNetworkOverlay() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.container} pointerEvents="auto">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Image source={NO_NETWORK_IMAGE} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    elevation: 9999,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
