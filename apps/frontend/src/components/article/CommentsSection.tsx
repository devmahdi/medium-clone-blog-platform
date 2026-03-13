'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  commentsApi,
  isAuthenticated,
  getCurrentUser,
  ApiError,
  Comment,
} from '@/lib/api';

interface CommentsSectionProps {
  articleId: string;
}

// Build comment tree from flat list
function buildCommentTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  // First pass: create map
  comments.forEach((c) => {
    map.set(c.id, { ...c, replies: [] });
  });

  // Second pass: build tree
  comments.forEach((c) => {
    const comment = map.get(c.id)!;
    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      } else {
        roots.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

function CommentItem({
  comment,
  articleId,
  onReply,
  onDelete,
}: {
  comment: Comment;
  articleId: string;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const currentUser = getCurrentUser();
  const canDelete = currentUser?.sub === comment.author.id;

  return (
    <div className="border-l-2 border-gray-200 pl-4 py-3">
      <div className="flex items-start gap-3">
        <Link href={`/@${comment.author.username}`}>
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
              {(comment.author.fullName || comment.author.username)[0].toUpperCase()}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/@${comment.author.username}`}
              className="font-medium text-sm text-gray-900 hover:underline"
            >
              {comment.author.fullName || comment.author.username}
            </Link>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => onReply(comment.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  articleId={articleId}
                  onReply={onReply}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsSection({ articleId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    try {
      const data = await commentsApi.getByArticle(articleId);
      setComments(data.data || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated()) return;

    setSubmitting(true);
    try {
      const comment = await commentsApi.create(
        articleId,
        newComment.trim(),
        replyTo || undefined,
      );
      setComments([...comments, comment]);
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentsApi.delete(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete comment');
    }
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Comments ({comments.length})
      </h2>

      {/* Comment form */}
      {isAuthenticated() ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
              Replying to a comment
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-600 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {submitting ? 'Posting...' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Log in
          </Link>{' '}
          to join the discussion
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : commentTree.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              onReply={setReplyTo}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
