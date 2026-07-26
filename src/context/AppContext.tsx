import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENABLE_MANAGE_REGIONS } from '../config/features';
import { ALERT_DEFINITIONS } from '../config/content';
import { Colors } from '../theme';
import { playReactionFeedback, showNewContentNotification } from '../services/notificationService';
import { fetchCommunityStories, fetchTopStories } from '../services/newsService';
import { apiRequest } from '../services/api';
import { readStoredSession, requestWithStoredSession, type StoredSessionRecord } from '../services/sessionService';
import { createWebSocket } from '../services/wsService';
import { mapBackendArticle } from '../services/newsService';

export interface Article {
  id: string;
  headline: string;
  category?: string;
  time: string;
  imgUrl?: string;
  isLive?: boolean;
  duration?: string;
  isUpdated?: boolean;
  body?: string;
  author?: string;
  authorAvatar?: string;
  sourceUrl?: string;
  publishedAt?: string;
  feedKey?: string;
  regionSlugs?: string[];
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  savesCount?: number;
  userReaction?: 'like' | 'dislike' | null;
  isSaved?: boolean;
  isReposted?: boolean;
}

export type ServerAlertPreferences = {
  breaking_news: boolean;
  top_stories: boolean;
  local_news: boolean;
  health: boolean;
  sports: boolean;
  business: boolean;
  entertainment: boolean;
  politics: boolean;
  science: boolean;
  environment: boolean;
};

export type ServerRegion = {
  id: number;
  slug: string;
  name: string;
  province: string;
  rss_url: string;
};

type RegionUpdateResponse = {
  regions: ServerRegion[];
  slugs: string[];
};

interface AppState {
  darkMode: boolean;
  compactLayout: boolean;
  allowStorySwiping: boolean;
  useDefaultTextSize: boolean;
  textScale: number;
  allowBackgroundAudio: boolean;
  selectedRegions: string[];
  alerts: Record<string, boolean>;
  savedArticles: Article[];
  onboardingComplete: boolean;
}

interface AppContextType extends AppState {
  topStories: Article[];
  communityStories: Article[];
  availableRegions: string[];
  loadingNews: boolean;
  refreshNews: () => Promise<void>;
  toggleDarkMode: () => void;
  toggleCompactLayout: () => void;
  toggleStorySwiping: () => void;
  toggleDefaultTextSize: () => void;
  setTextScale: (v: number) => void;
  toggleBackgroundAudio: () => void;
  toggleRegion: (region: string) => void;
  toggleAlert: (key: string) => void;
  toggleSaveArticle: (article: Article) => void;
  isArticleSaved: (id: string) => boolean;
  completeOnboarding: () => void;
  hydrateServerState: (payload: {
    regionNames?: string[];
    alerts?: Partial<ServerAlertPreferences>;
    savedArticles?: Article[];
  }) => void;
  clearServerState: () => void;
  pushRegionsToServer: (session: StoredSessionRecord, regionNames: string[]) => Promise<void>;
  colors: typeof Colors.light;
}

const defaultAlerts: Record<string, boolean> = Object.fromEntries(
  ALERT_DEFINITIONS.map(item => [
    item.label,
    item.label === 'Breaking News' || item.label === 'Top Stories' || item.label === 'Local News',
  ]),
);

const defaultState: AppState = {
  darkMode: true,
  compactLayout: false,
  allowStorySwiping: true,
  useDefaultTextSize: true,
  textScale: 0.4,
  allowBackgroundAudio: false,
  selectedRegions: [],
  alerts: defaultAlerts,
  savedArticles: [],
  onboardingComplete: false,
};

const ALERT_KEY_MAP = Object.fromEntries(
  ALERT_DEFINITIONS.map(item => [item.label, item.serverKey]),
) as Record<string, keyof ServerAlertPreferences>;

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = '@canada247_state';

function mergeServerAlerts(current: Record<string, boolean>, server: Partial<ServerAlertPreferences>): Record<string, boolean> {
  const next = { ...current };
  for (const [appKey, serverKey] of Object.entries(ALERT_KEY_MAP)) {
    if (serverKey && typeof server[serverKey] === 'boolean') {
      next[appKey] = server[serverKey] as boolean;
    }
  }
  return next;
}

