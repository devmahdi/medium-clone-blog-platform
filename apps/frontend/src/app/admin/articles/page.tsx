'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi, isAdmin, ApiError, Article } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import DataTable from '@/components/admin/DataTable';
import Toast, { ToastType } from '@/components/Toast';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAdmin()) {
      window.location.href = '/';
    } else {
      loadArticles();
    }
  }, [page, search, statusFilter, sortBy, sortOrder]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getArticles({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });
      setArticles(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleFeature = async (articleId: string, title: string) => {
    try {
      await adminApi.featureArticle(articleId);
      loadArticles();
      setToast({ show: true, message: 'Article featured', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handleUnfeature = async (articleId: string) => {
    try {
      await adminApi.unfeatureArticle(articleId);
      loadArticles();
      setToast({ show: true, message: 'Article unfeatured', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handleArchive = async (articleId: string, title: string) => {
    if (!confirm(`Archive "${title}"?`)) return;
    try {
      await adminApi.archiveArticle(articleId);
      setArticles(
        articles.map((a) =>
          a.id === articleId ? { ...a, status: 'archived' as const } : a,
        ),
      );
      setToast({ show: true, message: 'Article archived', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handleDelete = async (articleId: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteArticle(articleId);
      setArticles(articles.filter((a) => a.id !== articleId));
      setToast({ show: true, message: 'Article deleted', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (article: Article) => (
        <div className="max-w-md">
          <Link
            href={`/admin/articles/${article.id}`}
            className="font-medium hover:underline line-clamp-2"
          >
            {article.title}
          </Link>
          <div className="text-xs text-gray-500 mt-1">
            by {article.author.username}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (article: Article) => (
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
      ),
    },
    {
      key: 'viewCount',
      header: 'Views',
      sortable: true,
    },
    {
      key: 'likeCount',
      header: 'Claps',
      sortable: true,
    },
    {
      key: 'commentCount',
      header: 'Comments',
      sortable: true,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (article: Article) =>
        new Date(article.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (article: Article) => (
        <div className="flex flex-col gap-1">
          <Link
            href={`/admin/articles/${article.id}`}
            className="text-blue-600 hover:underline text-xs"
          >
            View
          </Link>
          <button
            onClick={() => handleFeature(article.id, article.title)}
            className="text-purple-600 hover:underline text-xs text-left"
          >
            Feature
          </button>
          {article.status !== 'archived' && (
            <button
              onClick={() => handleArchive(article.id, article.title)}
              className="text-orange-600 hover:underline text-xs text-left"
            >
              Archive
            </button>
          )}
          <button
            onClick={() => handleDelete(article.id, article.title)}
            className="text-red-600 hover:underline text-xs text-left"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Article Management
            </h1>
            <p className="text-gray-600">
              Moderate and manage all articles
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by title or author..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={articles}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
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
