import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

/**
 * Soft-3D toggle ported from the CSS "switch-button" design: a dark recessed
 * pill, a raised round knob that slides across, and an indicator ring on the
 * opposite side that fades through when it flips. The ring takes the app's
 * accent colour when on (the original used green) and a dim grey when off.
 *
 * Every size comes from the original 115×55 design, scaled by `height / 55`.
 */
interface Props {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Overall height in px; width follows the original's proportions. */
  height?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function NeoSwitch({ value, onValueChange, height = 34, disabled, accessibilityLabel }: Props) {
  const { colors } = useApp();
  const k = height / 55;
  const t = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: value ? 1 : 0,
      duration: 320,
      easing: value ? Easing.in(Easing.quad) : Easing.out(Easing.quad),
      useNativeDriver: false, // ring colour is interpolated, which the native driver can't do
    }).start();
  }, [value, t]);

  const W = 115 * k;
  const pad = 6 * k;
  const knob = 42 * k;
  const ring = 25 * k;
  const ringBorder = Math.max(2, 3 * k);

  const knobX = t.interpolate({ inputRange: [0, 1], outputRange: [0, 58.6 * k] });
  const ringX = t.interpolate({ inputRange: [0, 1], outputRange: [66 * k, 7.3 * k] });
  // The original ring blinks out a third of the way through the flip.
  const ringOpacity = t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0.15, 1] });
  const ringColor = t.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.28)', colors.primary] });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <View
        style={[
          styles.track,
          { width: W, height, borderRadius: height, padding: pad, borderWidth: 1 },
        ]}
      >
        {/* inset shadow along the top of the recess */}
        <LinearGradient
          colors={['rgba(10,9,16,0.85)', 'rgba(10,9,16,0)']}
          style={[StyleSheet.absoluteFill, { borderRadius: height, height: height * 0.45 }]}
          pointerEvents="none"
        />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {/* indicator ring */}
          <Animated.View
            style={{
              position: 'absolute', left: 0, width: ring, height: ring, borderRadius: ring / 2,
              borderWidth: ringBorder, borderColor: ringColor, opacity: ringOpacity,
              transform: [{ translateX: ringX }],
            }}
          />
          {/* knob */}
          <Animated.View
            style={[
              styles.knobShadow,
              { width: knob, height: knob, borderRadius: knob / 2, transform: [{ translateX: knobX }] },
            ]}
          >
            <LinearGradient colors={['#3b3a4e', '#272733']} style={{ flex: 1, borderRadius: knob / 2 }}>
              <View
                style={{
                  position: 'absolute', top: 1, left: knob * 0.18, right: knob * 0.18, height: knob * 0.28,
                  borderRadius: knob, backgroundColor: 'rgba(255,255,255,0.10)',
                }}
              />
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#252532',
    borderColor: '#32303e',
    overflow: 'hidden',
    shadowColor: '#403f4e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 3,
  },
  knobShadow: {
    shadowColor: '#0f0e17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
  },
});
