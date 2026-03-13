'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi, isAdmin, ApiError, Comment } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import DataTable from '@/components/admin/DataTable';
import Toast, { ToastType } from '@/components/Toast';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAdmin()) {
      window.location.href = '/';
    } else {
      loadComments();
    }
  }, [page, statusFilter]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getComments({
        page,
        limit: 50,
        status: statusFilter || undefined,
      });
      setComments(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      await adminApi.approveComment(commentId);
      loadComments();
      setToast({ show: true, message: 'Comment approved', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handleHide = async (commentId: string) => {
    try {
      await adminApi.hideComment(commentId);
      loadComments();
      setToast({ show: true, message: 'Comment hidden', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Permanently delete this comment?')) return;
    try {
      await adminApi.deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      setToast({ show: true, message: 'Comment deleted', type: 'success' });
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
      key: 'author',
      header: 'Author',
      render: (comment: Comment) => (
        <div className="flex items-center gap-2">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
              {comment.author.username[0].toUpperCase()}
            </div>
          )}
          <Link
            href={`/@${comment.author.username}`}
            className="text-sm font-medium hover:underline"
          >
            {comment.author.fullName || comment.author.username}
          </Link>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Comment',
      render: (comment: Comment) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-3 whitespace-pre-wrap">
            {comment.content}
          </p>
          {comment.articleId && (
            <div className="text-xs text-gray-500 mt-1">
              on article ID: {comment.articleId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Posted',
      render: (comment: Comment) =>
        new Date(comment.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (comment: Comment) => (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleApprove(comment.id)}
            className="text-green-600 hover:underline text-xs text-left"
          >
            Approve
          </button>
          <button
            onClick={() => handleHide(comment.id)}
            className="text-orange-600 hover:underline text-xs text-left"
          >
            Hide
          </button>
          <button
            onClick={() => handleDelete(comment.id)}
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
              Comment Moderation
            </h1>
            <p className="text-gray-600">
              Review and moderate comments across all articles
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option value="">All Comments</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={comments}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
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
