import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isReaction = notification.request.content.data?.type === 'reaction';
      return {
        shouldShowBanner: !isReaction,
        shouldShowList: !isReaction,
        shouldPlaySound: true,
        shouldSetBadge: !isReaction,
      };
    },
  });
}

export async function createAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('breaking-news', {
    name: 'Breaking News',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1976D2',
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('general', {
    name: 'General Alerts',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('reaction-feedback', {
    name: 'Reaction Feedback',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 60],
  });
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Plays the phone's native notification sound — no visible banner while app is open
export async function playReactionFeedback(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '',
        body: '',
        sound: true,
        data: { type: 'reaction' },
        ...(Platform.OS === 'android' ? { channelId: 'reaction-feedback' } : {}),
      },
      trigger: null,
    });
  } catch {}
}

// Shows a visible native notification banner for new content
export async function showNewContentNotification(payload: {
  title: string;
  body: string;
  isBreaking?: boolean;
}): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        sound: true,
        data: { type: 'new_content' },
        ...(Platform.OS === 'android'
          ? { channelId: payload.isBreaking ? 'breaking-news' : 'general' }
          : {}),
      },
      trigger: null,
    });
  } catch {}
}

const ALERT_MESSAGES: Record<string, { title: string; body: string }> = {
  'Breaking News':       { title: 'BREAKING NEWS', body: 'A major story is developing. Tap to read the latest.' },
  'Top Stories':         { title: 'TOP STORIES UPDATE', body: "Today's most important Canadian news is ready." },
  'Local News':          { title: 'LOCAL NEWS UPDATE', body: 'Fresh stories from your selected Canadian regions are available.' },
  'Business':            { title: 'BUSINESS & ECONOMY', body: 'Latest market news and economic developments.' },
  'Entertainment':       { title: 'ENTERTAINMENT', body: 'New stories in arts & entertainment.' },
  'Health':              { title: 'HEALTH NEWS', body: 'Latest health and wellness updates.' },
  'Technology':          { title: 'TECH NEWS', body: 'New developments in Canadian tech.' },
  'Politics':            { title: 'POLITICS', body: 'Political developments from Canada and Parliament are in.' },
  'Sports':              { title: 'SPORTS', body: 'New sports coverage and scores are available.' },
  'World':               { title: 'WORLD', body: 'International stories relevant to Canada are ready.' },
};

export async function scheduleAlertNotification(alertKey: string): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  const msg = ALERT_MESSAGES[alertKey] ?? {
    title: 'CANADA 24/7',
    body: `You enabled notifications for ${alertKey}.`,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: true,
      data: { type: 'alert', key: alertKey },
      ...(Platform.OS === 'android' ? { channelId: alertKey === 'Breaking News' ? 'breaking-news' : 'general' } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
