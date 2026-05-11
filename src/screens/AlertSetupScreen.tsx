import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ALERT_DEFINITIONS } from '../config/content';
import { useApp } from '../context/AppContext';
import { scheduleAlertNotification } from '../services/notificationService';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AlertSetup'>;

const NOTIFICATION_ITEMS = ALERT_DEFINITIONS.slice(0, 3).map(item => item.label);
const TOPIC_ITEMS = ALERT_DEFINITIONS.slice(3).map(item => item.label);

function AlertToggleRow({ label, active, onToggle, colors }: {
  label: string; active: boolean; onToggle: () => void;
  colors: ReturnType<typeof useApp>['colors'];
}) {
  return (
    <View style={[styles.toggleRow, { borderBottomColor: colors.divider + '20' }]}>
      <Text style={[styles.toggleLabel, { color: colors.primaryText }]}>{label}</Text>
      <Switch
        value={active}
        onValueChange={onToggle}
        trackColor={{ false: '#ccc', true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor="#ccc"
      />
    </View>
  );
}

export default function AlertSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { alerts, toggleAlert, completeOnboarding, onboardingComplete, colors } = useApp();

  const isStandalone = onboardingComplete; // accessed from sidebar, not onboarding

  // Navigate to Main AFTER onboardingComplete flips to true and navigator re-renders
  const prevOnboarding = useRef(onboardingComplete);
  useEffect(() => {
    if (!prevOnboarding.current && onboardingComplete) {
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
    }
    prevOnboarding.current = onboardingComplete;
  }, [onboardingComplete]);

  const handleToggle = async (key: string) => {
    toggleAlert(key);
    if (!alerts[key]) {
      await scheduleAlertNotification(key);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isStandalone ? 'light-content' : 'dark-content'}
        backgroundColor={isStandalone ? colors.primary : colors.background}
      />

      {/* Standalone header (from sidebar) */}
      {isStandalone && (
        <View style={[styles.standaloneHeader, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.standaloneTitle}>MANAGE MY ALERTS</Text>
          <View style={{ width: 26 }} />
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scrollContent, isStandalone && { paddingTop: 24 }]}>

        {/* Onboarding header */}
        {!isStandalone && (
          <View style={styles.header}>
            <Text style={[styles.stepLabel, { color: colors.primaryText }]}>Step 2 of 2:</Text>
            <Text style={[styles.title, { color: colors.primaryText }]}>Set your alerts.</Text>
            <View style={{ height: 8 }} />
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Stay on top of everything happening in Canada — in your community and beyond.
            </Text>
          </View>
        )}

        {/* Notifications section */}
        <Text style={[styles.sectionLabel, { color: colors.hint, marginBottom: 8 }]}>NOTIFICATIONS</Text>
        <View style={{ marginBottom: 32 }}>
          {NOTIFICATION_ITEMS.map(item => (
            <AlertToggleRow
              key={item} label={item}
              active={!!alerts[item]}
              onToggle={() => handleToggle(item)}
              colors={colors}
            />
          ))}
        </View>

        {/* Topics section */}
        <Text style={[styles.sectionLabel, { color: colors.hint }]}>TOPICS</Text>
        <View style={{ marginBottom: 40 }}>
          {TOPIC_ITEMS.map(item => (
            <AlertToggleRow
              key={item} label={item}
              active={!!alerts[item]}
              onToggle={() => handleToggle(item)}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>

      {/* Onboarding CTA */}
      {!isStandalone && (
        <View style={styles.ctaWrapper} pointerEvents="box-none">
          <View style={[styles.ctaFade, { backgroundColor: colors.background }]} pointerEvents="none" />
          <View style={[styles.ctaContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              onPress={() => { completeOnboarding(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>TAKE ME TO THE APP!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  standaloneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  standaloneTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
  scrollContent: { padding: 32, paddingTop: 40, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 32 },
  stepLabel: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: { fontSize: 15, fontWeight: '700', textAlign: 'center', lineHeight: 22 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 16 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toggleLabel: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 12 },
  ctaWrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    elevation: 10,
    zIndex: 10,
  },
  ctaFade: {
    height: 40,
    opacity: 0.85,
  },
  ctaContainer: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 36,
  },
  ctaButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
});