function getNumericArticleId(articleId: string): string | null {
  return /^\d+$/.test(articleId) ? articleId : null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [topStories, setTopStories] = useState<Article[]>([]);
  const [communityStories, setCommunityStories] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [regionCatalog, setRegionCatalog] = useState<ServerRegion[]>([]);
  const topStoriesRef = useRef<Article[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          setState(prev => ({ ...prev, ...JSON.parse(raw) }));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loaded]);

  useEffect(() => {
    if (loaded && state.onboardingComplete) {
      refreshNews();
    }
  }, [loaded, state.onboardingComplete]);

  useEffect(() => {
    if (!loaded) return;

    (async () => {
      try {
        const regions = await apiRequest<ServerRegion[]>('/regions/');
        setRegionCatalog(regions);
      } catch {}
    })();
  }, [loaded]);

  // Keep ref in sync so WS handler can read current stories without stale closure
  useEffect(() => {
    topStoriesRef.current = topStories;
  }, [topStories]);

  // Real-time news feed via WebSocket
  useEffect(() => {
    if (!loaded || !state.onboardingComplete) return;

    const disconnect = createWebSocket('/ws/news/', (raw) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const article = mapBackendArticle(raw as any);
        setTopStories(prev => {
          if (prev.some(item => item.id === article.id)) return prev;
          void showNewContentNotification({
            title: article.isLive ? '🔴 LIVE UPDATE' : '📰 New Article',
            body: article.headline,
            isBreaking: article.isLive,
          });
          return [article, ...prev];
        });
      } catch {}
    });

    return disconnect;
  }, [loaded, state.onboardingComplete]);

  const refreshNews = async () => {
    setLoadingNews(true);
    try {
      const [articles, community] = await Promise.all([
        fetchTopStories(),
        fetchCommunityStories(),
      ]);
      if (articles.length > 0) setTopStories(articles);
      setCommunityStories(community);
    } catch {}
    setLoadingNews(false);
  };

  const update = (patch: Partial<AppState>) => setState(current => ({ ...current, ...patch }));
  const colors = state.darkMode ? Colors.dark : Colors.light;
  const availableRegions = regionCatalog.map(item => item.name);

  const hydrateServerState = (payload: {
    regionNames?: string[];
    alerts?: Partial<ServerAlertPreferences>;
    savedArticles?: Article[];
  }) => {
    setState(current => ({
      ...current,
      // An empty server list on a fresh signup shouldn't wipe out regions the
      // user already picked locally during onboarding (before they had a session) —
      // only trust the server's list once it actually has something in it.
      selectedRegions: payload.regionNames && payload.regionNames.length > 0
        ? payload.regionNames
        : current.selectedRegions,
      alerts: payload.alerts ? mergeServerAlerts(current.alerts, payload.alerts) : current.alerts,
      savedArticles: payload.savedArticles ?? current.savedArticles,
    }));
  };

  const clearServerState = () => {
    setState(current => ({
      ...current,
      savedArticles: [],
    }));
  };

  const pushRegionsToServer = async (session: StoredSessionRecord, regionNames: string[]) => {
    if (!ENABLE_MANAGE_REGIONS || regionCatalog.length === 0) return;

    const regionSlugs = regionCatalog
      .filter(item => regionNames.includes(item.name))
      .map(item => item.slug);

    try {
      const { data } = await requestWithStoredSession<RegionUpdateResponse>(session, '/regions/me/', {
        method: 'PUT',
        body: JSON.stringify({ regions: regionSlugs }),
      });
      update({ selectedRegions: data.regions.map(item => item.name) });
    } catch {}
  };

  const toggleRegion = (region: string) => {
    const next = state.selectedRegions.includes(region)
      ? state.selectedRegions.filter(item => item !== region)
      : [...state.selectedRegions, region];

    update({ selectedRegions: next });

    void (async () => {
      const session = await readStoredSession();
      if (!session) return;
      await pushRegionsToServer(session, next);
    })();
  };

  const toggleAlert = (key: string) => {
    const nextAlerts = { ...state.alerts, [key]: !state.alerts[key] };
    update({ alerts: nextAlerts });

    const serverKey = ALERT_KEY_MAP[key];
    if (!serverKey) return;

    void (async () => {
      const session = await readStoredSession();
      if (!session) return;

      try {
        const { data } = await requestWithStoredSession<ServerAlertPreferences>(session, '/notifications/alerts/', {
          method: 'PATCH',
          body: JSON.stringify({ [serverKey]: nextAlerts[key] }),
        });
        update({ alerts: mergeServerAlerts(nextAlerts, data) });
      } catch {}
    })();
  };

  const toggleSaveArticle = (article: Article) => {
    void playReactionFeedback();
    const exists = state.savedArticles.some(item => item.id === article.id);
    const fallbackSavedArticles = exists
      ? state.savedArticles.filter(item => item.id !== article.id)
      : [article, ...state.savedArticles];

    update({ savedArticles: fallbackSavedArticles });

    const articleId = getNumericArticleId(article.id);
    if (!articleId) return;

    void (async () => {
      const session = await readStoredSession();
      if (!session) return;

      try {
        const { data } = await requestWithStoredSession<{ saved: boolean }>(session, `/interactions/articles/${articleId}/save/`, {
          method: 'POST',
        });

        update({
          savedArticles: data.saved
            ? [article, ...fallbackSavedArticles.filter(item => item.id !== article.id)]
            : fallbackSavedArticles.filter(item => item.id !== article.id),
        });
      } catch {
        update({ savedArticles: state.savedArticles });
      }
    })();
  };

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        ...state,
        topStories,
        communityStories,
        availableRegions,
        loadingNews,
        refreshNews,
        colors,
        toggleDarkMode: () => update({ darkMode: !state.darkMode }),
        toggleCompactLayout: () => update({ compactLayout: !state.compactLayout }),
        toggleStorySwiping: () => update({ allowStorySwiping: !state.allowStorySwiping }),
        toggleDefaultTextSize: () => update({ useDefaultTextSize: !state.useDefaultTextSize }),
        setTextScale: value => update({ textScale: value }),
        toggleBackgroundAudio: () => update({ allowBackgroundAudio: !state.allowBackgroundAudio }),
        toggleRegion,
        toggleAlert,
        toggleSaveArticle,
        isArticleSaved: id => state.savedArticles.some(item => item.id === id),
        completeOnboarding: () => update({ onboardingComplete: true }),
        hydrateServerState,
        clearServerState,
        pushRegionsToServer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
