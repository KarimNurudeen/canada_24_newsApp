import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ENABLE_MANAGE_REGIONS } from '../config/features';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

interface AppHeaderProps {
  title: string;
  onMenuPress: () => void;
}

export default function AppHeader({ title, onMenuPress }: AppHeaderProps) {
  const { colors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={[styles.container, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="menu" size={28} color={colors.background} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.background }]}>{title}</Text>
        <View style={styles.actions}>
          {ENABLE_MANAGE_REGIONS ? (
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => navigation.navigate('ManageRegions')}
            >
              <MaterialIcons name="cast" size={24} color={colors.background} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: ENABLE_MANAGE_REGIONS ? 16 : 0 }}
            onPress={() => navigation.navigate('Search')}
          >
            <MaterialIcons name="search" size={24} color={colors.background} />
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: 16 }}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialIcons name="more-vert" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 60,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
