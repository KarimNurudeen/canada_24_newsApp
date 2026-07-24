import type { Article } from '../context/AppContext';
import type { UserPost, UserPostStatus } from '../context/AuthContext';
import { formatCategoryLabel } from '../config/content';
import type { VideoFeed, VideoItem } from '../types/video';
import { apiRequest, extractList } from './api';

type BackendArticle = {
  id: number;
  external_id: string;
  headline: string;
  body: string;
  category: string;
  img_url: string;
  source_url: string;
  author: string;
  author_avatar: string;
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
  author_avatar: string;
};

type BackendSection = {
  slug: string;
  label: string;
  code: string;
  rss_url: string;
};

type BackendVideoItem = {
  id: string;
  title: string;
  description?: string;
  duration: string;
  show_duration: boolean;
  date: string;
  img_url: string;
  is_live: boolean;
  live_text: string;
  source_url?: string;
  video_url?: string;
  reposts_count?: number;
  is_reposted?: boolean;
};

type BackendVideoFeed = {
  trending: BackendVideoItem[];
  live: BackendVideoItem[];
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function slugifyValue(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function mapBackendArticle(article: BackendArticle): Article {
  return {
    id: String(article.id),
    headline: article.headline,
    category: formatCategoryLabel(article.category),
    time: article.time,
    imgUrl: article.img_url || undefined,
    isLive: article.is_live,
    isUpdated: article.is_updated,
    body: article.body || undefined,
    author: article.author || undefined,
    authorAvatar: article.author_avatar || undefined,
    sourceUrl: article.source_url || undefined,
    publishedAt: article.published_at,
    feedKey: article.feed_key || undefined,
    regionSlugs: article.region_slugs,
    likesCount: article.likes_count,
    dislikesCount: article.dislikes_count,
    commentsCount: article.comments_count,
    repostsCount: article.reposts_count,
    savesCount: article.saves_count,
    userReaction: article.user_reaction,
    isSaved: article.is_saved,
    isReposted: article.is_reposted,
  };
}

export function mapBackendUserPost(post: BackendUserPost): UserPost {
  return {
    id: `user-post-${post.id}`,
    headline: post.headline,
    body: post.body,
    category: formatCategoryLabel(post.category) || titleCase('general'),
    time: post.time,
    imgUrl: post.img_url || undefined,
    isLive: false,
    isUserPost: true,
    status: post.status,
    authorEmail: post.author_email,
    authorName: post.author_name,
    authorAvatar: post.author_avatar || undefined,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
}

function mapBackendVideoItem(item: BackendVideoItem): VideoItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    duration: item.duration || undefined,
    showDuration: item.show_duration,
    date: item.date,
    imgUrl: item.img_url || undefined,
    isLive: item.is_live,
    liveText: item.live_text || undefined,
    sourceUrl: item.source_url || undefined,
    videoUrl: item.video_url || undefined,
    repostsCount: item.reposts_count ?? 0,
    isReposted: item.is_reposted ?? false,
  };
}

async function fetchArticleList(path: string): Promise<Article[]> {
  const payload = await apiRequest<BackendArticle[] | { results: BackendArticle[] }>(path);
  return extractList(payload).map(mapBackendArticle);
}

export async function fetchTopStories(): Promise<Article[]> {
  try {
    return await fetchArticleList('/news/top-stories/');
  } catch {
    return [];
  }
}

export async function fetchCommunityStories(): Promise<Article[]> {
  try {
    return await fetchArticleList('/news/community/');
  } catch {
    return [];
  }
}

export async function fetchCategoryArticles(section: string): Promise<Article[]> {
  try {
    const sections = await apiRequest<BackendSection[]>('/news/sections/');
    const match = sections.find(item => item.label.toLowerCase() === section.toLowerCase());
    if (!match) return [];

    return await fetchArticleList(`/news/sections/${match.slug}/`);
  } catch {
    return [];
  }
}

export async function fetchLocalNews(regionName?: string): Promise<Article[]> {
  const query = regionName ? `?regions=${encodeURIComponent(slugifyValue(regionName))}` : '';

  try {
    return await fetchArticleList(`/news/local/${query}`);
  } catch {
    return [];
  }
}

export async function searchArticles(query: string): Promise<Article[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    return await fetchArticleList(`/news/search/?q=${encodeURIComponent(trimmed)}`);
  } catch {
    return [];
  }
}

export async function fetchVideoFeed(): Promise<VideoFeed> {
  const payload = await apiRequest<BackendVideoFeed>('/news/videos/');
  return {
    trending: payload.trending.map(mapBackendVideoItem),
    live: payload.live.map(mapBackendVideoItem),
  };
}
