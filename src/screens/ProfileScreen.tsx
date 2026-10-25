import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator, Dimensions,
  Modal, Pressable, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ENABLE_USER_POST_CREATION } from '../config/features';
import ArticleImage from '../components/ArticleImage';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { Article } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'posts' | 'saved';

const GAP = 2;
const TILE_W = (Dimensions.get('window').width - GAP * 2) / 3;
const TILE_H = TILE_W * 1.35;

function Stat({ value, label, color, sub }: { value: number; label: string; color: string; sub: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: sub }]}>{label}</Text>
    </View>
  );
}

function Tile({ article, status, onPress, colors }: {
  article: Article; status?: string; onPress: () => void; colors: ReturnType<typeof useApp>['colors'];
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.tile, { backgroundColor: colors.surface }]}>
      <ArticleImage uri={article.imgUrl} style={StyleSheet.absoluteFillObject} />
      <View style={styles.tileShade} />
      {status ? (
        <View style={[styles.statusPill, status === 'APPROVED' ? styles.statusOk : status === 'REJECTED' ? styles.statusNo : styles.statusWait]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}
      <Text style={styles.tileText} numberOfLines={3}>{article.headline}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors, savedArticles, selectedRegions } = useApp();
  const { user, userPosts, updateAvatar, updateProfile } = useAuth();
  const [tab, setTab] = useState<Tab>(ENABLE_USER_POST_CREATION ? 'posts' : 'saved');
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const openEdit = () => {
    setNameDraft(user?.displayName ?? '');
    setBioDraft(user?.bio ?? '');
    setEditError('');
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (!nameDraft.trim()) {
      setEditError('Display name cannot be blank.');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await updateProfile({ displayName: nameDraft, bio: bioDraft });
      setEditOpen(false);
    } catch (e) {
      setEditError((e as Error).message || 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  };
  const [uploading, setUploading] = useState(false);

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

    setUploading(true);
    try {
      await updateAvatar(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message ?? 'Could not update your profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const topBar = (title: string) => (
    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
      <View style={{ width: 40 }} />
      <Text style={[styles.topTitle, { color: colors.primaryText }]} numberOfLines={1}>{title}</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Settings')}
        style={styles.topBtn}
        accessibilityLabel="Settings and privacy"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="settings" size={24} color={colors.primaryText} />
      </TouchableOpacity>
    </View>
  );

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        {topBar('Profile')}
        <View style={styles.guest}>
          <View style={[styles.guestAvatar, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <MaterialIcons name="person" size={52} color={colors.hint} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.primaryText }]}>Sign up for Canada247</Text>
          <Text style={[styles.guestSub, { color: colors.secondaryText }]}>
            Save stories, repost videos, follow your regions and get alerts that matter to you.
          </Text>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AuthEmail')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Sign in or create account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handle = (user.displayName || user.email.split('@')[0]).replace(/\s+/g, '').toLowerCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {topBar(`@${handle}`)}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identity}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploading} activeOpacity={0.85}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.avatarText}>{user.displayName?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              {uploading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="camera-alt" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: colors.primaryText }]}>{user.displayName}</Text>
          <Text style={[styles.email, { color: colors.hint }]}>{user.email}</Text>
          {user.bio ? <Text style={[styles.bio, { color: colors.secondaryText }]}>{user.bio}</Text> : null}
          {user.joinedAt ? (
            <Text style={[styles.member, { color: colors.hint }]}>Member since {new Date(user.joinedAt).getFullYear()}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          {ENABLE_USER_POST_CREATION ? (
            <>
              <Stat value={userPosts.length} label="Posts" color={colors.primaryText} sub={colors.hint} />
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            </>
          ) : null}
          <Stat value={savedArticles.length} label="Saved" color={colors.primaryText} sub={colors.hint} />
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <Stat value={selectedRegions.length} label="Regions" color={colors.primaryText} sub={colors.hint} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {ENABLE_USER_POST_CREATION ? (
            <TouchableOpacity
              style={[styles.actionPrimary, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreatePost')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.actionPrimaryText}>Post news</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.actionSecondary, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={openEdit}
            activeOpacity={0.85}
          >
            <MaterialIcons name="edit" size={18} color={colors.primaryText} />
            <Text style={[styles.actionSecondaryText, { color: colors.primaryText }]}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionSecondary, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => navigation.navigate('AlertSetup')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="notifications-none" size={20} color={colors.primaryText} />
            <Text style={[styles.actionSecondaryText, { color: colors.primaryText }]}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIcon, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => navigation.navigate('SavedStories')}
            accessibilityLabel="Saved stories"
            activeOpacity={0.85}
          >
            <MaterialIcons name="bookmark-border" size={20} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.divider }]}>
          {([['posts', 'grid-on'], ['saved', 'bookmark-border']] as const).filter(([key]) => ENABLE_USER_POST_CREATION || key === 'saved').map(([key, icon]) => {
            const active = tab === key;
            return (
              <TouchableOpacity key={key} style={styles.tab} onPress={() => setTab(key)} accessibilityLabel={key}>
                <MaterialIcons name={icon} size={24} color={active ? colors.primaryText : colors.hint} />
                {active ? <View style={[styles.tabUnderline, { backgroundColor: colors.primaryText }]} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Grid */}
        {tab === 'posts' ? (
          userPosts.length === 0 ? (
            <Empty
              icon="edit"
              title="Share what's happening"
              body={ENABLE_USER_POST_CREATION ? 'Stories you post show up here once they are reviewed.' : 'Your posts will appear here.'}
              colors={colors}
            />
          ) : (
            <View style={styles.grid}>
              {userPosts.map(post => (
                <Tile
                  key={post.id}
                  article={post}
                  status={post.status}
                  colors={colors}
                  onPress={() => navigation.navigate('ArticleDetail', { article: post })}
                />
              ))}
            </View>
          )
        ) : savedArticles.length === 0 ? (
          <Empty icon="bookmark-border" title="Nothing saved yet" body="Tap the bookmark on any story to keep it here." colors={colors} />
        ) : (
          <View style={styles.grid}>
            {savedArticles.map(article => (
              <Tile
                key={article.id}
                article={article}
                colors={colors}
                onPress={() => navigation.navigate('ArticleDetail', { article })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.editBackdrop} onPress={() => setEditOpen(false)}>
            <Pressable style={[styles.editSheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.editHandle, { backgroundColor: colors.divider }]} />
              <Text style={[styles.editTitle, { color: colors.primaryText }]}>Edit profile</Text>

              <Text style={[styles.editLabel, { color: colors.hint }]}>Display name</Text>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Enter your display name"
                placeholderTextColor={colors.hint}
                style={[styles.editInput, { color: colors.primaryText, backgroundColor: colors.background, borderColor: colors.divider }]}
              />

              <Text style={[styles.editLabel, { color: colors.hint }]}>Bio</Text>
              <TextInput
                value={bioDraft}
                onChangeText={setBioDraft}
                placeholder="Tell us a little about yourself…"
                placeholderTextColor={colors.hint}
                multiline
                style={[styles.editInput, styles.editBio, { color: colors.primaryText, backgroundColor: colors.background, borderColor: colors.divider }]}
              />

              {editError ? <Text style={styles.editError}>{editError}</Text> : null}

              <TouchableOpacity
                style={[styles.editSave, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
                onPress={saveProfile}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.editSaveText}>Save changes</Text>}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Empty({ icon, title, body, colors }: {
  icon: keyof typeof MaterialIcons.glyphMap; title: string; body: string; colors: ReturnType<typeof useApp>['colors'];
}) {
  return (
    <View style={styles.empty}>
      <MaterialIcons name={icon} size={44} color={colors.hint} />
      <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: colors.hint }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },
  topBtn: { width: 40, alignItems: 'flex-end' },
  identity: { alignItems: 'center', paddingTop: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarText: { color: '#fff', fontSize: 38, fontWeight: '800' },
  cameraBadge: {
    position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3,
  },
  name: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  bio: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginTop: 8, paddingHorizontal: 32 },
  member: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  editBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  editSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32 },
  editHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 999, marginBottom: 14 },
  editTitle: { fontSize: 20, fontWeight: '800', marginBottom: 14 },
  editLabel: { fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  editInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '500' },
  editBio: { minHeight: 84, textAlignVertical: 'top' },
  editError: { color: '#FF453A', fontSize: 13, fontWeight: '600', marginTop: 10 },
  editSave: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  editSaveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  email: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  stat: { alignItems: 'center', paddingHorizontal: 28 },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 26 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20, marginTop: 20 },
  actionPrimary: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 22, height: 44, borderRadius: 8 },
  actionPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  actionSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, height: 44, borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionSecondaryText: { fontSize: 15, fontWeight: '700' },
  actionIcon: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  tabs: { flexDirection: 'row', marginTop: 22, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabUnderline: { position: 'absolute', bottom: -StyleSheet.hairlineWidth, width: 56, height: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: GAP },
  tile: { width: TILE_W, height: TILE_H, overflow: 'hidden', justifyContent: 'flex-end' },
  tileShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  tileText: { color: '#fff', fontSize: 12, fontWeight: '700', padding: 8, lineHeight: 16 },
  statusPill: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusOk: { backgroundColor: '#1E9E5A' },
  statusNo: { backgroundColor: '#D32F2F' },
  statusWait: { backgroundColor: '#B8860B' },
  statusText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyBody: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 19 },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingBottom: 80, gap: 12 },
  guestAvatar: { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  guestTitle: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  guestSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 21 },
  cta: { alignSelf: 'stretch', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
