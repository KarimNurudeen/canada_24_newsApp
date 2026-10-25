import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Radius } from '../theme';
import { useApp } from '../context/AppContext';

interface Props {
  topics: string[];
  value: string | null;
  onChange: (topic: string | null) => void;
  color: string;
}

/** Sub-category picker: a button that opens a dropdown list, replacing a
 * permanent strip of topic tabs (matches the web header dropdowns). */
export default function TopicDropdown({ topics, value, onChange, color }: Props) {
  const { colors } = useApp();
  const [open, setOpen] = useState(false);
  const options: (string | null)[] = [null, ...topics];

  const pick = (topic: string | null) => {
    onChange(topic);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={[styles.button, { borderColor: color }]}
        accessibilityRole="button"
        accessibilityLabel="Choose a topic"
      >
        <Text style={[styles.buttonText, { color }]}>{value ?? 'All topics'}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={color} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderTopColor: color }]}>
            {options.map(topic => {
              const active = topic === value;
              return (
                <TouchableOpacity
                  key={topic ?? 'all'}
                  onPress={() => pick(topic)}
                  style={[styles.option, { borderBottomColor: colors.divider }]}
                >
                  <Text style={[styles.optionText, { color: active ? color : colors.primaryText }, active && { fontWeight: '800' }]}>
                    {topic ?? 'All topics'}
                  </Text>
                  {active ? <MaterialIcons name="check" size={18} color={color} /> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    borderWidth: 1.5, borderRadius: Radius.pill, paddingLeft: 14, paddingRight: 8, paddingVertical: 7,
  },
  buttonText: { fontSize: 13, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopWidth: 3, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, paddingBottom: 24 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 16, fontWeight: '600' },
});
