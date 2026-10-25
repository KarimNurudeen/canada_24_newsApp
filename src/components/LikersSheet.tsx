import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Radius } from '../theme';
import UserAvatar from './UserAvatar';
import { useApp } from '../context/AppContext';
import type { Liker } from '../services/socialService';

interface Props {
  visible: boolean;
  count: number;
  likers: Liker[];
  onClose: () => void;
  onOpenProfile: (liker: Liker) => void;
}

/** Bottom sheet listing everyone who liked a story; tap a person to open their profile. */
export default function LikersSheet({ visible, count, likers, onClose, onOpenProfile }: Props) {
  const { colors } = useApp();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.divider }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primaryText }]}>{count} {count === 1 ? 'like' : 'likes'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={22} color={colors.hint} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={likers}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => onOpenProfile(item)} activeOpacity={0.8}>
                <UserAvatar uri={item.avatar} name={item.displayName} size={42} />
                <Text style={[styles.name, { color: colors.primaryText }]} numberOfLines={1}>{item.displayName}</Text>
                <MaterialIcons name="favorite" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '60%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 24 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: Radius.pill, marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  name: { flex: 1, fontSize: 15, fontWeight: '700' },
});
