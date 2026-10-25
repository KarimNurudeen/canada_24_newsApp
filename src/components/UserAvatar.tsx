import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

interface Props {
  uri?: string;
  name?: string;
  size?: number;
  onPress?: () => void;
  /** Ring colour for overlapping avatar stacks. */
  ringColor?: string;
}

/** Round profile picture with an initial fallback; tappable when `onPress` is set. */
export default function UserAvatar({ uri, name, size = 36, onPress, ringColor }: Props) {
  const { colors } = useApp();
  const inner = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{(name?.trim()[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
  const ring = ringColor ? { borderWidth: 2, borderColor: ringColor, borderRadius: (size + 4) / 2 } : null;
  const body = <View style={ring ?? undefined}>{inner}</View>;
  if (!onPress) return body;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Open ${name ?? 'user'}'s profile`}>
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '800' },
});
