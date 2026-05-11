import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import { ENABLE_MANAGE_REGIONS } from '../config/features';
import TopStoriesScreen from '../screens/TopStoriesScreen';
import LocalNewsScreen from '../screens/LocalNewsScreen';
import VideoFeedScreen from '../screens/VideoFeedScreen';
import SavedScreen from '../screens/SavedScreen';
import SectionsScreen from '../screens/SectionsScreen';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from './types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const Tab = createBottomTabNavigator();

const TAB_LABELS: Record<string, string> = {
  TopStories: 'CANADA IN REAL TIME',
  Local: 'LOCAL',
  Video: 'VIDEO',
  Saved: 'SAVED',
  Sections: 'EXPLORE',
};

export default function MainTabs() {
  const { colors } = useApp();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('TopStories');
  const navigation = useNavigation<Nav>();

  const handleSidebarNavigate = (screen: string) => {
    if (screen === 'ManageRegions' && ENABLE_MANAGE_REGIONS) navigation.navigate('ManageRegions');
    else if (screen === 'Settings') navigation.navigate('Settings');
    else if (screen === 'AlertSetup') navigation.navigate('AlertSetup');
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        title={TAB_LABELS[activeTab] || 'CANADA IN REAL TIME'}
        onMenuPress={() => setSidebarVisible(true)}
      />
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopWidth: 4,
              borderTopColor: colors.secondary,
              height: 70,
              paddingBottom: 8,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.secondaryText,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '900' },
          }}
          screenListeners={{
            state: (e) => {
              const routes = (e.data as any)?.state?.routes;
              const index = (e.data as any)?.state?.index;
              if (routes && index !== undefined) {
                setActiveTab(routes[index].name);
              }
            },
          }}
        >
          <Tab.Screen
            name="TopStories"
            component={TopStoriesScreen}
            options={{
              tabBarLabel: 'Top Stories',
              tabBarIcon: ({ color, focused }) => (
                <MaterialIcons name={focused ? 'description' : 'description'} size={26} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Local"
            component={LocalNewsScreen}
            options={{
              tabBarLabel: 'Local',
              tabBarIcon: ({ color, focused }) => (
                <MaterialIcons name={focused ? 'near-me' : 'location-on'} size={26} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Video"
            component={VideoFeedScreen}
            options={{
              tabBarLabel: 'Video',
              tabBarIcon: ({ color, focused }) => (
                <MaterialIcons name={focused ? 'play-circle-filled' : 'play-circle-outline'} size={26} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Saved"
            component={SavedScreen}
            options={{
              tabBarLabel: 'Saved',
              tabBarIcon: ({ color, focused }) => (
                <MaterialIcons name={focused ? 'bookmark' : 'bookmark-border'} size={26} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Sections"
            component={SectionsScreen}
            options={{
              tabBarLabel: 'Explore',
              tabBarIcon: ({ color, focused }) => (
                <MaterialIcons name={focused ? 'menu' : 'menu-open'} size={26} color={color} />
              ),
            }}
          />
        </Tab.Navigator>

        {/* Sidebar overlay on top of tabs */}
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onNavigate={handleSidebarNavigate}
        />
      </View>
    </SafeAreaView>
  );
}
