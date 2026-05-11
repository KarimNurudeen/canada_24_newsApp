import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { CREATE_POST_CATEGORIES } from '../config/content';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';
import { readStoredSession } from '../services/sessionService';
import { playReactionFeedback, showNewContentNotification } from '../services/notificationService';

const CATEGORIES = CREATE_POST_CATEGORIES;

// ─── Markdown Preview ────────────────────────────────────────────────────────

type MarkdownLine =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; text: string; n: number }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string }
  | { type: 'empty' };

function parseMarkdownLines(raw: string): MarkdownLine[] {
  const lines = raw.split('\n');
  const result: MarkdownLine[] = [];
  let numberedCounter = 0;

  for (const line of lines) {
    if (line.trim() === '' || line.trim() === '---') {
      if (line.trim() === '---') { result.push({ type: 'hr' }); numberedCounter = 0; continue; }
      result.push({ type: 'empty' }); numberedCounter = 0; continue;
    }
    if (/^###\s/.test(line)) { result.push({ type: 'h3', text: line.replace(/^###\s/, '') }); numberedCounter = 0; continue; }
    if (/^##\s/.test(line)) { result.push({ type: 'h2', text: line.replace(/^##\s/, '') }); numberedCounter = 0; continue; }
    if (/^#\s/.test(line)) { result.push({ type: 'h1', text: line.replace(/^#\s/, '') }); numberedCounter = 0; continue; }
    if (/^>\s?/.test(line)) { result.push({ type: 'blockquote', text: line.replace(/^>\s?/, '') }); numberedCounter = 0; continue; }
    if (/^[•\-\*]\s/.test(line)) { result.push({ type: 'bullet', text: line.replace(/^[•\-\*]\s/, '') }); numberedCounter = 0; continue; }
    if (/^\d+\.\s/.test(line)) {
      numberedCounter++;
      result.push({ type: 'numbered', text: line.replace(/^\d+\.\s/, ''), n: numberedCounter });
      continue;
    }
    numberedCounter = 0;
    result.push({ type: 'paragraph', text: line });
  }
  return result;
}

function renderInlineMarkdown(text: string, baseStyle: object, colors: any): React.ReactNode {
  // Parse inline bold, italic, code, and link
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|_(.+?)_|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Text key={key++} style={baseStyle}>{text.slice(lastIndex, match.index)}</Text>);
    }
    if (match[2]) {
      parts.push(<Text key={key++} style={[baseStyle, { fontWeight: '800' }]}>{match[2]}</Text>);
    } else if (match[3]) {
      parts.push(<Text key={key++} style={[baseStyle, { fontStyle: 'italic' }]}>{match[3]}</Text>);
    } else if (match[4]) {
      parts.push(
        <Text key={key++} style={[baseStyle, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', backgroundColor: colors.divider + '40', paddingHorizontal: 4 }]}>
          {match[4]}
        </Text>
      );
    } else if (match[5]) {
      parts.push(<Text key={key++} style={[baseStyle, { color: colors.primary, textDecorationLine: 'underline' }]}>{match[5]}</Text>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<Text key={key++} style={baseStyle}>{text.slice(lastIndex)}</Text>);
  }
  return parts.length === 0 ? <Text style={baseStyle}>{text}</Text> : <>{parts}</>;
}

function MarkdownPreview({ body, colors }: { body: string; colors: any }) {
  const lines = parseMarkdownLines(body);

  return (
    <View style={{ paddingTop: 4 }}>
      {lines.map((line, i) => {
        if (line.type === 'empty') return <View key={i} style={{ height: 8 }} />;
        if (line.type === 'hr') {
          return <View key={i} style={[mdStyles.hr, { backgroundColor: colors.divider }]} />;
        }
        if (line.type === 'h1') {
          return (
            <Text key={i} style={[mdStyles.h1, { color: colors.primaryText }]}>
              {renderInlineMarkdown(line.text, { color: colors.primaryText }, colors)}
            </Text>
          );
        }
        if (line.type === 'h2') {
          return (
            <Text key={i} style={[mdStyles.h2, { color: colors.primaryText }]}>
              {renderInlineMarkdown(line.text, { color: colors.primaryText }, colors)}
            </Text>
          );
        }
        if (line.type === 'h3') {
          return (
            <Text key={i} style={[mdStyles.h3, { color: colors.primaryText }]}>
              {renderInlineMarkdown(line.text, { color: colors.primaryText }, colors)}
            </Text>
          );
        }
        if (line.type === 'blockquote') {
          return (
            <View key={i} style={[mdStyles.blockquote, { borderLeftColor: colors.primary, backgroundColor: colors.primary + '0D' }]}>
              <Text style={[mdStyles.blockquoteText, { color: colors.hint }]}>
                {renderInlineMarkdown(line.text, { color: colors.hint, fontStyle: 'italic' }, colors)}
              </Text>
            </View>
          );
        }
        if (line.type === 'bullet') {
          return (
            <View key={i} style={mdStyles.listRow}>
              <Text style={[mdStyles.bullet, { color: colors.primary }]}>•</Text>
              <Text style={[mdStyles.listText, { color: colors.primaryText }]}>
                {renderInlineMarkdown(line.text, { color: colors.primaryText }, colors)}
              </Text>
            </View>
          );
        }
        if (line.type === 'numbered') {
          return (
            <View key={i} style={mdStyles.listRow}>
              <Text style={[mdStyles.bullet, { color: colors.primary, minWidth: 22 }]}>{line.n}.</Text>
              <Text style={[mdStyles.listText, { color: colors.primaryText }]}>
                {renderInlineMarkdown(line.text, { color: colors.primaryText }, colors)}
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={[mdStyles.paragraph, { color: colors.primaryText }]}>
            {renderInlineMarkdown(line.text, { color: colors.primaryText, fontSize: 15, lineHeight: 23 }, colors)}
          </Text>
        );
      })}
    </View>
  );
}

const mdStyles = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '900', marginVertical: 6, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: '800', marginVertical: 5, lineHeight: 24 },
  h3: { fontSize: 16, fontWeight: '700', marginVertical: 4, lineHeight: 22 },
  paragraph: { fontSize: 15, fontWeight: '500', lineHeight: 23, marginVertical: 2 },
  blockquote: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 6, marginVertical: 4 },
  blockquoteText: { fontSize: 14, lineHeight: 21 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 },
  bullet: { fontSize: 15, fontWeight: '700', marginRight: 8, lineHeight: 23, marginTop: 1 },
  listText: { flex: 1, fontSize: 15, lineHeight: 23 },
  hr: { height: 1, marginVertical: 12 },
});

