import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, ScrollView, Animated, Easing, Image,
  PanResponder, StyleSheet, useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import NeoSwitch from './NeoSwitch';
import { Radius } from '../theme';
import { ALERT_DEFINITIONS } from '../config/content';
import { ALERT_ICONS, ICONS } from '../config/icons';
import { useApp } from '../context/AppContext';
import { scheduleAlertNotification } from '../services/notificationService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onManageAll: () => void;
}

/** Bell sheet: rises from the bottom to cover half the screen, rounded at the
 * top, with a grab handle. Drag it down (or tap outside) to close. */
export default function NotificationsSheet({ visible, onClose, onManageAll }: Props) {
  const { colors, alerts, toggleAlert } = useApp();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.round(height * 0.5);

  const [mounted, setMounted] = useState(visible);
  const y = useRef(new Animated.Value(sheetHeight)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(y, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(y, { toValue: sheetHeight, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true })
        .start(() => setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag the handle/header down to dismiss.
  const pan = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => { if (g.dy > 0) y.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > sheetHeight * 0.25 || g.vy > 0.9) onClose();
        else Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
    }),
    [sheetHeight, onClose, y],
  );

  const handleToggle = async (label: string) => {
    toggleAlert(label);
    if (!alerts[label]) await scheduleAlertNotification(label);
  };

  const backdropOpacity = y.interpolate({ inputRange: [0, sheetHeight], outputRange: [1, 0], extrapolate: 'clamp' });

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close notifications" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, transform: [{ translateY: y }] },
          ]}
        >
          {/* Frosted glass: heavy blur, a solid-ish tint, and a bright hairline edge, like an iOS context menu. */}
          <BlurView intensity={90} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.glassTint]} pointerEvents="none" />
          <LinearGradient
            colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.glassEdge} pointerEvents="none" />
          <View {...pan.panHandlers} style={styles.dragZone}>
            <View style={[styles.handle, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.title, { color: '#fff' }]}>Notifications</Text>
                <Text style={[styles.sub, { color: 'rgba(255,255,255,0.6)' }]}>Choose what we alert you about</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Close">
                <MaterialIcons name="close" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            {ALERT_DEFINITIONS.map(item => (
              <View key={item.label} style={[styles.row, { borderBottomColor: 'rgba(255,255,255,0.14)' }]}>
                <Image source={ALERT_ICONS[item.label] ?? ICONS.bell} style={styles.icon} resizeMode="contain" />
                <Text style={[styles.rowLabel, { color: '#fff' }]}>{item.label}</Text>
                <NeoSwitch
                  value={!!alerts[item.label]}
                  onValueChange={() => void handleToggle(item.label)}
                  accessibilityLabel={item.label}
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.manage, { borderTopColor: 'rgba(255,255,255,0.14)' }]}
            onPress={() => { onClose(); onManageAll(); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.manageText, { color: colors.primary }]}>Manage all alerts</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden',
    backgroundColor: 'rgba(36,38,44,0.75)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 16,
  },
  glassTint: { backgroundColor: 'rgba(58,60,70,0.42)' },
  glassEdge: {
    ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.22)',
  },
  dragZone: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 8 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: Radius.pill, marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: 28, height: 28, marginRight: 14 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  manage: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2,
    paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth,
  },
  manageText: { fontSize: 14, fontWeight: '800' },
});
