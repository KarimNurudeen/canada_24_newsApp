import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import * as SplashScreen from 'expo-splash-screen';
import { ENABLE_MANAGE_REGIONS, ENABLE_USER_POST_CREATION } from './src/config/features';
import { AppProvider, useApp } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { InteractionsProvider } from './src/context/InteractionsContext';
import AuthEmailScreen from './src/screens/AuthEmailScreen';
import AuthOTPScreen from './src/screens/AuthOTPScreen';
import SplashScreenView from './src/screens/SplashScreen';
import RegionSelectionScreen from './src/screens/RegionSelectionScreen';
import AlertSetupScreen from './src/screens/AlertSetupScreen';
import ManageRegionsScreen from './src/screens/ManageRegionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import SearchScreen from './src/screens/SearchScreen';
import SectionDetailScreen from './src/screens/SectionDetailScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import LaunchScreen from './src/screens/LaunchScreen';
import MainTabs from './src/navigation/MainTabs';
import { setupNotificationHandler, createAndroidChannels } from './src/services/notificationService';
import type { RootStackParamList } from './src/navigation/types';

SplashScreen.preventAutoHideAsync();
setupNotificationHandler();

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthLoading } = useAuth();

  useEffect(() => {
    createAndroidChannels();
  }, []);

  if (isAuthLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {/* Always shown first on every launch */}
      <Stack.Screen name="Launch" component={LaunchScreen} />
      {/* Onboarding */}
      <Stack.Screen name="Splash" component={SplashScreenView} />
      <Stack.Screen name="RegionSelection" component={RegionSelectionScreen} />
      {/* Main app */}
      <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
      {/* Always-available screens */}
      <Stack.Screen name="AuthEmail" component={AuthEmailScreen} />
      <Stack.Screen name="AuthOTP" component={AuthOTPScreen} />
      <Stack.Screen name="AlertSetup" component={AlertSetupScreen} />
      {ENABLE_MANAGE_REGIONS ? (
        <Stack.Screen name="ManageRegions" component={ManageRegionsScreen} />
      ) : null}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="SectionDetail" component={SectionDetailScreen} />
      {ENABLE_USER_POST_CREATION ? (
        <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ animation: 'slide_from_bottom' }} />
      ) : null}
    </Stack.Navigator>
  );
}

function AppWithFonts() {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AuthProvider>
          <InteractionsProvider>
            <AppWithFonts />
          </InteractionsProvider>
        </AuthProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
