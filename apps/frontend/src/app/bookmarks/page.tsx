'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookmarksApi, ApiError, Article } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Toast, { ToastType } from '@/components/Toast';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    loadBookmarks(1);
  }, []);

  const loadBookmarks = async (p: number) => {
    setLoading(true);
    try {
      const data = await bookmarksApi.getAll(p);
      setBookmarks(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setPage(p);
    } catch {
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (articleId: string) => {
    try {
      await bookmarksApi.remove(articleId);
      setBookmarks(bookmarks.filter((b) => b.id !== articleId));
      setToast({
        show: true,
        message: 'Bookmark removed',
        type: 'success',
      });
    } catch (err) {
      setToast({
        show: true,
        message:
          err instanceof ApiError ? err.message : 'Failed to remove bookmark',
        type: 'error',
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your bookmarks
          </h1>
          <p className="text-gray-500 mb-8">
            Articles you&apos;ve saved for later reading.
          </p>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📚</p>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No bookmarks yet
              </h2>
              <p className="text-gray-500 mb-6">
                Save articles to read later by clicking the bookmark icon.
              </p>
              <Link
                href="/"
                className="text-blue-600 hover:underline font-medium"
              >
                Explore articles
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookmarks.map((article) => (
                <article
                  key={article.id}
                  className="border-b pb-6 last:border-0 group"
                >
                  <div className="flex gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Author */}
                      <div className="flex items-center gap-2 mb-2">
                        {article.author.avatarUrl ? (
                          <img
                            src={article.author.avatarUrl}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-white">
                            {(
                              article.author.fullName ||
                              article.author.username
                            )[0].toUpperCase()}
                          </div>
                        )}
                        <Link
                          href={`/@${article.author.username}`}
                          className="text-sm text-gray-700 hover:underline"
                        >
                          {article.author.fullName || article.author.username}
                        </Link>
                      </div>

                      {/* Title */}
                      <Link href={`/article/${article.slug}`}>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 mb-1 line-clamp-2">
                          {article.title}
                        </h3>
                      </Link>

                      {article.excerpt && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>
                          {new Date(
                            article.publishedAt || article.createdAt,
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>·</span>
                        <span>
                          {Math.ceil(article.content.length / 1000)} min read
                        </span>
                        {article.tags?.[0] && (
                          <>
                            <span>·</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                              {article.tags[0]}
                            </span>
                          </>
                        )}
                        <span className="flex-1" />
                        <button
                          onClick={() => handleRemoveBookmark(article.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove bookmark"
                        >
                          🔖
                        </button>
                      </div>
                    </div>

                    {article.coverImageUrl && (
                      <Link href={`/article/${article.slug}`}>
                        <img
                          src={article.coverImageUrl}
                          alt=""
                          className="w-24 h-24 rounded object-cover shrink-0"
                        />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => loadBookmarks(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => loadBookmarks(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
