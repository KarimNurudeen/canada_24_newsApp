import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Modal, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius, SoftShadow } from '../theme';
import NeoSwitch from '../components/NeoSwitch';
import { ICONS } from '../config/icons';
import { TEXT_SIZES, bodyFontSize, nearestTextSize } from '../utils/textSize';
import type { ImageSourcePropType } from 'react-native';
import { ENABLE_MANAGE_REGIONS, ENABLE_USER_POST_CREATION } from '../config/features';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

const CANADA247_LOGO = require('../../assets/canada247-logo.jpg');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Colors = ReturnType<typeof useApp>['colors'];

function SectionHead({ title, colors }: { title: string; colors: Colors }) {
  return <Text style={[styles.sectionHead, { color: colors.secondaryText }]}>{title}</Text>;
}

function ToggleRow({ title, subtitle, value, onToggle, colors }: {
  title: string; subtitle: string; value: boolean; onToggle: () => void; colors: Colors;
}) {
  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[styles.rowTitle, { color: colors.primaryText }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.hint }]}>{subtitle}</Text>
      </View>
      <NeoSwitch value={value} onValueChange={onToggle} accessibilityLabel={title} />
    </View>
  );
}

function LinkRow({ title, icon, tint, colors, onPress, disabled, badge }: {
  title: string; icon: ImageSourcePropType; tint?: string; colors: Colors; onPress?: () => void; disabled?: boolean; badge?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, opacity: disabled ? 0.45 : 1 }]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <Image source={icon} style={styles.rowIcon} resizeMode="contain" />
      <Text style={[styles.rowTitle, { color: tint ?? colors.primaryText, flex: 1 }]}>{title}</Text>
      {badge ? <Text style={[styles.rowBadge, { color: colors.hint }]}>{badge}</Text> : null}
      {!disabled && <MaterialIcons name="arrow-forward-ios" size={14} color={colors.hint} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors, darkMode, compactLayout, textScale, savedArticles, toggleDarkMode, toggleCompactLayout, setTextScale } = useApp();
  const { user, signOut } = useAuth();
  const [aboutVisible, setAboutVisible] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
    <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <MaterialIcons name="arrow-back-ios-new" size={22} color={colors.primaryText} />
      </TouchableOpacity>
      <Text style={[styles.topTitle, { color: colors.primaryText }]}>Settings and privacy</Text>
      <View style={{ width: 22 }} />
    </View>
    <ScrollView contentContainerStyle={{ paddingBottom: 56 }}>

      <SectionHead title="Account" colors={colors} />
      <View style={styles.group}>
        {user ? (
          <>
            <View style={[styles.row, { backgroundColor: colors.surface }]}>
              <Image source={ICONS.user} style={styles.rowIcon} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.primaryText }]}>{user.displayName}</Text>
                <Text style={[styles.rowSubtitle, { color: colors.hint }]}>{user.email}</Text>
              </View>
            </View>
            <LinkRow title="Saved stories" icon={ICONS.bookmark} colors={colors} badge={String(savedArticles.length)} onPress={() => navigation.navigate('SavedStories')} />
          </>
        ) : (
          <LinkRow title="Sign in or create account" icon={ICONS.signIn} colors={colors} onPress={() => navigation.navigate('AuthEmail')} />
        )}
        <LinkRow title="Alerts" icon={ICONS.bell} colors={colors} onPress={() => navigation.navigate('AlertSetup')} />
        {ENABLE_MANAGE_REGIONS && (
          <LinkRow title="My regions" icon={ICONS.mapPin} colors={colors} onPress={() => navigation.navigate('ManageRegions')} />
        )}
      </View>

      <SectionHead title="Appearance" colors={colors} />
      <View style={styles.group}>
        <ToggleRow title="Dark mode" subtitle="Use a dark background with light text." value={darkMode} onToggle={toggleDarkMode} colors={colors} />
        <ToggleRow title="Compact layout" subtitle="Smaller photos in story lists so more fit on screen." value={compactLayout} onToggle={toggleCompactLayout} colors={colors} />
      </View>

      <SectionHead title="Reading" colors={colors} />
      <View style={[styles.sizeCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.rowTitle, { color: colors.primaryText }]}>Article text size</Text>
        <View style={styles.sizeRow}>
          {TEXT_SIZES.map(size => {
            const active = nearestTextSize(textScale).label === size.label;
            return (
              <TouchableOpacity
                key={size.label}
                onPress={() => setTextScale(size.scale)}
                activeOpacity={0.8}
                style={[
                  styles.sizePill,
                  { borderColor: active ? colors.primary : colors.divider, backgroundColor: active ? colors.primary : 'transparent' },
                ]}
              >
                <Text style={[styles.sizePillText, { color: active ? '#fff' : colors.secondaryText }]}>{size.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.previewText, { color: colors.primaryText, fontSize: bodyFontSize(textScale), lineHeight: bodyFontSize(textScale) * 1.55 }]}>
          Canada247 keeps you connected to what’s happening across the country, right now.
        </Text>
      </View>

      <SectionHead title="Support and about" colors={colors} />
      <View style={styles.group}>
        <LinkRow title="Send us your feedback" icon={ICONS.chat} colors={colors} onPress={() => void Linking.openURL('mailto:info@canada247.com?subject=Canada247%20app%20feedback')} />
        <LinkRow title="About Canada 24/7" icon={ICONS.info} colors={colors} onPress={() => setAboutVisible(true)} />
      </View>

      <SectionHead title="Legal" colors={colors} />
      <View style={styles.group}>
        <LinkRow title="Privacy Policy" icon={ICONS.shield} colors={colors} onPress={() => navigation.navigate('PrivacyPolicy')} />
        <LinkRow title="Terms of Service" icon={ICONS.document} colors={colors} onPress={() => navigation.navigate('TermsOfService')} />
      </View>

      {user ? (
        <View style={[styles.group, { marginTop: 24 }]}>
          <LinkRow title="Log out" icon={ICONS.signOut} tint="#FF453A" colors={colors} onPress={() => signOut()} />
        </View>
      ) : null}

      <Modal visible={aboutVisible} transparent animationType="fade" onRequestClose={() => setAboutVisible(false)}>
        <TouchableOpacity style={styles.aboutBackdrop} activeOpacity={1} onPress={() => setAboutVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.aboutCard, { backgroundColor: colors.background }, SoftShadow]}>
            <Image source={CANADA247_LOGO} style={styles.aboutLogo} resizeMode="contain" />
            <Text style={[styles.aboutTagline, { color: colors.primaryText }]}>The pulse of Canada · 24/7</Text>
            <Text style={[styles.aboutBody, { color: colors.hint }]}>
              News, opportunities, events & more — everything Canada, as it happens.
            </Text>
            <Text style={[styles.aboutVersion, { color: colors.hint }]}>Version {appVersion}</Text>
            <TouchableOpacity
              style={[styles.aboutCloseBtn, { backgroundColor: colors.primary }]}
              onPress={() => setAboutVisible(false)}
            >
              <Text style={styles.aboutCloseText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  topTitle: { fontSize: 17, fontWeight: '800' },
  rowIcon: { width: 26, height: 26, marginRight: 14 },
  accountCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, padding: 16, borderRadius: Radius.lg, marginBottom: 8,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  avatarEditBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  accountName: { fontSize: 16, fontWeight: '700' },
  accountEmail: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  signInCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, padding: 16, borderRadius: Radius.lg, marginBottom: 8,
  },
  signInText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionHead: { fontSize: 13, fontWeight: '700', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8, opacity: 0.8 },
  group: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', gap: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 3, lineHeight: 16 },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  postThumb: { width: 48, height: 48, borderRadius: Radius.sm },
  postHeadline: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  sizeCard: { marginHorizontal: 16, borderRadius: 16, padding: 16 },
  sizeRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 14, flexWrap: 'wrap' },
  sizePill: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  sizePillText: { fontSize: 13, fontWeight: '700' },
  sliderCard: { padding: 16, gap: 12 },
  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  sliderA: { fontSize: 12, fontWeight: '700' },
  sliderALarge: { fontSize: 20, fontWeight: '800' },
  previewText: { fontWeight: '500', lineHeight: 20 },
  rowBadge: { fontSize: 11, fontWeight: '600', marginRight: 8 },
  aboutBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 32 },
  aboutCard: { width: '100%', borderRadius: Radius.lg, padding: 28, alignItems: 'center', gap: 6 },
  aboutLogo: { width: 160, height: 60, marginBottom: 8 },
  aboutTagline: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  aboutBody: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  aboutVersion: { fontSize: 12, fontWeight: '600', marginBottom: 16 },
  aboutCloseBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: Radius.pill },
  aboutCloseText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
