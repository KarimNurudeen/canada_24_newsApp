import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Dimensions,
} from 'react-native';

const APP_LOGO = require('../../assets/icon.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

export default function AuthEmailScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useApp();
  const { sendOTP } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOTP(trimmed);
      navigation.navigate('AuthOTP', { email: trimmed });
    } catch {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.primary }]}>
        <View style={styles.logoRow}>
          <View style={styles.iconBox}>
            <Image source={APP_LOGO} style={{ width: 34, height: 34 }} resizeMode="contain" />
          </View>
          <Text style={styles.logoText}>CANADA IN REAL TIME</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.body}>
          {/* Illustration */}
          <View style={[styles.illustrationBox, { backgroundColor: colors.primary + '15' }]}>
            <MaterialIcons name="mark-email-unread" size={64} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.primaryText }]}>
            Sign in or create account
          </Text>
          <Text style={[styles.subtitle, { color: colors.hint }]}>
            Enter your email address and we'll send you a one-time verification code.
          </Text>

          {/* Email input */}
          <View style={[styles.inputWrap, { borderColor: error ? '#D32F2F' : colors.primary, backgroundColor: colors.surface }]}>
            <MaterialIcons name="email" size={20} color={colors.primary} style={{ marginRight: 10 }} />
            <TextInput
              value={email}
              onChangeText={t => { setEmail(t); setError(''); }}
              placeholder="your@email.com"
              placeholderTextColor={colors.hint}
              style={[styles.input, { color: colors.primaryText }]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>SEND VERIFICATION CODE</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.hint }]}>
            By continuing, you agree to Canada In Real Time's{' '}
            <Text style={[styles.disclaimerLink, { color: colors.primary }]} onPress={() => navigation.navigate('TermsOfService')}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={[styles.disclaimerLink, { color: colors.primary }]} onPress={() => navigation.navigate('PrivacyPolicy')}>
              Privacy Policy
            </Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 34, height: 34,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1.5,
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    alignItems: 'center',
  },
  illustrationBox: {
    width: 120, height: 120,
    borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 30,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 16,
    marginTop: 12,
  },
  btnText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: '#fff',
    letterSpacing: 1,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  disclaimerLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
