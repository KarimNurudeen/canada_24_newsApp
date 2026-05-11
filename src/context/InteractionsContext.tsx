import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, extractList } from '../services/api';
import { readStoredSession, requestWithStoredSession } from '../services/sessionService';
import { playReactionFeedback } from '../services/notificationService';
import type { Article } from './AppContext';
import type { AuthUser } from './AuthContext';

const REACTIONS_KEY = '@canada247_reactions';
const COMMENTS_KEY = '@canada247_comments';
const REPOSTS_KEY = '@canada247_reposts';

export interface Comment {
  id: string;
  articleId: string;
  authorEmail: string;
  authorName: string;
  text: string;
  createdAt: string;
}

type Reaction = 'like' | 'dislike' | null;

type BackendComment = {
  id: number;
  article: number;
  text: string;
  created_at: string;
  author_name: string;
  author_email: string;
};

type ReactionSummary = {
  likes: number;
  dislikes: number;
  comments: number;
  reposts: number;
  user_reaction: Reaction;
};

type RepostSummary = {
  reposted: boolean;
  reposts: number;
};

interface InteractionsState {
  reactions: Record<string, Reaction>;
  comments: Record<string, Comment[]>;
  reposts: Record<string, boolean>;
  likeCounts: Record<string, number>;
  dislikeCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  repostCounts: Record<string, number>;
}

interface InteractionsContextType {
  hydrateArticleInteractions: (article: Article) => Promise<void>;
  getReaction: (articleId: string) => Reaction | undefined;
  getComments: (articleId: string) => Comment[];
  getCommentCount: (articleId: string) => number | undefined;
  isReposted: (articleId: string) => boolean | undefined;
  getLikeCount: (articleId: string) => number | undefined;
  getDislikeCount: (articleId: string) => number | undefined;
  getRepostCount: (articleId: string) => number | undefined;
  toggleLike: (articleId: string) => void;
  toggleDislike: (articleId: string) => void;
  addComment: (articleId: string, text: string, user: AuthUser) => void;
  toggleRepost: (articleId: string, currentReposted?: boolean) => void;
}

const InteractionsContext = createContext<InteractionsContextType | null>(null);

function isBackendArticleId(articleId: string): boolean {
  return /^\d+$/.test(articleId);
}

function mapBackendComment(comment: BackendComment): Comment {
  return {
    id: String(comment.id),
    articleId: String(comment.article),
    authorEmail: comment.author_email,
    authorName: comment.author_name,
    text: comment.text,
    createdAt: comment.created_at,
  };
}

