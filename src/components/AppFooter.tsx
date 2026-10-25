import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NAV_CATEGORIES } from '../config/nav';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

/** Home footer, matching the web footer: wordmark, Categories and Account columns, legal links. */
export default function AppFooter() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const accountLinks: { label: string; onPress: () => void }[] = [
    user
      ? { label: 'Saved Articles', onPress: () => navigation.navigate('SavedStories') }
      : { label: 'Sign In', onPress: () => navigation.navigate('AuthEmail') },
    { label: 'Settings', onPress: () => navigation.navigate('Settings') },
    { label: 'Alert Preferences', onPress: () => navigation.navigate('AlertSetup') },
  ];

  return (
    <View style={{ marginTop: 34 }}>
      <LinearGradient colors={['#12306a', '#0b1a3a']} style={styles.footer}>
        <Text style={styles.brand}>CANADA</Text>
        <Text style={styles.tag}>in real time</Text>

        <View style={styles.cols}>
          <View style={styles.col}>
            <Text style={styles.heading}>CATEGORIES</Text>
            {NAV_CATEGORIES.map(c => (
              <TouchableOpacity key={c.label} onPress={() => navigation.navigate('SectionDetail', { section: c.section })}>
                <Text style={styles.link}>{c.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => (navigation as any).navigate('Watch')}>
              <Text style={styles.link}>Video</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.col}>
            <Text style={styles.heading}>ACCOUNT</Text>
            {accountLinks.map(l => (
              <TouchableOpacity key={l.label} onPress={l.onPress}>
                <Text style={styles.link}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.copy}>© {new Date().getFullYear()} Canada News. All rights reserved.</Text>
          <View style={styles.legal}>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}><Text style={styles.legalLink}>Privacy Policy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}><Text style={styles.legalLink}>Terms of Service</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => void Linking.openURL('mailto:info@canada247.com')}><Text style={styles.legalLink}>Contact</Text></TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 3, borderTopColor: '#D52B1E' },
  brand: { fontFamily: 'BebasNeue_400Regular', fontSize: 30, letterSpacing: 5, color: '#fff' },
  tag: { fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', marginBottom: 22 },
  cols: { flexDirection: 'row', gap: 28 },
  col: { flex: 1, gap: 10 },
  heading: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },
  link: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  bottom: { marginTop: 26, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)', gap: 10 },
  copy: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  legal: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  legalLink: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
});
