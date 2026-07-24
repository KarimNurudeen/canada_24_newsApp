import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radius } from '../theme';
import ArticleRow from '../components/ArticleRow';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

function BackHeader({ title, colors, onBack }: { title: string; colors: ReturnType<typeof useApp>['colors']; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.backHeader, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialIcons name="arrow-back" size={24} color={colors.primaryText} />
      </TouchableOpacity>
      <Text style={[styles.backHeaderTitle, { color: colors.primaryText }]}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

export default function SavedScreen() {
  const { colors, savedArticles, toggleSaveArticle } = useApp();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <BackHeader title="Saved Stories" colors={colors} onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <MaterialIcons name="bookmark-border" size={64} color={colors.primary} style={{ opacity: 0.6 }} />
          <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>Sign in to save stories</Text>
          <Text style={[styles.emptySubtitle, { color: colors.hint }]}>
            Create a free account to bookmark articles and read them anytime.
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AuthEmail')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="login" size={18} color="#fff" />
            <Text style={styles.signInBtnText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (savedArticles.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <BackHeader title="Saved Stories" colors={colors} onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <MaterialIcons name="bookmark-border" size={64} color={colors.primaryText} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>
            Your saved stories will appear here.
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.hint }]}>
            Tap the bookmark icon on any story to save it for later.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Saved Stories" colors={colors} onBack={() => navigation.goBack()} />
      <FlatList
        data={savedArticles}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }} />}
        renderItem={({ item }) => (
          <ArticleRow
            article={item}
            trailingIcon="close"
            onTrailingPress={() => toggleSaveArticle(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 24, marginTop: 8,
    borderRadius: Radius.pill,
  },
  signInBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backHeaderTitle: { fontSize: 17, fontWeight: '700' },
});