export function InteractionsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InteractionsState>({
    reactions: {},
    comments: {},
    reposts: {},
    likeCounts: {},
    dislikeCounts: {},
    commentCounts: {},
    repostCounts: {},
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [reactionsRaw, commentsRaw, repostsRaw] = await Promise.all([
          AsyncStorage.getItem(REACTIONS_KEY),
          AsyncStorage.getItem(COMMENTS_KEY),
          AsyncStorage.getItem(REPOSTS_KEY),
        ]);

        setState(current => ({
          ...current,
          reactions: reactionsRaw ? JSON.parse(reactionsRaw) : {},
          comments: commentsRaw ? JSON.parse(commentsRaw) : {},
          reposts: repostsRaw ? JSON.parse(repostsRaw) : {},
        }));
      } catch {}

      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(REACTIONS_KEY, JSON.stringify(state.reactions));
    AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(state.comments));
    AsyncStorage.setItem(REPOSTS_KEY, JSON.stringify(state.reposts));
  }, [state.reactions, state.comments, state.reposts, loaded]);

  const hydrateArticleInteractions = async (article: Article) => {
    setState(current => ({
      ...current,
      reactions: {
        ...current.reactions,
        [article.id]: current.reactions[article.id] ?? article.userReaction ?? null,
      },
      reposts: {
        ...current.reposts,
        [article.id]: current.reposts[article.id] ?? Boolean(article.isReposted),
      },
      likeCounts: {
        ...current.likeCounts,
        [article.id]: current.likeCounts[article.id] ?? article.likesCount ?? 0,
      },
      dislikeCounts: {
        ...current.dislikeCounts,
        [article.id]: current.dislikeCounts[article.id] ?? article.dislikesCount ?? 0,
      },
      commentCounts: {
        ...current.commentCounts,
        [article.id]: current.commentCounts[article.id] ?? article.commentsCount ?? current.comments[article.id]?.length ?? 0,
      },
      repostCounts: {
        ...current.repostCounts,
        [article.id]: current.repostCounts[article.id] ?? article.repostsCount ?? 0,
      },
    }));

    if (!isBackendArticleId(article.id)) return;

    try {
      const session = await readStoredSession();
      const summaryPromise = session
        ? requestWithStoredSession<ReactionSummary>(session, `/interactions/articles/${article.id}/reactions/`).then(result => result.data)
        : apiRequest<ReactionSummary>(`/interactions/articles/${article.id}/reactions/`);
      const commentsPromise = apiRequest<BackendComment[] | { results: BackendComment[] }>(`/interactions/articles/${article.id}/comments/`);
      const [summary, commentsPayload] = await Promise.all([summaryPromise, commentsPromise]);
      const comments = extractList(commentsPayload);

      setState(current => ({
        ...current,
        reactions: { ...current.reactions, [article.id]: summary.user_reaction },
        likeCounts: { ...current.likeCounts, [article.id]: summary.likes },
        dislikeCounts: { ...current.dislikeCounts, [article.id]: summary.dislikes },
        comments: { ...current.comments, [article.id]: comments.map(mapBackendComment) },
        commentCounts: { ...current.commentCounts, [article.id]: summary.comments ?? comments.length },
        reposts: { ...current.reposts, [article.id]: current.reposts[article.id] ?? Boolean(article.isReposted) },
        repostCounts: { ...current.repostCounts, [article.id]: summary.reposts },
      }));
    } catch {}
  };

  const getReaction = (articleId: string): Reaction | undefined => state.reactions[articleId];
  const getComments = (articleId: string): Comment[] => state.comments[articleId] ?? [];
  const getCommentCount = (articleId: string): number | undefined => state.commentCounts[articleId];
  const isReposted = (articleId: string): boolean | undefined => state.reposts[articleId];
  const getLikeCount = (articleId: string): number | undefined => state.likeCounts[articleId];
  const getDislikeCount = (articleId: string): number | undefined => state.dislikeCounts[articleId];
  const getRepostCount = (articleId: string): number | undefined => state.repostCounts[articleId];

  const toggleReactionLocally = (articleId: string, reactionType: 'like' | 'dislike') => {
    setState(current => {
      const previousReaction = current.reactions[articleId] ?? null;
      const nextReaction = previousReaction === reactionType ? null : reactionType;
      const likes = current.likeCounts[articleId] ?? 0;
      const dislikes = current.dislikeCounts[articleId] ?? 0;

      const nextLikes =
        previousReaction === 'like' && nextReaction !== 'like'
          ? Math.max(0, likes - 1)
          : previousReaction !== 'like' && nextReaction === 'like'
            ? likes + 1
            : likes;

      const nextDislikes =
        previousReaction === 'dislike' && nextReaction !== 'dislike'
          ? Math.max(0, dislikes - 1)
          : previousReaction !== 'dislike' && nextReaction === 'dislike'
            ? dislikes + 1
            : dislikes;

      return {
        ...current,
        reactions: { ...current.reactions, [articleId]: nextReaction },
        likeCounts: { ...current.likeCounts, [articleId]: nextLikes },
        dislikeCounts: { ...current.dislikeCounts, [articleId]: nextDislikes },
      };
    });
  };

  const toggleLike = (articleId: string) => {
    void playReactionFeedback();
    toggleReactionLocally(articleId, 'like');

    if (!isBackendArticleId(articleId)) return;

    void (async () => {
      const session = await readStoredSession();
      if (!session) return;

      try {
        const { data } = await requestWithStoredSession<ReactionSummary>(session, `/interactions/articles/${articleId}/react/`, {
          method: 'POST',
          body: JSON.stringify({ reaction_type: 'like' }),
        });

        setState(current => ({
          ...current,
          reactions: { ...current.reactions, [articleId]: data.user_reaction },
          likeCounts: { ...current.likeCounts, [articleId]: data.likes },
          dislikeCounts: { ...current.dislikeCounts, [articleId]: data.dislikes },
        }));
      } catch {}
    })();
  };

  const toggleDislike = (articleId: string) => {
    void playReactionFeedback();
    toggleReactionLocally(articleId, 'dislike');

    if (!isBackendArticleId(articleId)) return;

    void (async () => {
      const session = await readStoredSession();
      if (!session) return;

      try {
        const { data } = await requestWithStoredSession<ReactionSummary>(session, `/interactions/articles/${articleId}/react/`, {
          method: 'POST',
          body: JSON.stringify({ reaction_type: 'dislike' }),
        });

        setState(current => ({
          ...current,
          reactions: { ...current.reactions, [articleId]: data.user_reaction },
          likeCounts: { ...current.likeCounts, [articleId]: data.likes },
          dislikeCounts: { ...current.dislikeCounts, [articleId]: data.dislikes },
        }));
      } catch {}
    })();
  };

  const addComment = (articleId: string, text: string, user: AuthUser) => {
    void playReactionFeedback();
    const localComment: Comment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      articleId,
      authorEmail: user.email,
      authorName: user.displayName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setState(current => ({
      ...current,
      comments: {
        ...current.comments,
        [articleId]: [localComment, ...(current.comments[articleId] ?? [])],
      },
      commentCounts: {
        ...current.commentCounts,
        [articleId]: (current.commentCounts[articleId] ?? current.comments[articleId]?.length ?? 0) + 1,
      },
    }));

    if (!isBackendArticleId(articleId)) return;

    void (async () => {
      const session = await readStoredSession();
      if (!session) return;

      try {
        const { data } = await requestWithStoredSession<BackendComment>(session, `/interactions/articles/${articleId}/comments/`, {
          method: 'POST',
          body: JSON.stringify({ text: text.trim() }),
        });
        const mapped = mapBackendComment(data);

        setState(current => ({
          ...current,
          comments: {
            ...current.comments,
            [articleId]: [mapped, ...(current.comments[articleId] ?? []).filter(item => item.id !== localComment.id)],
          },
          commentCounts: {
            ...current.commentCounts,
            [articleId]: current.comments[articleId]?.length ?? current.commentCounts[articleId] ?? 1,
          },
        }));
      } catch {}
    })();
  };

  const toggleRepost = (articleId: string, currentReposted = false) => {
    void playReactionFeedback();
    setState(current => ({
      ...current,
      reposts: { ...current.reposts, [articleId]: !(current.reposts[articleId] ?? currentReposted) },
      repostCounts: {
        ...current.repostCounts,
        [articleId]:
          Math.max(0, (current.repostCounts[articleId] ?? 0) + ((current.reposts[articleId] ?? currentReposted) ? -1 : 1)),
      },
    }));

    if (!isBackendArticleId(articleId)) return;

    void (async () => {
      const session = await readStoredSession();
      if (!session) return;

      try {
        const { data } = await requestWithStoredSession<RepostSummary>(session, `/interactions/articles/${articleId}/repost/`, {
          method: 'POST',
        });
        setState(current => ({
          ...current,
          reposts: { ...current.reposts, [articleId]: data.reposted },
          repostCounts: { ...current.repostCounts, [articleId]: data.reposts },
        }));
      } catch {}
    })();
  };

  return (
    <InteractionsContext.Provider
      value={{
        hydrateArticleInteractions,
        getReaction,
        getComments,
        getCommentCount,
        isReposted,
        getLikeCount,
        getDislikeCount,
        getRepostCount,
        toggleLike,
        toggleDislike,
        addComment,
        toggleRepost,
      }}
    >
      {children}
    </InteractionsContext.Provider>
  );
}

export function useInteractions() {
  const ctx = useContext(InteractionsContext);
  if (!ctx) throw new Error('useInteractions must be within InteractionsProvider');
  return ctx;
}
