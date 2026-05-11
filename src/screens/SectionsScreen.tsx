import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SectionList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

const SECTIONS = [
  // ── News ──
  { label: 'Politics',           color: '#D52B1E', icon: 'account-balance' as const,  group: 'NEWS' },
  { label: 'World',              color: '#1A1A1A', icon: 'language' as const,          group: 'NEWS' },
  { label: 'Indigenous',         color: '#8B4513', icon: 'public' as const,            group: 'NEWS' },
  // ── Life & Society ──
  { label: 'Business',           color: '#1565C0', icon: 'trending-up' as const,       group: 'LIFE & SOCIETY' },
  { label: 'Health',             color: '#2E7D32', icon: 'local-hospital' as const,    group: 'LIFE & SOCIETY' },
  { label: 'Education in Canada',color: '#6A1B9A', icon: 'menu-book' as const,         group: 'LIFE & SOCIETY' },
  { label: 'Events',             color: '#AD1457', icon: 'event' as const,             group: 'LIFE & SOCIETY' },
  // ── Tech, Auto & Aviation ──
  { label: 'Technology',         color: '#0277BD', icon: 'devices' as const,           group: 'TECH, AUTO & AVIATION' },
  { label: 'Auto News',          color: '#37474F', icon: 'directions-car' as const,    group: 'TECH, AUTO & AVIATION' },
  { label: 'Aviation',           color: '#1565C0', icon: 'flight' as const,            group: 'TECH, AUTO & AVIATION' },
  // ── Immigration & Opportunities ──
  { label: 'Immigration',        color: '#D52B1E', icon: 'flight-land' as const,       group: 'IMMIGRATION & OPPORTUNITIES' },
  { label: 'Opportunities',      color: '#00695C', icon: 'star' as const,              group: 'IMMIGRATION & OPPORTUNITIES' },
  // ── Culture & Community ──
  { label: 'Sports',             color: '#E65100', icon: 'sports' as const,            group: 'CULTURE & COMMUNITY' },
  { label: 'Entertainment',      color: '#6A1B9A', icon: 'movie' as const,             group: 'CULTURE & COMMUNITY' },
  { label: 'Blacks in Canada',   color: '#1A1A1A', icon: 'people' as const,            group: 'CULTURE & COMMUNITY' },
];

export default function SectionsScreen() {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const grouped = useMemo(() => {
    const map: Record<string, typeof SECTIONS> = {};
    for (const s of SECTIONS) {
      if (!map[s.group]) map[s.group] = [];
      map[s.group].push(s);
    }
    return Object.entries(map).map(([title, data]) => ({ title, data }));
  }, []);

  return (
    <SectionList
      style={{ backgroundColor: colors.background }}
      sections={grouped}
      keyExtractor={item => item.label}
      contentContainerStyle={{ paddingBottom: 40 }}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={[styles.pageTitleBar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.pageTitle, { color: '#fff' }]}>EXPLORE</Text>
          <Text style={[styles.pageSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
            Canada in Real Time — news, culture & opportunities
          </Text>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={[styles.groupHeader, { backgroundColor: colors.background, borderBottomColor: colors.primary }]}>
          <Text style={[styles.groupLabel, { color: colors.primary }]}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.sectionRow, {
            backgroundColor: colors.surface,
            borderLeftColor: item.color,
            borderBottomColor: colors.divider,
          }]}
          activeOpacity={0.72}
          onPress={() => navigation.navigate('SectionDetail', { section: item.label })}
        >
          <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
            <MaterialIcons name={item.icon} size={20} color={item.color} />
          </View>
          <Text style={[styles.sectionLabel, { color: colors.primaryText }]}>{item.label}</Text>
          <MaterialIcons name="arrow-forward-ios" size={13} color={colors.hint} />
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
    />
  );
}

const styles = StyleSheet.create({
  pageTitleBar: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 4,
  },
  pageTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 38,
    letterSpacing: 3,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 18,
  },
  groupHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  groupLabel: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    letterSpacing: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
});
