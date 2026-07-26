import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Image, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius, SoftShadow } from '../theme';
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
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#ccc', true: colors.primary }} thumbColor="#fff" ios_backgroundColor="#ccc" />
    </View>
  );
}

function LinkRow({ title, icon, tint, colors, onPress, disabled, badge }: {
  title: string; icon: keyof typeof MaterialIcons.glyphMap; tint?: string; colors: Colors; onPress?: () => void; disabled?: boolean; badge?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, opacity: disabled ? 0.45 : 1 }]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <MaterialIcons name={icon} size={20} color={tint ?? colors.primary} style={{ marginRight: 12 }} />
      <Text style={[styles.rowTitle, { color: tint ?? colors.primaryText, flex: 1 }]}>{title}</Text>
      {badge ? <Text style={[styles.rowBadge, { color: colors.hint }]}>{badge}</Text> : null}
      {!disabled && <MaterialIcons name="arrow-forward-ios" size={14} color={colors.hint} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {
    colors, darkMode, compactLayout, allowStorySwiping,
    useDefaultTextSize, textScale, allowBackgroundAudio, savedArticles,
    toggleDarkMode, toggleCompactLayout, toggleStorySwiping,
    toggleDefaultTextSize, setTextScale, toggleBackgroundAudio,
  } = useApp();
  const { user, signOut, userPosts, updateAvatar } = useAuth();
  const [aboutVisible, setAboutVisible] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const previewFontSize = 13 + Math.round(textScale * 12);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    setIsUploadingAvatar(true);
    try {
      await updateAvatar(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message ?? 'Could not update your profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 48 }}
    >
      <Text style={[styles.pageTitle, { color: colors.primaryText }]}>Profile</Text>

      {/* Account */}
      {user ? (
        <View style={[styles.accountCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={isUploadingAvatar} activeOpacity={0.8}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{user.displayName?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="camera-alt" size={12} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.accountName, { color: colors.primaryText }]}>{user.displayName}</Text>
            <Text style={[styles.accountEmail, { color: colors.hint }]}>{user.email}</Text>
          </View>
          <TouchableOpacity onPress={() => signOut()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="logout" size={22} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.signInCard, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AuthEmail')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="login" size={20} color="#fff" />
          <Text style={styles.signInText}>Sign In / Create Account</Text>
        </TouchableOpacity>
      )}

      <SectionHead title="LIBRARY" colors={colors} />
      <View style={styles.group}>
        <LinkRow title={`Saved Stories (${savedArticles.length})`} icon="bookmark-border" colors={colors} onPress={() => navigation.navigate('SavedStories')} />
      </View>

      {ENABLE_USER_POST_CREATION && userPosts.length > 0 && (
        <>
          <SectionHead title="MY SUBMISSIONS" colors={colors} />
          <View style={styles.group}>
            {userPosts.map(post => (
              <TouchableOpacity
                key={post.id}
                style={[styles.postRow, { backgroundColor: colors.surface }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ArticleDetail', { article: post })}
              >
                {post.imgUrl ? (
                  <Image source={{ uri: post.imgUrl }} style={styles.postThumb} />
                ) : (
                  <View style={[styles.postThumb, { backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialIcons name="article" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.postHeadline, { color: colors.primaryText }]} numberOfLines={2}>{post.headline}</Text>
                  <View style={[styles.statusPill, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.statusPillText, { color: colors.primary }]}>{post.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <SectionHead title="PREFERENCES" colors={colors} />
      <View style={styles.group}>
        <ToggleRow title="Compact Layout" subtitle="See more stories with smaller photos." value={compactLayout} onToggle={toggleCompactLayout} colors={colors} />
        <ToggleRow title="Enable Dark" subtitle="Switch to a dark background with light text." value={darkMode} onToggle={toggleDarkMode} colors={colors} />
        <ToggleRow title="Allow Story Swiping" subtitle="Flip between stories by dragging right to left." value={allowStorySwiping} onToggle={toggleStorySwiping} colors={colors} />
        <ToggleRow title="Use Default Text Size" subtitle="Toggle off to make text larger or smaller." value={useDefaultTextSize} onToggle={toggleDefaultTextSize} colors={colors} />
        <ToggleRow title="Allow Background Audio" subtitle="Listen to Article Detail's read-aloud while using other apps." value={allowBackgroundAudio} onToggle={toggleBackgroundAudio} colors={colors} />

        <View style={[styles.sliderCard, { backgroundColor: colors.surface, opacity: useDefaultTextSize ? 0.4 : 1 }]}>
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderA, { color: colors.hint }]}>A</Text>
            <Slider
              style={{ flex: 1, marginHorizontal: 8 }}
              minimumValue={0} maximumValue={1} step={0.05}
              value={textScale} onValueChange={setTextScale}
              minimumTrackTintColor={colors.primary} maximumTrackTintColor="#ccc"
              thumbTintColor={colors.primary} disabled={useDefaultTextSize}
            />
            <Text style={[styles.sliderALarge, { color: colors.primaryText }]}>A</Text>
          </View>
          <Text style={[styles.previewText, { color: colors.primaryText, fontSize: previewFontSize }]}>
            Preview: Canada 24/7 keeps you connected to what's happening now.
          </Text>
        </View>
      </View>

      <SectionHead title="MORE" colors={colors} />
      <View style={styles.group}>
        <LinkRow title="Alerts" icon="notifications-none" colors={colors} onPress={() => navigation.navigate('AlertSetup')} />
        {ENABLE_MANAGE_REGIONS && (
          <LinkRow title="My Regions" icon="location-on" colors={colors} onPress={() => navigation.navigate('ManageRegions')} />
        )}
      </View>

      <SectionHead title="GENERAL" colors={colors} />
      <View style={styles.group}>
        <LinkRow title="Send us your Feedback" icon="feedback" colors={colors} disabled badge="Coming soon" />
        <LinkRow title="About Canada 24/7" icon="info-outline" colors={colors} onPress={() => setAboutVisible(true)} />
      </View>

      <SectionHead title="LEGAL" colors={colors} />
      <View style={styles.group}>
        <LinkRow title="Privacy Policy" icon="privacy-tip" colors={colors} onPress={() => navigation.navigate('PrivacyPolicy')} />
        <LinkRow title="Terms of Service" icon="description" colors={colors} onPress={() => navigation.navigate('TermsOfService')} />
      </View>

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
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 28, fontWeight: '800', paddingHorizontal: 20, marginBottom: 16 },
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
  sectionHead: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  group: { marginHorizontal: 20, borderRadius: Radius.lg, overflow: 'hidden', gap: 1 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 3, lineHeight: 16 },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  postThumb: { width: 48, height: 48, borderRadius: Radius.sm },
  postHeadline: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  statusPillText: { fontSize: 10, fontWeight: '800' },
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