// ─── Formatting Toolbar ───────────────────────────────────────────────────────

type FormatAction =
  | 'bold' | 'italic' | 'h1' | 'h2' | 'h3'
  | 'bullet' | 'numbered' | 'blockquote'
  | 'link' | 'code' | 'hr';

interface ToolbarButton {
  action: FormatAction | 'link';
  icon: string;
  label: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { action: 'bold',       icon: 'format-bold',          label: 'Bold' },
  { action: 'italic',     icon: 'format-italic',         label: 'Italic' },
  { action: 'h1',         icon: 'title',                 label: 'H1' },
  { action: 'h2',         icon: 'text-fields',           label: 'H2' },
  { action: 'bullet',     icon: 'format-list-bulleted',  label: 'Bullet' },
  { action: 'numbered',   icon: 'format-list-numbered',  label: 'Numbered' },
  { action: 'blockquote', icon: 'format-quote',          label: 'Quote' },
  { action: 'code',       icon: 'code',                  label: 'Code' },
  { action: 'link',       icon: 'insert-link',           label: 'Link' },
  { action: 'hr',         icon: 'horizontal-rule',       label: 'Divider' },
];

function applyInlineWrap(text: string, sel: { start: number; end: number }, open: string, close: string, placeholder: string) {
  const before = text.slice(0, sel.start);
  const selected = text.slice(sel.start, sel.end);
  const after = text.slice(sel.end);
  return `${before}${open}${selected || placeholder}${close}${after}`;
}

