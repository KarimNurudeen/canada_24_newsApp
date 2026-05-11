import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Image, ScrollView,
} from 'react-native';

const CANADA247_LOGO = require('../../assets/canada247-logo.jpg');
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ENABLE_MANAGE_REGIONS } from '../config/features';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, width * 0.85);

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const NAV_ITEMS = [
  { icon: 'notifications' as const, label: 'Manage My Alerts', screen: 'AlertSetup' },
  { icon: 'settings' as const, label: 'Settings', screen: 'Settings' },
].filter(item => ENABLE_MANAGE_REGIONS || item.screen !== 'ManageRegions');

const EXTERNAL_LINKS: { label: string; icon: keyof typeof MaterialIcons.glyphMap; section: string }[] = [
  { label: 'Opportunities',         icon: 'work',          section: 'Opportunities' },
  { label: 'Immigration',           icon: 'flight-land',   section: 'Immigration' },
  { label: 'Education in Canada',   icon: 'school',        section: 'Education in Canada' },
  { label: 'Events Across Canada',  icon: 'event',         section: 'Events' },
  { label: 'Canada 24/7 Sports',    icon: 'sports',        section: 'Sports' },
  { label: 'Entertainment',         icon: 'movie',         section: 'Entertainment' },
  { label: 'Canada International',  icon: 'language',      section: 'World' },
];

export default function Sidebar({ visible, onClose, onNavigate }: SidebarProps) {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableOpacity
        style={[styles.backdrop]}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Drawer */}
      <View style={[styles.drawer, { backgroundColor: colors.surface, width: DRAWER_WIDTH }]}>
        {/* Canada247 logo banner */}
        <View style={styles.logoBanner}>
          <View style={styles.bannerTopBar} />
          <View style={styles.bannerBody}>
            <Image
              source={CANADA247_LOGO}
              style={styles.bannerLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.sloganRow}>
            <View style={styles.sloganPill}>
              <Text style={styles.sloganText}>CANADA IN REAL TIME</Text>
            </View>
          </View>
          <View style={styles.bannerBottomBar} />
        </View>

        <ScrollView>
          {/* Nav items */}
          {NAV_ITEMS.map(({ icon, label, screen }) => (
            <TouchableOpacity
              key={label}
              style={[styles.navItem, { borderBottomColor: colors.divider + '20' }]}
              onPress={() => { onClose(); onNavigate(screen); }}
              activeOpacity={0.7}
            >
              <MaterialIcons name={icon} size={22} color={colors.primary} />
              <Text style={[styles.navLabel, { color: colors.primaryText }]}>{label}</Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider + '30' }]} />

          {/* More from */}
          <View style={styles.morePadding}>
            <Text style={[styles.moreLabel, { color: colors.secondaryText }]}>
              EXPLORE CANADA IN REAL TIME
            </Text>
          </View>
          {EXTERNAL_LINKS.map(({ label, icon, section }) => (
            <TouchableOpacity
              key={label}
              style={[styles.externalItem, { borderBottomColor: colors.divider + '18' }]}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                navigation.navigate('SectionDetail', { section });
              }}
            >
              <View style={[styles.extIcon, { backgroundColor: colors.primary }]}>
                <MaterialIcons name={icon} size={20} color="#fff" />
              </View>
              <Text style={[styles.extLabel, { color: colors.primaryText }]}>{label}</Text>
              <MaterialIcons name="arrow-forward-ios" size={13} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bottom stripe */}
        <View style={[styles.bottomStripe, { backgroundColor: colors.primary, overflow: 'hidden' }]}>
          <View style={[styles.stripeBand, { backgroundColor: colors.primaryText }]}>
            <Text style={[styles.stripeText, { color: colors.background, opacity: 0.5 }]}>
              IN REAL TIME
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoBanner: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bannerTopBar: {
    height: 5,
    backgroundColor: '#D52B1E',
  },
  bannerBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  bannerLogo: {
    width: DRAWER_WIDTH - 48,
    height: (DRAWER_WIDTH - 48) * 0.42,
  },
  sloganRow: {
    alignItems: 'center',
    paddingBottom: 14,
  },
  sloganPill: {
    backgroundColor: '#D52B1E',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 3,
  },
  sloganText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  bannerBottomBar: {
    height: 5,
    backgroundColor: '#D52B1E',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  navLabel: { fontSize: 15, fontWeight: '700' },
  divider: { height: 1, marginVertical: 16 },
  morePadding: { paddingHorizontal: 24, paddingBottom: 8 },
  moreLabel: { fontSize: 13, fontWeight: '900' },
  externalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  extIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  bottomStripe: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stripeBand: {
    position: 'absolute',
    width: '150%',
    height: 32,
    transform: [{ rotate: '30deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripeText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    letterSpacing: 3,
  },
});
