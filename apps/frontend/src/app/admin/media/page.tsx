'use client';

import { useState, useEffect } from 'react';
import { adminApi, isAdmin, ApiError } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Toast, { ToastType } from '@/components/Toast';

export default function AdminMediaPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAdmin()) {
      window.location.href = '/';
    } else {
      loadFiles();
    }
  }, [page]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getMediaFiles({ page, limit: 24 });
      setFiles(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileKey: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    try {
      await adminApi.deleteMediaFile(fileKey);
      setFiles(files.filter((f) => f.key !== fileKey));
      setToast({ show: true, message: 'File deleted', type: 'success' });
      setSelectedFile(null);
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Failed to delete file',
        type: 'error',
      });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setToast({ show: true, message: 'URL copied to clipboard', type: 'success' });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Media Library
            </h1>
            <p className="text-gray-600">
              Manage uploaded images and files
            </p>
          </div>

          {/* Gallery */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white border rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">No media files uploaded yet</p>
              <p className="text-sm text-gray-400">
                Files are uploaded automatically when you add images to articles
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                  >
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        View
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 text-sm rounded border hover:bg-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 text-sm rounded border hover:bg-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* File Detail Modal */}
          {selectedFile && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedFile(null)}
            >
              <div
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Image */}
                  <div className="mb-6">
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.filename}
                      className="w-full rounded-lg"
                    />
                  </div>

                  {/* Details */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      File Details
                    </h2>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500">Filename</dt>
                        <dd className="mt-1 text-gray-900 break-all">
                          {selectedFile.filename}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Type</dt>
                        <dd className="mt-1 text-gray-900">
                          {selectedFile.mimetype}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Size</dt>
                        <dd className="mt-1 text-gray-900">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Uploaded</dt>
                        <dd className="mt-1 text-gray-900">
                          {new Date(selectedFile.createdAt).toLocaleString()}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-gray-500">URL</dt>
                        <dd className="mt-1 text-gray-900 break-all font-mono text-xs bg-gray-50 p-2 rounded">
                          {selectedFile.url}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => copyUrl(selectedFile.url)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={() => handleDelete(selectedFile.key)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
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
