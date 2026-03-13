'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi, isAdmin, ApiError } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import DataTable from '@/components/admin/DataTable';
import Toast, { ToastType } from '@/components/Toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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
      loadUsers();
    }
  }, [page, search, roleFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        sortBy,
        sortOrder,
      });
      setUsers(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch {
      setUsers([]);
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

  const handleBan = async (userId: string, username: string) => {
    if (!confirm(`Ban user ${username}?`)) return;
    try {
      await adminApi.banUser(userId);
      setUsers(users.map((u) => (u.id === userId ? { ...u, isActive: false } : u)));
      setToast({ show: true, message: 'User banned', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handleUnban = async (userId: string, username: string) => {
    if (!confirm(`Unban user ${username}?`)) return;
    try {
      await adminApi.unbanUser(userId);
      setUsers(users.map((u) => (u.id === userId ? { ...u, isActive: true } : u)));
      setToast({ show: true, message: 'User unbanned', type: 'success' });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    }
  };

  const handlePromote = async (userId: string, username: string) {
    if (!confirm(`Promote ${username} to admin?`)) return;
    try {
      await adminApi.promoteToAdmin(userId);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: 'ADMIN' } : u)));
      setToast({ show: true, message: 'User promoted to admin', type: 'success' });
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
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (user: any) => (
        <div className="flex items-center gap-2">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
              {user.username[0].toUpperCase()}
            </div>
          )}
          <div>
            <Link
              href={`/@${user.username}`}
              className="font-medium hover:underline"
            >
              {user.username}
            </Link>
            {user.fullName && (
              <div className="text-xs text-gray-500">{user.fullName}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.role === 'ADMIN'
              ? 'bg-red-100 text-red-700'
              : user.role === 'AUTHOR'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {user.isActive ? 'Active' : 'Banned'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (user: any) =>
        new Date(user.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: any) => (
        <div className="flex gap-2">
          <Link
            href={`/@${user.username}`}
            className="text-blue-600 hover:underline text-xs"
          >
            View
          </Link>
          {user.isActive ? (
            <button
              onClick={() => handleBan(user.id, user.username)}
              className="text-red-600 hover:underline text-xs"
            >
              Ban
            </button>
          ) : (
            <button
              onClick={() => handleUnban(user.id, user.username)}
              className="text-green-600 hover:underline text-xs"
            >
              Unban
            </button>
          )}
          {user.role !== 'ADMIN' && (
            <button
              onClick={() => handlePromote(user.id, user.username)}
              className="text-purple-600 hover:underline text-xs"
            >
              Promote
            </button>
          )}
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
              User Management
            </h1>
            <p className="text-gray-600">
              Manage users, roles, and permissions
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
                  placeholder="Search by username or email..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="READER">Reader</option>
                  <option value="AUTHOR">Author</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={users}
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
