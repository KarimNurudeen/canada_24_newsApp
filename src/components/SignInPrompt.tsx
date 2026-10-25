import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Radius } from '../theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const SHOW_DELAY_MS = 20000;
const SUPPRESS_DAYS = 7;
const DISMISSED_AT_KEY = '@canada247_signin_prompt_dismissed_at';
/** Screens where interrupting would be wrong (onboarding, auth, legal). */
const SKIP_ROUTES = new Set(['Launch', 'Splash', 'RegionSelection', 'AlertSetup', 'AuthEmail', 'AuthOTP', 'PrivacyPolicy', 'TermsOfService']);

// Module-level so it survives remounts: at most one showing per app session.
let shownThisSession = false;

async function wasRecentlyDismissed(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_AT_KEY);
    const at = raw ? Number(raw) : NaN;
    return Number.isFinite(at) && (Date.now() - at) / 86_400_000 < SUPPRESS_DAYS;
  } catch {
    return false;
  }
}

async function markDismissed() {
  try {
    await AsyncStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
  } catch {
    // storage unavailable — the prompt may show again next launch
  }
}

/** Soft sign-in prompt for signed-out readers, matching the web: only after
 * ~20s of use, once per session, suppressed for 7 days after dismissal or
 * after tapping Sign in, and never over auth/onboarding/legal screens. */
export default function SignInPrompt({ routeName, onSignIn }: { routeName?: string; onSignIn: () => void }) {
  const { colors } = useApp();
  const { user, isAuthLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(false);

  const eligible = !user && !isAuthLoading;

  useEffect(() => {
    if (!eligible || shownThisSession) return;
    const timer = setTimeout(() => setTimerElapsed(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible]);

  const onAllowedRoute = !!routeName && !SKIP_ROUTES.has(routeName);

  useEffect(() => {
    if (!eligible || !timerElapsed || !onAllowedRoute || shownThisSession) return;
    let cancelled = false;
    wasRecentlyDismissed().then(suppressed => {
      if (cancelled || suppressed || shownThisSession) return;
      shownThisSession = true;
      setVisible(true);
    });
    return () => { cancelled = true; };
  }, [eligible, timerElapsed, onAllowedRoute]);

  const dismiss = () => {
    void markDismissed();
    setVisible(false);
  };

  const signIn = () => {
    void markDismissed();
    setVisible(false);
    onSignIn();
  };

  if (!visible || !eligible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={dismiss}>
      <Pressable style={styles.backdrop} onPress={dismiss}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.close} onPress={dismiss} accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={22} color={colors.hint} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.primaryText }]}>Sign in to get the most out of Canada247</Text>
          <Text style={[styles.body, { color: colors.secondaryText }]}>
            Save stories, follow your regions and get alerts that matter to you. It's free and takes a minute.
          </Text>
          <TouchableOpacity style={[styles.primary, { backgroundColor: colors.primary }]} onPress={signIn} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Sign in or create account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismiss} style={styles.later}>
            <Text style={[styles.laterText, { color: colors.secondaryText }]}>Maybe later</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: 24, paddingTop: 32, paddingBottom: 36 },
  close: { position: 'absolute', top: 14, right: 16, zIndex: 1 },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 28, textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 14, fontWeight: '500', lineHeight: 21, textAlign: 'center', marginBottom: 22 },
  primary: { borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  later: { alignItems: 'center', paddingTop: 16 },
  laterText: { fontSize: 13, fontWeight: '600' },
});
