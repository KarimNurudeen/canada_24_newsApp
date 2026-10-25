import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SlideUpCard from '../components/SlideUpCard';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'signin' | 'signup';

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Enter your email and we’ll send a one-time code to sign you in.',
    cta: 'Continue',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Join Canada247 free. We’ll email you a code — no password to remember.',
    cta: 'Create account',
  },
};

export default function AuthEmailScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useApp();
  const { sendOTP } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const shake = useRef(new Animated.Value(0)).current;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const copy = COPY[mode];
  const lifted = focused || email.length > 0;

  const fail = (message: string) => {
    setError(message);
    shake.setValue(0);
    Animated.sequence([6, -6, 4, -4, 0].map(v => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))).start();
  };

  const handleContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      fail('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOTP(trimmed);
      navigation.navigate('AuthOTP', { email: trimmed });
    } catch {
      fail('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const borderColor = error ? '#FF453A' : focused ? colors.primary : colors.divider;

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar barStyle="light-content" />

      {/* Hero */}
      <LinearGradient colors={['#0b1a3a', '#12306a', '#1a1030']} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.orb, styles.orbRed]} />
        <View style={[styles.orb, styles.orbBlue]} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.close}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Close"
        >
          <MaterialIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.brand}>CANADA</Text>
        <View style={styles.brandSub}>
          <View style={styles.brandRule} />
          <Text style={styles.brandTag}>in real time</Text>
          <View style={styles.brandDot} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.cards}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: mode + heading */}
          <SlideUpCard delay={0} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <View style={[styles.segment, { backgroundColor: colors.background, borderColor: colors.divider }]}>
              {(['signin', 'signup'] as const).map(m => {
                const active = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMode(m)}
                    style={[styles.segmentBtn, active && { backgroundColor: colors.primary }]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.segmentText, { color: active ? '#fff' : colors.secondaryText }]}>
                      {m === 'signin' ? 'Sign in' : 'Create account'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.title, { color: colors.primaryText }]}>{copy.title}</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{copy.subtitle}</Text>
          </SlideUpCard>

          {/* Card 2: email + action */}
          <SlideUpCard delay={140} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Animated.View
              style={[
                styles.field,
                { borderColor, backgroundColor: colors.background, transform: [{ translateX: shake }] },
                focused && { shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
              ]}
            >
              <MaterialIcons name="mail-outline" size={22} color={focused ? colors.primary : colors.hint} />
              <View style={{ flex: 1 }}>
                <Text
                  pointerEvents="none"
                  style={[
                    styles.floatLabel,
                    { color: error ? '#FF453A' : focused ? colors.primary : colors.hint },
                    lifted ? styles.floatLabelUp : styles.floatLabelDown,
                  ]}
                >
                  Email address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={t => { setEmail(t); setError(''); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={[styles.input, { color: colors.primaryText }]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleContinue}
                  accessibilityLabel="Email address"
                />
              </View>
              {email.length > 0 ? (
                <TouchableOpacity onPress={() => setEmail('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="cancel" size={18} color={colors.hint} />
                </TouchableOpacity>
              ) : null}
            </Animated.View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: colors.primary }, loading && { opacity: 0.75 }]}
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaText}>{copy.cta}</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.secureRow}>
              <MaterialIcons name="lock-outline" size={14} color={colors.hint} />
              <Text style={[styles.secureText, { color: colors.hint }]}>Passwordless and secure — we only use your email to sign you in.</Text>
            </View>
          </SlideUpCard>

          {/* Card 3: legal */}
          <SlideUpCard delay={280} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.legal, { color: colors.hint }]}>
              By continuing you agree to our{' '}
              <Text style={[styles.legalLink, { color: colors.primary }]} onPress={() => navigation.navigate('TermsOfService')}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={[styles.legalLink, { color: colors.primary }]} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>.
            </Text>
          </SlideUpCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 210, paddingHorizontal: 24, justifyContent: 'flex-end', paddingBottom: 56, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  orbRed: { width: 240, height: 240, right: -70, top: -80, backgroundColor: 'rgba(213,43,30,0.45)' },
  orbBlue: { width: 200, height: 200, left: -70, bottom: -90, backgroundColor: 'rgba(90,150,255,0.25)' },
  close: {
    position: 'absolute', right: 20, top: 56, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  brand: { fontFamily: 'BebasNeue_400Regular', fontSize: 40, color: '#fff', letterSpacing: 8, lineHeight: 42 },
  brandSub: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  brandRule: { width: 22, height: 2, backgroundColor: '#FF453A' },
  brandTag: { fontSize: 15, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.6 },
  brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF453A' },
  cards: { flex: 1, marginTop: -28 },
  card: { borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth },
  segment: { flexDirection: 'row', borderRadius: 999, padding: 4, borderWidth: StyleSheet.hairlineWidth, marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 14.5, fontWeight: '500', lineHeight: 21, marginTop: 8 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, height: 64,
  },
  floatLabel: { position: 'absolute', left: 0, fontWeight: '600' },
  floatLabelDown: { top: 20, fontSize: 16 },
  floatLabelUp: { top: 8, fontSize: 11 },
  input: { fontSize: 16, fontWeight: '600', paddingTop: 20, paddingBottom: 6, height: 64,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  error: { color: '#FF453A', fontSize: 13, fontWeight: '600', marginTop: 8, marginLeft: 4 },
  cta: {
    height: 56, borderRadius: 999, marginTop: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  secureText: { fontSize: 12, fontWeight: '500', flexShrink: 1, textAlign: 'center' },
  legal: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  legalLink: { fontWeight: '700', textDecorationLine: 'underline' },
});
