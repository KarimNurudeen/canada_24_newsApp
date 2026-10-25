import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  /** ms to wait before sliding in; stagger sibling cards with increasing values. */
  delay?: number;
  /** px the card travels up from below. */
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/** Wraps a card so it slides up from the bottom of the screen and fades in
 * when it first appears, with a soft settle at the end. */
export default function SlideUpCard({ children, delay = 0, distance = 56, style }: Props) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(t, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [t, delay]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  const opacity = t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.9, 1] });

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
