import type { Article } from '../context/AppContext';
import { apiRequest } from './api';
import { mapBackendArticle } from './newsService';

export type Liker = { id: number; displayName: string; avatar?: string };

export type PublicProfile = {
  id: number;
  displayName: string;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  commentsCount: number;
  likesCount: number;
  postsCount: number;
  recentComments: { id: number; text: string; createdAt: string; articleId: number; articleHeadline: string }[];
};

/** People who liked an article. Returns an empty result when the endpoint is
 * unavailable (older servers), so the "liked by" row simply stays hidden. */
export async function fetchLikers(articleId: string): Promise<{ count: number; likers: Liker[] }> {
  try {
    const data = await apiRequest<{ count: number; results: { id: number; display_name: string; avatar: string }[] }>(
      `/interactions/articles/${articleId}/likers/`,
    );
    return {
      count: data.count,
      likers: data.results.map(l => ({ id: l.id, displayName: l.display_name, avatar: l.avatar || undefined })),
    };
  } catch {
    return { count: 0, likers: [] };
  }
}

export async function fetchPublicProfile(userId: string | number): Promise<PublicProfile | null> {
  try {
    const p = await apiRequest<{
      id: number; display_name: string; avatar: string; bio: string; joined_at: string;
      comments_count: number; likes_count: number; posts_count: number;
      recent_comments: { id: number; text: string; created_at: string; article_id: number; article_headline: string }[];
    }>(`/auth/users/${userId}/`);
    return {
      id: p.id,
      displayName: p.display_name,
      avatar: p.avatar || undefined,
      bio: p.bio || undefined,
      joinedAt: p.joined_at,
      commentsCount: p.comments_count,
      likesCount: p.likes_count,
      postsCount: p.posts_count,
      recentComments: p.recent_comments.map(c => ({
        id: c.id, text: c.text, createdAt: c.created_at, articleId: c.article_id, articleHeadline: c.article_headline,
      })),
    };
  } catch {
    return null;
  }
}

export async function fetchArticleById(id: string | number): Promise<Article | null> {
  try {
    const raw = await apiRequest<Parameters<typeof mapBackendArticle>[0]>(`/news/articles/${id}/`);
    return mapBackendArticle(raw);
  } catch {
    return null;
  }
}

/** "2h", "3d" style relative time, like the comment timestamps on TikTok. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}
