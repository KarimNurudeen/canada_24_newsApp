import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type OnChangeStateEvent,
  type OnChangeSelectionEvent,
} from 'react-native-enriched-html';
import { CREATE_POST_CATEGORIES } from '../config/content';
import { Radius, SoftShadow } from '../theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';
import { readStoredSession } from '../services/sessionService';
import { slugifyValue } from '../services/newsService';
import { playReactionFeedback, showNewContentNotification } from '../services/notificationService';

const CATEGORIES = CREATE_POST_CATEGORIES;

// ─── Formatting Toolbar ───────────────────────────────────────────────────────

type ToolbarAction =
  | 'bold' | 'italic' | 'inlineCode'
  | 'h1' | 'h2'
  | 'unorderedList' | 'orderedList' | 'blockQuote'
  | 'link';

interface ToolbarButtonDef {
  action: ToolbarAction;
  icon: string;
}

const TOOLBAR_GROUPS: ToolbarButtonDef[][] = [
  [
    { action: 'bold', icon: 'format-bold' },
    { action: 'italic', icon: 'format-italic' },
    { action: 'inlineCode', icon: 'code' },
  ],
  [
    { action: 'h1', icon: 'title' },
    { action: 'h2', icon: 'text-fields' },
  ],
  [
    { action: 'unorderedList', icon: 'format-list-bulleted' },
    { action: 'orderedList', icon: 'format-list-numbered' },
    { action: 'blockQuote', icon: 'format-quote' },
  ],
  [
    { action: 'link', icon: 'insert-link' },
  ],
];

