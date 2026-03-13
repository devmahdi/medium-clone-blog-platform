'use client';

import { useState, useEffect } from 'react';
import { adminApi, isAdmin, ApiError } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import DataTable from '@/components/admin/DataTable';
import Toast, { ToastType } from '@/components/Toast';

export default function AdminTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMergeForm, setShowMergeForm] = useState(false);
  const [currentTag, setCurrentTag] = useState<any>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [editTagName, setEditTagName] = useState('');
  const [editTagDesc, setEditTagDesc] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAdmin()) {
      window.location.href = '/';
    } else {
      loadTags();
    }
  }, [page, search]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getTags({
        page,
        limit: 20,
        search: search || undefined,
      });
      setTags(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await adminApi.createTag(newTagName.trim(), newTagDesc.trim() || undefined);
      setToast({ show: true, message: 'Tag created', type: 'success' });
      setNewTagName('');
      setNewTagDesc('');
      setShowCreateForm(false);
      loadTags();
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Failed to create tag',
        type: 'error',
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTag || !editTagName.trim()) return;
    try {
      await adminApi.updateTag(currentTag.id, {
        name: editTagName.trim(),
        description: editTagDesc.trim() || undefined,
      });
      setToast({ show: true, message: 'Tag updated', type: 'success' });
      setShowEditForm(false);
      setCurrentTag(null);
      loadTags();
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Failed to update tag',
        type: 'error',
      });
    }
  };

  const handleDelete = async (tagId: string, tagName: string) => {
    if (!confirm(`Delete tag "${tagName}"? This will remove it from all articles.`))
      return;
    try {
      await adminApi.deleteTag(tagId);
      setTags(tags.filter((t) => t.id !== tagId));
      setToast({ show: true, message: 'Tag deleted', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Failed to delete tag',
        type: 'error',
      });
    }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTag || !mergeTargetId) return;
    try {
      await adminApi.mergeTags(currentTag.id, mergeTargetId);
      setToast({
        show: true,
        message: `Merged into target tag. Articles updated.`,
        type: 'success',
      });
      setShowMergeForm(false);
      setCurrentTag(null);
      setMergeTargetId('');
      loadTags();
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Failed to merge tags',
        type: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Tag Name',
      render: (tag: any) => (
        <span className="font-medium text-gray-900">{tag.name}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (tag: any) => (
        <span className="text-sm text-gray-600">{tag.description || '-'}</span>
      ),
    },
    {
      key: 'articleCount',
      header: 'Articles',
      render: (tag: any) => (
        <span className="text-sm text-gray-900">{tag.articleCount || 0}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (tag: any) =>
        new Date(tag.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tag: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCurrentTag(tag);
              setEditTagName(tag.name);
              setEditTagDesc(tag.description || '');
              setShowEditForm(true);
            }}
            className="text-blue-600 hover:underline text-xs"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setCurrentTag(tag);
              setShowMergeForm(true);
            }}
            className="text-purple-600 hover:underline text-xs"
          >
            Merge
          </button>
          <button
            onClick={() => handleDelete(tag.id, tag.name)}
            className="text-red-600 hover:underline text-xs"
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tag Management
              </h1>
              <p className="text-gray-600">Create, edit, and merge tags</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Create Tag
            </button>
          </div>

          {/* Search */}
          <div className="bg-white border rounded-lg p-4 mb-6">
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
              placeholder="Search tags..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={tags}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Create Tag
                </h2>
                <form onSubmit={handleCreate}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag Name *
                    </label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTagDesc}
                      onChange={(e) => setNewTagDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewTagName('');
                        setNewTagDesc('');
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Form Modal */}
          {showEditForm && currentTag && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Edit Tag
                </h2>
                <form onSubmit={handleEdit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag Name *
                    </label>
                    <input
                      type="text"
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editTagDesc}
                      onChange={(e) => setEditTagDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setCurrentTag(null);
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Merge Form Modal */}
          {showMergeForm && currentTag && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Merge Tag
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Merge &quot;{currentTag.name}&quot; into another tag. All
                  articles will be updated.
                </p>
                <form onSubmit={handleMerge}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Tag *
                    </label>
                    <select
                      value={mergeTargetId}
                      onChange={(e) => setMergeTargetId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select target tag...</option>
                      {tags
                        .filter((t) => t.id !== currentTag.id)
                        .map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMergeForm(false);
                        setCurrentTag(null);
                        setMergeTargetId('');
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Merge
                    </button>
                  </div>
                </form>
              </div>
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
