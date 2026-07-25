import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { getChatSocket } from '@/lib/ws';
import type { Post, Reaction, Comment } from '@/types';

interface FeedPayload {
  posts: Post[];
}

/**
 * Subscribes to the shared WebSocket and patches the React Query cache
 * for the given feed query key when friends post, react, or comment.
 *
 * Mount once at the layout level so the cache stays warm even when the
 * user is on a non-feed page.
 */
export function useFeedRealtime(queryKey: QueryKey) {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getChatSocket();
    const off = socket.on((raw) => {
      const msg = raw as
        | { type: 'new_post'; post: Post }
        | { type: 'new_reaction'; postId: string; reaction: Reaction }
        | { type: 'new_comment'; postId: string; comment: Comment };

      if (msg.type === 'new_post') {
        qc.setQueryData<FeedPayload>(queryKey, (prev) => {
          if (!prev) return { posts: [msg.post] };
          // Dedupe by id (the author themselves receives their own broadcast)
          if (prev.posts.some((p) => p.id === msg.post.id)) return prev;
          const next = [msg.post, ...prev.posts];
          if (next.length > 50) next.length = 50;
          return { posts: next };
        });
        return;
      }

      if (msg.type === 'new_reaction') {
        qc.setQueryData<FeedPayload>(queryKey, (prev) => {
          if (!prev) return prev;
          return {
            posts: prev.posts.map((p) =>
              p.id === msg.postId
                ? { ...p, reactions: [...p.reactions, msg.reaction] }
                : p,
            ),
          };
        });
        return;
      }

      if (msg.type === 'new_comment') {
        qc.setQueryData<FeedPayload>(queryKey, (prev) => {
          if (!prev) return prev;
          return {
            posts: prev.posts.map((p) =>
              p.id === msg.postId
                ? { ...p, comments: [...p.comments, msg.comment] }
                : p,
            ),
          };
        });
      }
    });

    return off;
  }, [qc, queryKey]);
}
