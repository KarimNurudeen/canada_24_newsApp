import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ArticleEngagementRow from '../components/ArticleEngagementRow';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

export default function SavedScreen() {
  const { colors, savedArticles, toggleSaveArticle } = useApp();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!user) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <MaterialIcons name="bookmark-border" size={64} color={colors.primary} style={{ opacity: 0.6 }} />
        <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>Sign in to save stories</Text>
        <Text style={[styles.emptySubtitle, { color: colors.primaryText }]}>
          Create a free account to bookmark articles and read them anytime.
        </Text>
        <TouchableOpacity
          style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AuthEmail')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="login" size={18} color="#fff" />
          <Text style={styles.signInBtnText}>SIGN IN / CREATE ACCOUNT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (savedArticles.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <MaterialIcons name="bookmark-border" size={64} color={colors.primaryText} style={{ opacity: 0.3 }} />
        <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>
          Your saved stories will appear here.
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.primaryText }]}>
          Tap the bookmark icon on any story to save it for later.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={[styles.listTitle, { color: colors.primaryText }]}>SAVED STORIES</Text>
      </View>
      <FlatList
        data={savedArticles}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.savedCard, {
              backgroundColor: colors.surface,
              borderColor: colors.primaryText,
            }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ArticleDetail', { article: item })}
          >
            {item.imgUrl ? (
              <Image
                source={{ uri: item.imgUrl }}
                style={styles.savedThumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.savedThumb, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                <MaterialIcons name="article" size={28} color="#fff" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              {item.category ? (
                <Text style={[styles.savedCategory, { color: colors.primary }]}>{item.category}</Text>
              ) : null}
              <Text style={[styles.savedHeadline, { color: colors.primaryText }]} numberOfLines={3}>
                {item.headline}
              </Text>
              <Text style={[styles.savedTime, { color: colors.primary }]}>{item.time}</Text>
              <ArticleEngagementRow article={item} style={styles.savedEngagement} />
            </View>
            <TouchableOpacity
              onPress={() => toggleSaveArticle(item)}
              style={{ paddingLeft: 12, paddingTop: 2 }}
            >
              <MaterialIcons name="delete-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
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
  emptySubtitle: { fontSize: 14, fontWeight: '700', textAlign: 'center', opacity: 0.6 },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 24, marginTop: 8,
  },
  signInBtnText: {
    fontFamily: 'BebasNeue_400Regular', fontSize: 16, color: '#fff', letterSpacing: 1,
  },
  listTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  savedCard: {
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  savedThumb: {
    width: 90,
    height: 90,
    flexShrink: 0,
  },
  savedCategory: { fontSize: 10, fontWeight: '900', marginBottom: 3, paddingHorizontal: 12, paddingTop: 10 },
  savedHeadline: { fontSize: 14, fontWeight: '700', lineHeight: 19, paddingHorizontal: 12 },
  savedTime: { fontSize: 11, fontWeight: '700', marginTop: 6, paddingHorizontal: 12, color: '#1976D2' },
  savedEngagement: { paddingHorizontal: 12, paddingBottom: 12 },
});
