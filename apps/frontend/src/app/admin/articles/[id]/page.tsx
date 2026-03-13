'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { articlesApi, adminApi, isAdmin, ApiError, Article } from '@/lib/api';
import { markdownToHtml } from '@/lib/markdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import Toast, { ToastType } from '@/components/Toast';

export default function AdminArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAdmin()) {
      window.location.href = '/';
    } else {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      // Try to fetch article by ID first, then by slug
      const data = await articlesApi.getBySlug(id);
      setArticle(data);
    } catch {
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFeature = async () => {
    if (!article) return;
    try {
      await adminApi.featureArticle(article.id);
      setToast({ show: true, message: 'Article featured', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handleArchive = async () => {
    if (!article || !confirm('Archive this article?')) return;
    try {
      await adminApi.archiveArticle(article.id);
      setArticle({ ...article, status: 'archived' });
      setToast({ show: true, message: 'Article archived', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!article || !confirm('Permanently delete this article? This cannot be undone.'))
      return;
    try {
      await adminApi.deleteArticle(article.id);
      setToast({ show: true, message: 'Article deleted', type: 'success' });
      setTimeout(() => router.push('/admin/articles'), 1500);
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-600 mb-6">Article not found</p>
        <Link href="/admin/articles" className="text-blue-600 hover:underline">
          Back to articles
        </Link>
      </div>
    );
  }

  const htmlContent = markdownToHtml(article.content);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin/articles"
              className="text-blue-600 hover:underline text-sm mb-4 inline-block"
            >
              ← Back to articles
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Article Details
            </h1>
          </div>

          {/* Moderation Actions */}
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Moderation Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFeature}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Feature Article
              </button>
              {article.status !== 'archived' && (
                <button
                  onClick={handleArchive}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Archive
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Permanently
              </button>
              <Link
                href={`/article/${article.slug}`}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                target="_blank"
              >
                View Public Page
              </Link>
            </div>
          </div>

          {/* Article Metadata */}
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Metadata
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      article.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : article.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {article.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Author</dt>
                <dd className="mt-1">
                  <Link
                    href={`/@${article.author.username}`}
                    className="text-blue-600 hover:underline"
                  >
                    {article.author.fullName || article.author.username}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Views</dt>
                <dd className="mt-1 text-gray-900">{article.viewCount}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Claps</dt>
                <dd className="mt-1 text-gray-900">{article.likeCount}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Comments</dt>
                <dd className="mt-1 text-gray-900">{article.commentCount}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(article.createdAt).toLocaleString()}
                </dd>
              </div>
              {article.publishedAt && (
                <div>
                  <dt className="font-medium text-gray-500">Published</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(article.publishedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {article.tags && article.tags.length > 0 && (
                <div className="col-span-2">
                  <dt className="font-medium text-gray-500">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Article Content Preview */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Content Preview (Read-Only)
            </h2>

            {/* Cover */}
            {article.coverImageUrl && (
              <img
                src={article.coverImageUrl}
                alt=""
                className="w-full rounded-lg mb-6 max-h-96 object-cover"
              />
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-lg text-gray-600 mb-6">{article.excerpt}</p>
            )}

            {/* Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
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
