import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import VideoFeedScreen from '../screens/VideoFeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConcaveTabBar from './ConcaveTabBar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ENABLE_USER_POST_CREATION } from '../config/features';
import { requireAuth } from '../utils/requireAuth';
import type { RootStackParamList } from './types';

const Tab = createBottomTabNavigator();

const Empty = () => null;

/** Tab scenes are transparent (the app-wide pattern shows through), so an
 * inactive tab must hide itself or it bleeds through the active one on web. */
function onlyWhenFocused<P extends object>(Screen: React.ComponentType<P>) {
  return function FocusedScreen(props: P) {
    const focused = useIsFocused();
    return (
      <View style={{ flex: 1, display: focused ? 'flex' : 'none' }}>
        <Screen {...props} />
      </View>
    );
  };
}

const HomeTab = onlyWhenFocused(HomeScreen);
const ExploreTab = onlyWhenFocused(ExploreScreen);
const WatchTab = onlyWhenFocused(VideoFeedScreen);
const ProfileTab = onlyWhenFocused(ProfileScreen);

/** Raised "+" in the middle of the tab bar: starts a new post. */
function PostTabButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <View style={styles.postSlot}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Post news"
        style={[styles.postBtn, { backgroundColor: color }]}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function MainTabs() {
  const { colors } = useApp();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Tab.Navigator
        tabBar={props => <ConcaveTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen
          name="Home"
          component={HomeTab}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialIcons name="description" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Explore"
          component={ExploreTab}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={size} color={color} />,
          }}
        />
        {ENABLE_USER_POST_CREATION ? (
          <Tab.Screen
            name="Post"
            component={Empty}
            options={{
              tabBarLabel: () => null,
              tabBarButton: () => (
                <PostTabButton
                  color={colors.primary}
                  onPress={() => requireAuth(user, navigation, () => navigation.navigate('CreatePost'))}
                />
              ),
            }}
          />
        ) : null}
        <Tab.Screen
          name="Watch"
          component={WatchTab}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialIcons name="live-tv" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileTab}
          options={{
            tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  postSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  postBtn: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
});
