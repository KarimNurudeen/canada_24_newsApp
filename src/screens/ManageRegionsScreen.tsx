import React from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

export default function ManageRegionsScreen() {
  const navigation = useNavigation();
  const { colors, selectedRegions, availableRegions, toggleRegion } = useApp();
  const available = availableRegions.filter(r => !selectedRegions.includes(r));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.primaryText }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={28} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Manage my regions</Text>
        <View style={{ width: 28 }} />
      </View>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
        Add, remove and order your locations to get customized video, stories
      </Text>

      <FlatList
        data={[...selectedRegions.map(r => ({ name: r, selected: true })), ...available.map(r => ({ name: r, selected: false }))]}
        keyExtractor={item => item.name}
        ListHeaderComponent={
          <>
            {selectedRegions.length > 0 && (
              <View style={[styles.sectionHead, { backgroundColor: colors.primary }]}>
                <Text style={styles.sectionHeadText}>MY REGIONS</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => {
          const isFirstAvailable = !item.selected && index === selectedRegions.length;
          return (
            <>
              {isFirstAvailable && (
                <View style={[styles.sectionHead, { backgroundColor: colors.surface, borderTopWidth: 2, borderTopColor: colors.primaryText }]}>
                  <Text style={[styles.sectionHeadText, { color: colors.secondaryText }]}>ALL REGIONS</Text>
                </View>
              )}
              <View style={[styles.regionRow, { borderBottomColor: colors.divider + '20' }]}>
                {item.selected && (
                  <MaterialIcons name="drag-handle" size={22} color={colors.primaryText} style={{ opacity: 0.4 }} />
                )}
                <Text style={[styles.regionName, { color: colors.primaryText, flex: 1 }]}>{item.name}</Text>
                <TouchableOpacity
                  onPress={() => toggleRegion(item.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name={item.selected ? 'remove-circle-outline' : 'add-circle-outline'}
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </>
          );
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Bottom accent */}
      <View style={{ height: 4, backgroundColor: colors.primary }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 2,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    padding: 16,
    lineHeight: 18,
  },
  sectionHead: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionHeadText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  regionName: { fontSize: 15, fontWeight: '700' },
});