function applyLinePrefix(text: string, sel: { start: number; end: number }, prefix: string, placeholder: string) {
  const before = text.slice(0, sel.start);
  const selected = text.slice(sel.start, sel.end);
  const after = text.slice(sel.end);
  const lineStart = before.lastIndexOf('\n') === -1 ? '' : '\n';
  if (selected) {
    const lines = selected.split('\n').map(l => `${prefix}${l}`).join('\n');
    return `${before}${lines}${after}`;
  }
  return `${before}${lineStart}${lineStart ? '' : ''}${prefix}${placeholder}${after}`;
}

function applyFormat(
  action: FormatAction,
  text: string,
  sel: { start: number; end: number },
  linkUrl?: string,
): string {
  switch (action) {
    case 'bold':
      return applyInlineWrap(text, sel, '**', '**', 'bold text');
    case 'italic':
      return applyInlineWrap(text, sel, '_', '_', 'italic text');
    case 'code':
      return applyInlineWrap(text, sel, '`', '`', 'code');
    case 'h1': {
      const before = text.slice(0, sel.start);
      const selected = text.slice(sel.start, sel.end);
      const after = text.slice(sel.end);
      const prefix = before.length > 0 && !before.endsWith('\n') ? '\n# ' : '# ';
      return `${before}${prefix}${selected || 'Heading'}${after}`;
    }
    case 'h2': {
      const before = text.slice(0, sel.start);
      const selected = text.slice(sel.start, sel.end);
      const after = text.slice(sel.end);
      const prefix = before.length > 0 && !before.endsWith('\n') ? '\n## ' : '## ';
      return `${before}${prefix}${selected || 'Subheading'}${after}`;
    }
    case 'h3': {
      const before = text.slice(0, sel.start);
      const selected = text.slice(sel.start, sel.end);
      const after = text.slice(sel.end);
      const prefix = before.length > 0 && !before.endsWith('\n') ? '\n### ' : '### ';
      return `${before}${prefix}${selected || 'Subheading'}${after}`;
    }
    case 'bullet': {
      const before = text.slice(0, sel.start);
      const selected = text.slice(sel.start, sel.end);
      const after = text.slice(sel.end);
      if (selected) {
        const lines = selected.split('\n').map(l => `• ${l}`).join('\n');
        return `${before}${lines}${after}`;
      }
      const nl = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
      return `${before}${nl}• ${after}`;
    }
    case 'numbered': {
      const before = text.slice(0, sel.start);
      const selected = text.slice(sel.start, sel.end);
      const after = text.slice(sel.end);
      if (selected) {
        const lines = selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
        return `${before}${lines}${after}`;
      }
      const nl = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
      return `${before}${nl}1. ${after}`;
    }
    case 'blockquote': {
      const before = text.slice(0, sel.start);
      const selected = text.slice(sel.start, sel.end);
      const after = text.slice(sel.end);
      if (selected) {
        const lines = selected.split('\n').map(l => `> ${l}`).join('\n');
        return `${before}${lines}${after}`;
      }
      const nl = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
      return `${before}${nl}> ${after}`;
    }
    case 'hr': {
      const before = text.slice(0, sel.start);
      const after = text.slice(sel.end);
      const pre = before.length > 0 && !before.endsWith('\n') ? '\n\n' : '\n';
      return `${before}${pre}---\n\n${after}`;
    }
    case 'link': {
      const before = text.slice(0, sel.start);
      const selected = text.slice(sel.start, sel.end);
      const after = text.slice(sel.end);
      return `${before}[${selected || 'link text'}](${linkUrl || 'https://'})${after}`;
    }
    default:
      return text;
  }
}

