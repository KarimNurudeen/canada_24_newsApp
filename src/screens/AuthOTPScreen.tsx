import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SlideUpCard from '../components/SlideUpCard';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'AuthOTP'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function AuthOTPScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { email } = route.params;
  const { colors } = useApp();
  const { verifyOTP, sendOTP } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fail = (message: string) => {
    setError(message);
    shake.setValue(0);
    Animated.sequence([8, -8, 5, -5, 0].map(v => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))).start();
  };

  const handleVerify = async (code?: string) => {
    const otp = code ?? digits.join('');
    if (otp.length < OTP_LENGTH) {
      fail('Enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    const ok = await verifyOTP(email, otp);
    setLoading(false);
    if (!ok) {
      fail('Invalid or expired code. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');
    setError('');

    // Pasting or autofilling a whole code into one box spreads it across all six.
    if (clean.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      clean.slice(0, OTP_LENGTH).split('').forEach((c, i) => { next[i] = c; });
      setDigits(next);
      const last = Math.min(clean.length, OTP_LENGTH) - 1;
      inputRefs.current[last]?.focus();
      if (clean.length >= OTP_LENGTH) void handleVerify(next.join(''));
      return;
    }

    const char = clean.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (char && next.every(d => d !== '')) void handleVerify(next.join(''));
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    await sendOTP(email);
    setCountdown(RESEND_COOLDOWN);
  };

  const full = digits.every(d => d !== '');
  const mm = Math.floor(countdown / 60);
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#0b1a3a', '#12306a', '#1a1030']} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.orb, styles.orbRed]} />
        <View style={[styles.orb, styles.orbBlue]} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroIcon}>
          <MaterialIcons name="mark-email-read" size={34} color="#fff" />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.cards}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SlideUpCard delay={0} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.primaryText }]}>Check your inbox</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: colors.primaryText, fontWeight: '800' }}>{email}</Text>
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.change}>
              <Text style={[styles.changeText, { color: colors.primary }]}>Change email</Text>
            </TouchableOpacity>
          </SlideUpCard>

          <SlideUpCard delay={140} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Animated.View style={[styles.otpRow, { transform: [{ translateX: shake }] }]}>
              {digits.map((d, i) => {
                const isFocused = focusedIndex === i;
                return (
                  <TextInput
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    style={[
                      styles.otpBox,
                      {
                        color: colors.primaryText,
                        backgroundColor: colors.background,
                        borderColor: error ? '#FF453A' : isFocused ? colors.primary : d ? colors.primary + '88' : colors.divider,
                      },
                      isFocused && { shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
                    ]}
                    value={d}
                    onChangeText={t => handleDigitChange(t, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    onFocus={() => setFocusedIndex(i)}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    maxLength={i === 0 ? OTP_LENGTH : 1}
                    selectTextOnFocus
                    autoFocus={i === 0}
                    caretHidden
                    accessibilityLabel={`Digit ${i + 1}`}
                  />
                );
              })}
            </Animated.View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: colors.primary }, (!full || loading) && { opacity: 0.55 }]}
              onPress={() => handleVerify()}
              disabled={!full || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaText}>Verify and continue</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </SlideUpCard>

          <SlideUpCard delay={280} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <View style={styles.resendRow}>
              <Text style={[styles.resendLabel, { color: colors.hint }]}>Didn’t get it? </Text>
              <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
                <Text style={[styles.resendLink, { color: countdown > 0 ? colors.hint : colors.primary }]}>
                  {countdown > 0 ? `Resend in ${mm}:${ss}` : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </View>
          </SlideUpCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 216, paddingHorizontal: 24, justifyContent: 'flex-end', paddingBottom: 52, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  orbRed: { width: 240, height: 240, right: -70, top: -80, backgroundColor: 'rgba(213,43,30,0.45)' },
  orbBlue: { width: 200, height: 200, left: -70, bottom: -90, backgroundColor: 'rgba(90,150,255,0.25)' },
  back: {
    position: 'absolute', left: 20, top: 56, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  cards: { flex: 1, marginTop: -28 },
  card: { borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
  subtitle: { fontSize: 14.5, fontWeight: '500', lineHeight: 22, marginTop: 8 },
  change: { alignSelf: 'flex-start', marginTop: 6 },
  changeText: { fontSize: 13, fontWeight: '800' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, width: '100%' },
  otpBox: {
    flex: 1, minWidth: 0, width: 0, height: 62, borderRadius: 16, borderWidth: 1.5, textAlign: 'center',
    fontSize: 24, fontWeight: '800',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  error: { color: '#FF453A', fontSize: 13, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  cta: {
    height: 56, borderRadius: 999, marginTop: 24, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  resendLabel: { fontSize: 14, fontWeight: '500' },
  resendLink: { fontSize: 14, fontWeight: '800' },
});