function FormattingToolbar({
  state,
  onFormat,
  colors,
}: {
  state: OnChangeStateEvent | null;
  onFormat: (action: ToolbarAction) => void;
  colors: any;
}) {
  const isActive = (action: ToolbarAction) => {
    if (!state) return false;
    if (action === 'link') return state.link?.isActive ?? false;
    return (state as any)[action]?.isActive ?? false;
  };

  return (
    <View style={[tbStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tbStyles.row}>
        {TOOLBAR_GROUPS.map((group, groupIndex) => (
          <View key={groupIndex} style={[tbStyles.group, { backgroundColor: colors.surface }, SoftShadow]}>
            {group.map(btn => {
              const active = isActive(btn.action);
              return (
                <TouchableOpacity
                  key={btn.action}
                  style={[tbStyles.btn, active && { backgroundColor: colors.primary }]}
                  onPress={() => onFormat(btn.action)}
                  activeOpacity={0.6}
                >
                  <MaterialIcons name={btn.icon as any} size={19} color={active ? '#fff' : colors.primary} />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const tbStyles = StyleSheet.create({
  container: { paddingVertical: 2 },
  row: { paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  group: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 4,
    gap: 2,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 32,
    borderRadius: Radius.pill,
  },
});

// ─── Link Modal ───────────────────────────────────────────────────────────────

function LinkModal({
  visible,
  onClose,
  onInsert,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
  colors: any;
}) {
  const [url, setUrl] = useState('');

  const handleInsert = () => {
    const trimmed = url.trim();
    if (!trimmed) { onClose(); return; }
    onInsert(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    setUrl('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={lmStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[lmStyles.card, { backgroundColor: colors.background }, SoftShadow]} onStartShouldSetResponder={() => true}>
          <Text style={[lmStyles.title, { color: colors.primaryText }]}>Insert Link</Text>
          <View style={[lmStyles.inputRow, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="link" size={18} color={colors.hint} style={{ marginRight: 8 }} />
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com"
              placeholderTextColor={colors.hint}
              style={[lmStyles.input, { color: colors.primaryText }]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              autoFocus
              onSubmitEditing={handleInsert}
            />
          </View>
          <View style={lmStyles.btnRow}>
            <TouchableOpacity style={[lmStyles.cancelBtn, { backgroundColor: colors.surface }]} onPress={onClose}>
              <Text style={[lmStyles.cancelText, { color: colors.hint }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[lmStyles.insertBtn, { backgroundColor: colors.primary }]} onPress={handleInsert}>
              <Text style={lmStyles.insertText}>Insert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const lmStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, padding: 20, borderRadius: Radius.lg },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  input: { flex: 1, fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: Radius.pill, paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700' },
  insertBtn: { flex: 1, borderRadius: Radius.pill, paddingVertical: 10, alignItems: 'center' },
  insertText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { colors, availableRegions } = useApp();
  const { user, addPost } = useAuth();

  const [postType, setPostType] = useState<'article' | 'video'>('article');

  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [localImg, setLocalImg] = useState<string | null>(null);
  const [category, setCategory] = useState('General');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imgTab, setImgTab] = useState<'device' | 'url'>('device');
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [styleState, setStyleState] = useState<OnChangeStateEvent | null>(null);

  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [localVideo, setLocalVideo] = useState<string | null>(null);

  const editorRef = useRef<EnrichedTextInputInstance>(null);
  const selectionRef = useRef<OnChangeSelectionEvent>({ start: 0, end: 0, text: '' });

  const headlineOk = headline.trim().length >= 10;
  const bodyOk = bodyText.trim().length >= 20;
  const videoTitleOk = videoTitle.trim().length >= 5;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setLocalImg(result.assets[0].uri);
      setImgUrl('');
    }
  };

  const handleRemoveImage = () => {
    setLocalImg(null);
    setImgUrl('');
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library to attach a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 90,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setLocalVideo(result.assets[0].uri);
    }
  };

  const handleRemoveVideo = () => setLocalVideo(null);

  const toggleRegionTag = (region: string) => {
    setSelectedRegions(current =>
      current.includes(region) ? current.filter(r => r !== region) : [...current, region]
    );
  };

  const uploadLocalImage = async (localUri: string): Promise<string> => {
    const session = await readStoredSession();
    if (!session) throw new Error('Not authenticated');

    const filename = localUri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const form = new FormData();
    form.append('image', { uri: localUri, name: filename, type: mime } as unknown as Blob);

    const response = await fetch(`${API_BASE_URL}/news/upload-image/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: form,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail ?? 'Upload failed');
    }

    const data = await response.json() as { url: string };
    return data.url;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!headlineOk) {
      Alert.alert('Headline too short', `Headline needs at least 10 characters (currently ${headline.trim().length}).`);
      return;
    }
    if (!bodyOk) {
      Alert.alert('Story too short', `Story body needs at least 20 characters (currently ${bodyText.trim().length}).`);
      return;
    }
    setSubmitting(true);
    try {
      let resolvedImgUrl = imgUrl.trim() || undefined;
      if (localImg) {
        try {
          resolvedImgUrl = await uploadLocalImage(localImg);
        } catch (e) {
          Alert.alert('Image upload failed', (e as Error).message ?? 'Could not upload image. The story will be posted without it.');
          resolvedImgUrl = undefined;
        }
      }
      await addPost({
        headline, body, category, imgUrl: resolvedImgUrl,
        regionSlugs: selectedRegions.map(slugifyValue),
      });
      void playReactionFeedback();
      void showNewContentNotification({
        title: 'Story Submitted!',
        body: headline.length > 60 ? headline.slice(0, 60) + '…' : headline,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to submit your story. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitVideo = async () => {
    if (!user) return;
    if (!videoTitleOk) {
      Alert.alert('Title too short', `Title needs at least 5 characters (currently ${videoTitle.trim().length}).`);
      return;
    }
    if (!localVideo) {
      Alert.alert('No video selected', 'Pick a video from your device first.');
      return;
    }
    setSubmitting(true);
    try {
      const session = await readStoredSession();
      if (!session) throw new Error('Not authenticated');

      const filename = localVideo.split('/').pop() ?? 'video.mp4';
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'mp4';
      const mime = ext === 'mov' ? 'video/quicktime' : ext === 'webm' ? 'video/webm' : ext === 'm4v' ? 'video/x-m4v' : 'video/mp4';

      const form = new FormData();
      form.append('title', videoTitle.trim());
      form.append('description', videoDescription.trim());
      form.append('video_file', { uri: localVideo, name: filename, type: mime } as unknown as Blob);

      const response = await fetch(`${API_BASE_URL}/news/video-posts/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: form,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? 'Upload failed');
      }

      void playReactionFeedback();
      void showNewContentNotification({
        title: 'Video Submitted!',
        body: 'Your video is pending review and will appear once approved.',
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', (e as Error).message ?? 'Failed to submit your video. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormat = (action: ToolbarAction) => {
    const editor = editorRef.current;
    if (!editor) return;
    switch (action) {
      case 'bold': return editor.toggleBold();
      case 'italic': return editor.toggleItalic();
      case 'inlineCode': return editor.toggleInlineCode();
      case 'h1': return editor.toggleH1();
      case 'h2': return editor.toggleH2();
      case 'unorderedList': return editor.toggleUnorderedList();
      case 'orderedList': return editor.toggleOrderedList();
      case 'blockQuote': return editor.toggleBlockQuote();
      case 'link': setLinkModalVisible(true); return;
    }
  };

  const handleLinkInsert = (url: string) => {
    setLinkModalVisible(false);
    const { start, end, text } = selectionRef.current;
    editorRef.current?.setLink(start, end, text || url, url);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{postType === 'article' ? 'New Story' : 'New Video'}</Text>
        <TouchableOpacity
          onPress={postType === 'article' ? handleSubmit : handleSubmitVideo}
          disabled={submitting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishBtn}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Author badge */}
      <View style={[styles.authorBadge, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarInitial}>{user?.displayName?.[0]?.toUpperCase() ?? 'U'}</Text>
        </View>
        <View>
          <Text style={[styles.authorName, { color: colors.primaryText }]}>{user?.displayName}</Text>
          <Text style={[styles.authorEmail, { color: colors.hint }]}>{user?.email}</Text>
        </View>
      </View>

      {/* Post type toggle */}
      <View style={[styles.tabRow, { backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 12 }]}>
        <TouchableOpacity
          style={[styles.tab, postType === 'article' && { backgroundColor: colors.primary }]}
          onPress={() => setPostType('article')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="article" size={16} color={postType === 'article' ? '#fff' : colors.primary} />
          <Text style={[styles.tabText, { color: postType === 'article' ? '#fff' : colors.primary }]}>Article</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, postType === 'video' && { backgroundColor: colors.primary }]}
          onPress={() => setPostType('video')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="videocam" size={16} color={postType === 'video' ? '#fff' : colors.primary} />
          <Text style={[styles.tabText, { color: postType === 'video' ? '#fff' : colors.primary }]}>Video</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {postType === 'video' ? (
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <Text style={[styles.label, { color: colors.primaryText, marginTop: 4 }]}>Title *</Text>
          <TextInput
            value={videoTitle}
            onChangeText={setVideoTitle}
            placeholder="Give your video a short, clear title..."
            placeholderTextColor={colors.hint}
            style={[styles.headlineInput, { color: colors.primaryText, backgroundColor: colors.surface }]}
            multiline
            maxLength={160}
          />
          <Text style={[styles.charCount, { color: colors.hint }]}>{videoTitle.length}/160</Text>

          <Text style={[styles.label, { color: colors.primaryText }]}>Description (optional)</Text>
          <TextInput
            value={videoDescription}
            onChangeText={setVideoDescription}
            placeholder="Add a short description..."
            placeholderTextColor={colors.hint}
            style={[styles.bodyInput, { color: colors.primaryText, backgroundColor: colors.surface, minHeight: 100 }]}
            multiline
          />

          <Text style={[styles.label, { color: colors.primaryText }]}>Video *</Text>
          {localVideo ? (
            <View style={styles.previewWrap}>
              <View style={[styles.videoPreviewPlaceholder, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="movie" size={40} color={colors.primary} />
                <Text style={{ color: colors.hint, fontSize: 12, fontWeight: '600', marginTop: 6 }}>Video selected</Text>
              </View>
              <TouchableOpacity style={[styles.removeBtn, { backgroundColor: colors.primary }]} onPress={handleRemoveVideo}>
                <MaterialIcons name="close" size={18} color="#fff" />
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.pickBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '0D' }]}
              onPress={handlePickVideo}
              activeOpacity={0.75}
            >
              <MaterialIcons name="video-library" size={36} color={colors.primary} />
              <Text style={[styles.pickBtnTitle, { color: colors.primary }]}>Tap to select a video</Text>
              <Text style={[styles.pickBtnSub, { color: colors.hint }]}>MP4, MOV — up to 90 seconds, 100 MB</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.guideBox, { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary }]}>
            <Text style={[styles.guideTitle, { color: colors.primary }]}>Community Guidelines</Text>
            <Text style={[styles.guideText, { color: colors.hint }]}>
              {'• Share accurate, relevant video content\n• No misinformation, hate speech, or personal attacks\n• Videos are reviewed before appearing publicly'}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
        ) : (
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* Headline */}
          <Text style={[styles.label, { color: colors.primaryText }]}>Headline *</Text>
          <TextInput
            value={headline}
            onChangeText={setHeadline}
            placeholder="Write a clear, descriptive headline..."
            placeholderTextColor={colors.hint}
            style={[styles.headlineInput, { color: colors.primaryText, backgroundColor: colors.surface }]}
            multiline
            maxLength={160}
          />
          <Text style={[styles.charCount, { color: colors.hint }]}>{headline.length}/160</Text>

          {/* Category */}
          <Text style={[styles.label, { color: colors.primaryText }]}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  { backgroundColor: colors.surface },
                  category === cat && { backgroundColor: colors.primary },
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catText, { color: category === cat ? '#fff' : colors.primary }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Regions */}
          {availableRegions.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.primaryText }]}>Regions (optional)</Text>
              <Text style={[styles.regionsHint, { color: colors.hint }]}>
                Tag the regions this story is most relevant to — it'll then also show up in Local News for those areas.
              </Text>
              <View style={styles.regionsWrap}>
                {availableRegions.map(region => {
                  const active = selectedRegions.includes(region);
                  return (
                    <TouchableOpacity
                      key={region}
                      style={[
                        styles.catChip,
                        { backgroundColor: colors.surface },
                        active && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => toggleRegionTag(region)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.catText, { color: active ? '#fff' : colors.primary }]}>
                        {region}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Body */}
          <Text style={[styles.label, { color: colors.primaryText }]}>Story Body *</Text>
          <FormattingToolbar state={styleState} onFormat={handleFormat} colors={colors} />
          <EnrichedTextInput
            ref={editorRef}
            placeholder="Write the full story here..."
            placeholderTextColor={colors.hint}
            onChangeHtml={e => setBody(e.nativeEvent.value)}
            onChangeText={e => setBodyText(e.nativeEvent.value)}
            onChangeState={e => setStyleState(e.nativeEvent)}
            onChangeSelection={e => { selectionRef.current = e.nativeEvent; }}
            style={{ ...styles.bodyInput, color: colors.primaryText, backgroundColor: colors.surface }}
          />
          <Text style={[styles.charCount, { color: colors.hint }]}>{bodyText.length} characters</Text>

          {/* Image section */}
          <Text style={[styles.label, { color: colors.primaryText }]}>Image (optional)</Text>
          <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.tab, imgTab === 'device' && { backgroundColor: colors.primary }]}
              onPress={() => { setImgTab('device'); setImgUrl(''); }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="photo-library" size={16} color={imgTab === 'device' ? '#fff' : colors.primary} />
              <Text style={[styles.tabText, { color: imgTab === 'device' ? '#fff' : colors.primary }]}>From Device</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, imgTab === 'url' && { backgroundColor: colors.primary }]}
              onPress={() => { setImgTab('url'); setLocalImg(null); }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="link" size={16} color={imgTab === 'url' ? '#fff' : colors.primary} />
              <Text style={[styles.tabText, { color: imgTab === 'url' ? '#fff' : colors.primary }]}>From URL</Text>
            </TouchableOpacity>
          </View>

          {imgTab === 'device' && (
            localImg ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: localImg }} style={styles.previewImg} resizeMode="cover" />
                <TouchableOpacity style={[styles.removeBtn, { backgroundColor: colors.primary }]} onPress={handleRemoveImage}>
                  <MaterialIcons name="close" size={18} color="#fff" />
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.pickBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '0D' }]}
                onPress={handlePickImage}
                activeOpacity={0.75}
              >
                <MaterialIcons name="add-photo-alternate" size={36} color={colors.primary} />
                <Text style={[styles.pickBtnTitle, { color: colors.primary }]}>Tap to select a photo</Text>
                <Text style={[styles.pickBtnSub, { color: colors.hint }]}>JPG, PNG — cropped to 16:9</Text>
              </TouchableOpacity>
            )
          )}

          {imgTab === 'url' && (
            <View style={[styles.inputRow, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="image" size={18} color={colors.hint} style={{ marginRight: 8 }} />
              <TextInput
                value={imgUrl}
                onChangeText={v => { setImgUrl(v); setLocalImg(null); }}
                placeholder="https://..."
                placeholderTextColor={colors.hint}
                style={[styles.urlInput, { color: colors.primaryText }]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {imgUrl.trim().length > 0 && (
                <TouchableOpacity onPress={() => setImgUrl('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="close" size={18} color={colors.hint} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {imgTab === 'url' && imgUrl.trim().length > 8 && (
            <Image source={{ uri: imgUrl.trim() }} style={styles.urlPreview} resizeMode="cover" />
          )}

          {/* Guidelines */}
          <View style={[styles.guideBox, { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary }]}>
            <Text style={[styles.guideTitle, { color: colors.primary }]}>Community Guidelines</Text>
            <Text style={[styles.guideText, { color: colors.hint }]}>
              {'• Share accurate, fact-based news relevant to Canadians\n• Cite sources where possible\n• No misinformation, hate speech, or personal attacks\n• Stories may be reviewed before appearing publicly'}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
        )}
      </KeyboardAvoidingView>

      <LinkModal
        visible={linkModalVisible}
        onClose={() => setLinkModalVisible(false)}
        onInsert={handleLinkInsert}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  publishBtn: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  avatar: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 16, fontWeight: '900' },
  authorName: { fontSize: 14, fontWeight: '800' },
  authorEmail: { fontSize: 12, fontWeight: '500' },
  scroll: { padding: 16 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 8,
    marginTop: 16,
  },
  headlineInput: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    borderRadius: Radius.md,
    padding: 14,
    minHeight: 70,
  },
  charCount: { fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 4 },
  categoryScroll: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: Radius.pill,
  },
  catText: { fontSize: 12, fontWeight: '700' },
  regionsHint: { fontSize: 12, fontWeight: '500', lineHeight: 17, marginBottom: 10 },
  regionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bodyInput: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    borderRadius: Radius.md,
    padding: 14,
    minHeight: 200,
    maxHeight: 320,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 3,
    gap: 2,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  pickBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  pickBtnTitle: { fontSize: 15, fontWeight: '700' },
  pickBtnSub: { fontSize: 12, fontWeight: '500' },
  previewWrap: { position: 'relative', borderRadius: Radius.md, overflow: 'hidden' },
  previewImg: { width: '100%', height: 180 },
  videoPreviewPlaceholder: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },
  removeBtn: {
    position: 'absolute',
    top: 8, right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  removeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  urlInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  urlPreview: { width: '100%', height: 160, marginTop: 10, borderRadius: Radius.md },
  guideBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
  },
  guideTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  guideText: { fontSize: 12, fontWeight: '500', lineHeight: 19 },
});
