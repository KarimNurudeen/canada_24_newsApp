import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/**
 * Bottom bar with a concave scoop under the active tab. The active icon floats
 * in the scoop inside a glass "water drop" bubble that slides to each tab with a
 * spring and sends out a ripple; inactive icons get a glass disc while pressed.
 * Icons are always white.
 */
const BAR_BODY = 62; // px of bar below the safe area
const TOP = 26; // px above the bar for the bubble to rise into
const SCOOP_W = 50; // half-width of the scoop
const SCOOP_D = 30; // depth of the scoop
const BUBBLE = 52;
const CORNER = 22;
// Black icons need a light bar to read against, so the bar is frosted light glass.
const BAR = 'rgba(244,246,250,0.94)';
const ICON = '#000000';

export default function ConcaveTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const count = routes.length;
  const tabW = width / count;
  const barH = BAR_BODY + insets.bottom;

  // `pos` is the (fractional) index of the active tab; the bubble follows it natively,
  // while the scoop path reads it through a listener.
  const pos = useRef(new Animated.Value(state.index)).current;
  const [scoopX, setScoopX] = useState(tabW * (state.index + 0.5));
  const ripple = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState<number | null>(null);

  useEffect(() => {
    const id = pos.addListener(({ value }) => setScoopX(tabW * (value + 0.5)));
    return () => pos.removeListener(id);
  }, [pos, tabW]);

  useEffect(() => {
    Animated.spring(pos, { toValue: state.index, useNativeDriver: false, speed: 14, bounciness: 7 }).start();
    // ripple outwards + the bubble squashes and pops back, like a drop landing
    ripple.setValue(0);
    Animated.timing(ripple, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    pop.setValue(0.82);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [state.index]); // eslint-disable-line react-hooks/exhaustive-deps

  const path = useMemo(() => {
    const cx = scoopX;
    const y0 = TOP;
    const right = width;
    const bottom = TOP + barH;
    const left = Math.max(CORNER, cx - SCOOP_W);
    const rightEdge = Math.min(right - CORNER, cx + SCOOP_W);
    return [
      `M0 ${y0 + CORNER}`,
      `Q0 ${y0} ${CORNER} ${y0}`,
      `L${left} ${y0}`,
      `C${cx - SCOOP_W * 0.42} ${y0} ${cx - SCOOP_W * 0.6} ${y0 + SCOOP_D} ${cx} ${y0 + SCOOP_D}`,
      `C${cx + SCOOP_W * 0.6} ${y0 + SCOOP_D} ${cx + SCOOP_W * 0.42} ${y0} ${rightEdge} ${y0}`,
      `L${right - CORNER} ${y0}`,
      `Q${right} ${y0} ${right} ${y0 + CORNER}`,
      `L${right} ${bottom}`,
      `L0 ${bottom}`,
      'Z',
    ].join(' ');
  }, [scoopX, width, barH]);

  const bubbleX = pos.interpolate({
    inputRange: routes.map((_, i) => i),
    outputRange: routes.map((_, i) => tabW * (i + 0.5) - BUBBLE / 2),
    extrapolate: 'clamp',
  });
  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  const activeDescriptor = descriptors[routes[state.index].key];

  return (
    <View style={{ height: TOP + barH, width }} pointerEvents="box-none">
      <Svg width={width} height={TOP + barH} style={StyleSheet.absoluteFill}>
        <Path d={path} fill={BAR} stroke="rgba(0,0,0,0.14)" strokeWidth={1} />
      </Svg>

      {/* Glass water-drop bubble that carries the active icon */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bubbleWrap, { transform: [{ translateX: bubbleX }, { scale: pop }] }]}
      >
        <Animated.View style={[styles.ripple, { opacity: rippleOpacity, transform: [{ scale: rippleScale }] }]} />
        <View style={styles.bubble}>
          <BlurView intensity={55} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(150,205,255,0.35)' }]} />
          <LinearGradient
            colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.specular} />
          <View style={styles.caustic} />
          <View style={styles.iconSlot}>
            {activeDescriptor.options.tabBarIcon?.({ focused: true, color: ICON, size: 26 })}
          </View>
        </View>
      </Animated.View>

      {/* Tabs */}
      <View style={[styles.row, { top: TOP, height: barH, paddingBottom: insets.bottom }]}>
        {routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          if (options.tabBarButton) {
            // custom slot (e.g. the optional "+" post button)
            return <View key={route.key} style={styles.tab}>{options.tabBarButton({} as never)}</View>;
          }
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onPressIn={() => setPressed(index)}
              onPressOut={() => setPressed(null)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={styles.tab}
            >
              {!focused && pressed === index ? <View style={styles.pressDisc} /> : null}
              {!focused ? (
                <View style={{ opacity: 0.9 }}>{options.tabBarIcon?.({ focused: false, color: ICON, size: 24 })}</View>
              ) : (
                <View style={{ height: 24 }} />
              )}
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 6 },
  label: { color: 'rgba(0,0,0,0.72)', fontSize: 11, fontWeight: '600' },
  labelActive: { color: '#000000', fontWeight: '800' },
  pressDisc: {
    position: 'absolute', top: 6, width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.07)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)',
  },
  bubbleWrap: { position: 'absolute', top: 2, left: 0, width: BUBBLE, height: BUBBLE },
  ripple: {
    position: 'absolute', left: 0, top: 0, width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2,
    borderWidth: 2, borderColor: 'rgba(43,155,232,0.7)',
  },
  bubble: {
    width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, overflow: 'hidden',
    borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#2B9BE8', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  specular: {
    position: 'absolute', top: 6, left: 10, width: 18, height: 9, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.7)', transform: [{ rotate: '-28deg' }],
  },
  caustic: {
    position: 'absolute', bottom: 3, left: 14, right: 14, height: 9, borderRadius: 9,
    backgroundColor: 'rgba(120,210,255,0.35)',
  },
  iconSlot: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
