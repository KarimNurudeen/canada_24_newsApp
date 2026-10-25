import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { NavigationContainer, createNavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import * as SplashScreen from 'expo-splash-screen';
import { ENABLE_MANAGE_REGIONS, ENABLE_USER_POST_CREATION, ENABLE_SOCIAL_PROFILES } from './src/config/features';
import { AppProvider, useApp } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { InteractionsProvider } from './src/context/InteractionsContext';
import AuthEmailScreen from './src/screens/AuthEmailScreen';
import AuthOTPScreen from './src/screens/AuthOTPScreen';
import SplashScreenView from './src/screens/SplashScreen';
import RegionSelectionScreen from './src/screens/RegionSelectionScreen';
import AlertSetupScreen from './src/screens/AlertSetupScreen';
import ManageRegionsScreen from './src/screens/ManageRegionsScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import LocalNewsScreen from './src/screens/LocalNewsScreen';
import SavedScreen from './src/screens/SavedScreen';
import SectionDetailScreen from './src/screens/SectionDetailScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PublicProfileScreen from './src/screens/PublicProfileScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import LaunchScreen from './src/screens/LaunchScreen';
import MainTabs from './src/navigation/MainTabs';
import NoNetworkOverlay from './src/components/NoNetworkOverlay';
import SignInPrompt from './src/components/SignInPrompt';
import AppBackground from './src/components/AppBackground';
import CapybaraLoader from './src/components/CapybaraLoader';
import SignInRequiredSheet from './src/components/SignInRequiredSheet';
import { setupNotificationHandler, createAndroidChannels } from './src/services/notificationService';
import type { RootStackParamList } from './src/navigation/types';

SplashScreen.preventAutoHideAsync();
setupNotificationHandler();

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** First paint after the loader: a navy curtain draws away to the left while
 * the app slides in from the right, edged with a red line. */
function RevealOnMount({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const t = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(() => setDone(true));
  }, [t]);

  const contentX = t.interpolate({ inputRange: [0, 1], outputRange: [width * 0.3, 0] });
  const contentOpacity = t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] });
  const curtainX = t.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, opacity: contentOpacity, transform: [{ translateX: contentX }] }}>
        {children}
      </Animated.View>
      {done ? null : (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: '#0b1a3a', transform: [{ translateX: curtainX }] }]}
        >
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#FF453A' }} />
        </Animated.View>
      )}
    </View>
  );
}

// Screens are transparent so the app-wide AppBackground shows through.
const transparentTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent', card: 'transparent' },
};

function AppNavigator() {
  const { isAuthLoading } = useAuth();

  useEffect(() => {
    createAndroidChannels();
  }, []);

  if (isAuthLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: 'transparent' } }}>
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
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="LocalNews" component={LocalNewsScreen} />
      <Stack.Screen name="SavedStories" component={SavedScreen} />
      <Stack.Screen name="SectionDetail" component={SectionDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
      {ENABLE_SOCIAL_PROFILES ? (
        <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      ) : null}
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      {ENABLE_USER_POST_CREATION ? (
        <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ animation: 'slide_from_bottom' }} />
      ) : null}
    </Stack.Navigator>
  );
}

function AppWithFonts() {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });
  const [routeName, setRouteName] = useState<string | undefined>();

  const { colors, darkMode } = useApp();
  const { isAuthLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Hand over from the native splash to the animated loader straight away,
  // and keep the loader up long enough to actually be seen.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => setMinTimeElapsed(true), 2200);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded || isAuthLoading || !minTimeElapsed) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <CapybaraLoader />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AppBackground dark={darkMode} />
      <RevealOnMount>
      <NavigationContainer
        theme={transparentTheme}
        ref={navigationRef}
        onReady={() => setRouteName(navigationRef.getCurrentRoute()?.name)}
        onStateChange={() => setRouteName(navigationRef.getCurrentRoute()?.name)}
      >
        <AppNavigator />
      </NavigationContainer>
      <SignInRequiredSheet onSignIn={() => navigationRef.isReady() && navigationRef.navigate('AuthEmail')} />
      <SignInPrompt routeName={routeName} onSignIn={() => navigationRef.isReady() && navigationRef.navigate('AuthEmail')} />
      <NoNetworkOverlay />
      </RevealOnMount>
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
