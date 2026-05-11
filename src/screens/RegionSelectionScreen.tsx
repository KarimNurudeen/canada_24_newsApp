import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegionSelection'>;

export default function RegionSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const { selectedRegions, availableRegions, toggleRegion, colors } = useApp();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.stepLabel, { color: colors.primaryText }]}>Step 1 of 2:</Text>
          <Text style={[styles.title, { color: colors.primaryText }]}>Your Local Canada.</Text>
          <View style={{ height: 8 }} />
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Choose your regions to get local news, events, opportunities and more.
          </Text>
        </View>

        {/* Region list */}
        {availableRegions.map(region => {
          const checked = selectedRegions.includes(region);
          return (
            <TouchableOpacity
              key={region}
              style={[styles.regionItem, { borderBottomColor: colors.divider + '22' }]}
              onPress={() => toggleRegion(region)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                { borderColor: colors.primaryText, backgroundColor: checked ? colors.primary : 'transparent' },
              ]}>
                {checked && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
              <Text style={[styles.regionName, { color: colors.primaryText }]}>{region}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={[styles.bottomBg, { backgroundColor: colors.primary }]} />
        <View style={styles.bottomContent}>
          <Text style={styles.selectedCount}>
            {selectedRegions.length} region{selectedRegions.length !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => navigation.navigate('AlertSetup')}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>NEXT STEP</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: { padding: 24, paddingTop: 48, alignItems: 'center' },
  stepLabel: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    letterSpacing: 1,
  },
  subtitle: { fontSize: 15, fontWeight: '700', textAlign: 'center', lineHeight: 22 },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionName: { fontSize: 17, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 110,
    overflow: 'hidden',
  },
  bottomBg: {
    position: 'absolute',
    top: 30, left: -20, right: -20, bottom: -20,
    transform: [{ rotate: '-3deg' }],
  },
  bottomContent: {
    position: 'absolute',
    bottom: 16, left: 24, right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCount: { color: '#fff', fontSize: 13, fontWeight: '700' },
  nextBtn: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: '#fff',
    letterSpacing: 1,
  },
});
