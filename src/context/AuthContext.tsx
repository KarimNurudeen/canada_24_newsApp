import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiRequest } from '../services/api';
import { CATEGORY_CODES } from '../config/content';
import { useApp, type ServerAlertPreferences, type ServerRegion } from './AppContext';
import { mapBackendArticle, mapBackendUserPost } from '../services/newsService';
import {
  clearStoredSession,
  readStoredSession,
  requestWithStoredSession,
  writeStoredSession,
} from '../services/sessionService';

export type UserPostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  joinedAt: string;
  avatar?: string;
  bio?: string;
}

export interface UserPost {
  id: string;
  headline: string;
  body: string;
  category?: string;
  time: string;
  imgUrl?: string;
  isLive?: boolean;
  isUserPost: true;
  status: UserPostStatus;
  authorEmail: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

type BackendAuthUser = {
  id: number;
  email: string;
  display_name: string;
  avatar: string;
  bio: string;
  joined_at: string;
};

type BackendUserPost = {
  id: number;
  headline: string;
  body: string;
  category: string;
  img_url: string;
  status: UserPostStatus;
  created_at: string;
  updated_at: string;
  time: string;
  author_name: string;
  author_email: string;
};

type VerifyOtpResponse = {
  access: string;
  refresh: string;
  is_new_user: boolean;
  user: BackendAuthUser;
};

type SendOtpResponse = {
  detail: string;
  dev_code?: string;
};

type BootstrapResponse = {
  user: BackendAuthUser;
  regions: ServerRegion[];
  region_slugs: string[];
  alerts: ServerAlertPreferences;
  saved_articles: BackendArticle[];
  my_posts: BackendUserPost[];
};

type BackendArticle = {
  id: number;
  external_id: string;
  headline: string;
  body: string;
  category: string;
  img_url: string;
  source_url: string;
  author: string;
  published_at: string;
  time: string;
  is_live: boolean;
  is_updated: boolean;
  source: string;
  feed_key: string;
  region_slugs: string[];
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  reposts_count: number;
  saves_count: number;
  user_reaction: 'like' | 'dislike' | null;
  is_saved: boolean;
  is_reposted: boolean;
};

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type CreatePostInput = {
  headline: string;
  body: string;
  category: string;
  imgUrl?: string;
};

function toCategoryCode(label: string): string {
  return CATEGORY_CODES[label] ?? label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthLoading: boolean;
  userPosts: UserPost[];
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  addPost: (post: CreatePostInput) => Promise<UserPost>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapBackendUser(user: BackendAuthUser): AuthUser {
  return {
    id: String(user.id),
    email: user.email,
    displayName: user.display_name,
    joinedAt: user.joined_at,
    avatar: user.avatar || undefined,
    bio: user.bio || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrateServerState, clearServerState } = useApp();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const persistSession = async (nextSession: StoredSession | null) => {
    setSession(nextSession);
    if (nextSession) {
      await writeStoredSession(nextSession);
    } else {
      await clearStoredSession();
    }
  };

  const syncBootstrap = async (currentSession: StoredSession) => {
    const { data, session: nextSession } = await requestWithStoredSession<BootstrapResponse, StoredSession>(currentSession, '/auth/bootstrap/');
    const resolvedSession: StoredSession = {
      ...nextSession,
      user: mapBackendUser(data.user),
    };

    await persistSession(resolvedSession);
    hydrateServerState({
      regionNames: data.regions.map(item => item.name),
      alerts: data.alerts,
      savedArticles: data.saved_articles.map(mapBackendArticle),
    });
    setUserPosts(data.my_posts.map(mapBackendUserPost));

    // Register Expo push token silently after login
    void registerPushToken(resolvedSession);
  };

  const registerPushToken = async (currentSession: StoredSession) => {
    try {
      if (!Device.isDevice) return; // simulators don't get push tokens
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await requestWithStoredSession(currentSession, '/notifications/push-token/', {
        method: 'POST',
        body: JSON.stringify({ token: tokenData.data, platform }),
      });
    } catch {
      // non-critical — don't surface to user
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const storedSession = await readStoredSession<StoredSession>();
        if (!storedSession) {
          setIsAuthLoading(false);
          return;
        }
        setSession(storedSession);
        await syncBootstrap(storedSession);
      } catch {
        await persistSession(null);
        clearServerState();
        setUserPosts([]);
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []);

  const sendOTP = async (email: string): Promise<void> => {
    const payload = await apiRequest<SendOtpResponse>('/auth/send-otp/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (payload.dev_code) {
      Alert.alert(
        'Verification Code Sent',
        `A 6-digit code has been sent to ${email}.\n\n[DEV MODE] Your code is: ${payload.dev_code}`,
        [{ text: 'OK' }],
      );
    }
  };

  const verifyOTP = async (email: string, code: string): Promise<boolean> => {
    try {
      const payload = await apiRequest<VerifyOtpResponse>('/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({ email, code: code.trim() }),
      });

      const nextSession: StoredSession = {
        accessToken: payload.access,
        refreshToken: payload.refresh,
        user: mapBackendUser(payload.user),
      };

      await syncBootstrap(nextSession);
      return true;
    } catch {
      return false;
    }
  };

  const signOut = async () => {
    const currentSession = (await readStoredSession<StoredSession>()) ?? session;
    if (currentSession) {
      try {
        await requestWithStoredSession<unknown, StoredSession>(currentSession, '/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: currentSession.refreshToken }),
        });
      } catch {}
    }

    await persistSession(null);
    clearServerState();
    setUserPosts([]);
  };

  const addPost = async (post: CreatePostInput): Promise<UserPost> => {
    const currentSession = (await readStoredSession<StoredSession>()) ?? session;
    if (!currentSession) {
      throw new Error('Authentication required');
    }

    const { data, session: nextSession } = await requestWithStoredSession<BackendUserPost, StoredSession>(currentSession, '/news/posts/', {
      method: 'POST',
      body: JSON.stringify({
        headline: post.headline.trim(),
        body: post.body.trim(),
        category: toCategoryCode(post.category),
        img_url: post.imgUrl?.trim() || '',
      }),
    });

    if (nextSession.accessToken !== currentSession.accessToken || nextSession.refreshToken !== currentSession.refreshToken) {
      await persistSession(nextSession);
    }

    const createdPost = mapBackendUserPost(data);
    setUserPosts(current => [createdPost, ...current.filter(item => item.id !== createdPost.id)]);
    return createdPost;
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isAuthLoading,
        userPosts,
        sendOTP,
        verifyOTP,
        signOut,
        addPost,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