function FormattingToolbar({
  onFormat,
  colors,
}: {
  onFormat: (action: FormatAction | 'link') => void;
  colors: any;
}) {
  return (
    <View style={[tbStyles.container, { backgroundColor: colors.surface, borderTopColor: colors.divider + '60', borderBottomColor: colors.divider + '60' }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tbStyles.row}>
        {TOOLBAR_BUTTONS.map(btn => (
          <TouchableOpacity
            key={btn.action}
            style={tbStyles.btn}
            onPress={() => onFormat(btn.action)}
            activeOpacity={0.6}
          >
            <MaterialIcons name={btn.icon as any} size={20} color={colors.primary} />
            <Text style={[tbStyles.label, { color: colors.hint }]}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const tbStyles = StyleSheet.create({
  container: { borderTopWidth: 1, borderBottomWidth: 1 },
  row: { paddingHorizontal: 8, paddingVertical: 6, gap: 2 },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
    minWidth: 48,
  },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
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
        <View style={[lmStyles.card, { backgroundColor: colors.background, borderColor: colors.divider }]} onStartShouldSetResponder={() => true}>
          <Text style={[lmStyles.title, { color: colors.primaryText }]}>Insert Link</Text>
          <View style={[lmStyles.inputRow, { borderColor: colors.divider, backgroundColor: colors.surface }]}>
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
            <TouchableOpacity style={[lmStyles.cancelBtn, { borderColor: colors.divider }]} onPress={onClose}>
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
  card: { width: '100%', maxWidth: 400, borderWidth: 1, padding: 20, borderRadius: 4 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  input: { flex: 1, fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700' },
  insertBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  insertText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { colors } = useApp();
  const { user, addPost } = useAuth();

  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [localImg, setLocalImg] = useState<string | null>(null);
  const [category, setCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const [imgTab, setImgTab] = useState<'device' | 'url'>('device');
  const [bodyMode, setBodyMode] = useState<'edit' | 'preview'>('edit');
  const [linkModalVisible, setLinkModalVisible] = useState(false);

  const bodySelection = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const headlineOk = headline.trim().length >= 10;
  const bodyOk = body.trim().length >= 20;
  const canSubmit = headlineOk && bodyOk;
  const finalImage = localImg ?? (imgUrl.trim() || undefined);

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
      Alert.alert('Story too short', `Story body needs at least 20 characters (currently ${body.trim().length}).`);
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
      await addPost({ headline, body, category, imgUrl: resolvedImgUrl });
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

  const handleFormat = useCallback((action: FormatAction | 'link') => {
    if (action === 'link') {
      setLinkModalVisible(true);
      return;
    }
    setBody(prev => applyFormat(action as FormatAction, prev, bodySelection.current));
  }, []);

  const handleLinkInsert = useCallback((url: string) => {
    setLinkModalVisible(false);
    setBody(prev => applyFormat('link', prev, bodySelection.current, url));
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEW STORY</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishBtn}>PUBLISH</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Author badge */}
      <View style={[styles.authorBadge, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarInitial}>{user?.displayName?.[0]?.toUpperCase() ?? 'U'}</Text>
        </View>
        <View>
          <Text style={[styles.authorName, { color: colors.primaryText }]}>{user?.displayName}</Text>
          <Text style={[styles.authorEmail, { color: colors.hint }]}>{user?.email}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* Headline */}
          <Text style={[styles.label, { color: colors.primaryText }]}>HEADLINE *</Text>
          <TextInput
            value={headline}
            onChangeText={setHeadline}
            placeholder="Write a clear, descriptive headline..."
            placeholderTextColor={colors.hint}
            style={[styles.headlineInput, { color: colors.primaryText, borderColor: colors.divider + '50', backgroundColor: colors.surface }]}
            multiline
            maxLength={160}
          />
          <Text style={[styles.charCount, { color: colors.hint }]}>{headline.length}/160</Text>

          {/* Category */}
          <Text style={[styles.label, { color: colors.primaryText }]}>CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  { borderColor: colors.primary },
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

          {/* Body header row */}
          <View style={styles.bodyLabelRow}>
            <Text style={[styles.label, { color: colors.primaryText, marginTop: 0, marginBottom: 0 }]}>STORY BODY *</Text>
            <View style={[styles.modeSwitcher, { borderColor: colors.primary }]}>
              <TouchableOpacity
                style={[styles.modeBtn, bodyMode === 'edit' && { backgroundColor: colors.primary }]}
                onPress={() => setBodyMode('edit')}
              >
                <MaterialIcons name="edit" size={13} color={bodyMode === 'edit' ? '#fff' : colors.primary} />
                <Text style={[styles.modeBtnText, { color: bodyMode === 'edit' ? '#fff' : colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, bodyMode === 'preview' && { backgroundColor: colors.primary }]}
                onPress={() => setBodyMode('preview')}
              >
                <MaterialIcons name="visibility" size={13} color={bodyMode === 'preview' ? '#fff' : colors.primary} />
                <Text style={[styles.modeBtnText, { color: bodyMode === 'preview' ? '#fff' : colors.primary }]}>Preview</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Formatting toolbar — shown only in edit mode */}
          {bodyMode === 'edit' && (
            <View style={{ marginTop: 8, marginHorizontal: -16 }}>
              <FormattingToolbar onFormat={handleFormat} colors={colors} />
            </View>
          )}

          {/* Body: edit or preview */}
          {bodyMode === 'edit' ? (
            <>
              <TextInput
                value={body}
                onChangeText={setBody}
                onSelectionChange={e => { bodySelection.current = e.nativeEvent.selection; }}
                placeholder={'Write the full story here.\n\nTip: select text then tap a format button above to style it.'}
                placeholderTextColor={colors.hint}
                style={[styles.bodyInput, { color: colors.primaryText, borderColor: colors.divider + '50', backgroundColor: colors.surface }]}
                multiline
                textAlignVertical="top"
                maxLength={5000}
              />
              <Text style={[styles.charCount, { color: colors.hint }]}>{body.length}/5000</Text>
            </>
          ) : (
            <View style={[styles.previewPane, { borderColor: colors.divider + '50', backgroundColor: colors.surface }]}>
              {body.trim().length === 0 ? (
                <Text style={{ color: colors.hint, fontStyle: 'italic', fontSize: 14 }}>Nothing to preview yet. Switch to Edit and write your story.</Text>
              ) : (
                <MarkdownPreview body={body} colors={colors} />
              )}
            </View>
          )}

          {/* Markdown cheatsheet hint */}
          {bodyMode === 'edit' && (
            <View style={[styles.cheatsheet, { backgroundColor: colors.primary + '0A', borderColor: colors.primary + '25' }]}>
              <Text style={[styles.cheatTitle, { color: colors.primary }]}>Formatting quick-reference</Text>
              <Text style={[styles.cheatText, { color: colors.hint }]}>
                {'**bold**   _italic_   `code`\n# H1   ## H2\n> blockquote\n• bullet   1. numbered\n[link text](url)   --- divider'}
              </Text>
            </View>
          )}

          {/* Image section */}
          <Text style={[styles.label, { color: colors.primaryText }]}>IMAGE (optional)</Text>
          <View style={[styles.tabRow, { borderColor: colors.primary }]}>
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
            <View style={[styles.inputRow, { borderColor: colors.divider + '50', backgroundColor: colors.surface }]}>
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
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
  publishBtn: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 1,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
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
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 16,
  },
  headlineInput: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    borderWidth: 1,
    padding: 12,
    minHeight: 70,
  },
  charCount: { fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 4 },
  categoryScroll: { marginBottom: 4 },
  catChip: {
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 2,
  },
  catText: { fontSize: 12, fontWeight: '800' },
  bodyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBtnText: { fontSize: 12, fontWeight: '800' },
  bodyInput: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    borderWidth: 1,
    padding: 12,
    minHeight: 200,
    marginTop: 8,
  },
  previewPane: {
    borderWidth: 1,
    padding: 14,
    minHeight: 200,
    marginTop: 8,
  },
  cheatsheet: {
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
  },
  cheatTitle: { fontSize: 11, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 },
  cheatText: { fontSize: 11, fontWeight: '500', lineHeight: 17, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  tabRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  tabText: { fontSize: 13, fontWeight: '800' },
  pickBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  pickBtnTitle: { fontSize: 15, fontWeight: '700' },
  pickBtnSub: { fontSize: 12, fontWeight: '500' },
  previewWrap: { position: 'relative' },
  previewImg: { width: '100%', height: 180 },
  removeBtn: {
    position: 'absolute',
    top: 8, right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  urlInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  urlPreview: { width: '100%', height: 160, marginTop: 10 },
  guideBox: {
    marginTop: 20,
    padding: 14,
    borderLeftWidth: 3,
  },
  guideTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  guideText: { fontSize: 12, fontWeight: '500', lineHeight: 19 },
});
