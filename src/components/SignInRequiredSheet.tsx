import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Radius } from '../theme';
import { useApp } from '../context/AppContext';
import { setSignInRequiredListener } from '../utils/requireAuth';

/** Sheet shown when a signed-out user taps something that needs an account
 * (post, repost, save…). Triggered through requireAuth(). */
export default function SignInRequiredSheet({ onSignIn }: { onSignIn: () => void }) {
  const { colors } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setSignInRequiredListener(() => setVisible(true));
    return () => setSignInRequiredListener(null);
  }, []);

  const close = () => setVisible(false);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
            <MaterialIcons name="lock-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primaryText }]}>Sign in required</Text>
          <Text style={[styles.body, { color: colors.secondaryText }]}>
            Create a free account to save articles, repost videos and join the conversation.
          </Text>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: colors.primary }]}
            onPress={() => { close(); onSignIn(); }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>Sign in or create account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={close} style={styles.later}>
            <Text style={[styles.laterText, { color: colors.secondaryText }]}>Not now</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: 24, paddingBottom: 36, alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  body: { fontSize: 14, fontWeight: '500', lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  primary: { alignSelf: 'stretch', borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  later: { paddingTop: 16 },
  laterText: { fontSize: 13, fontWeight: '600' },
});
