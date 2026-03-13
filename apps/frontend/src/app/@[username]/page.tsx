'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  usersApi,
  articlesApi,
  getCurrentUser,
  isAuthenticated,
  ApiError,
  Article,
} from '@/lib/api';
import Toast, { ToastType } from '@/components/Toast';

interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: Record<string, string>;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  createdAt: string;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  const currentUser = getCurrentUser();
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    loadProfile();
    loadArticles(1);
  }, [username]);

  const loadProfile = async () => {
    try {
      const data = await usersApi.getProfile(username);
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async (p: number) => {
    try {
      const data = await articlesApi.getByAuthor(username, p);
      setArticles(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setPage(p);
    } catch {
      setArticles([]);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated()) {
      setToast({
        show: true,
        message: 'Please log in to follow users',
        type: 'error',
      });
      return;
    }
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await usersApi.unfollowUser(profile.id);
        setProfile({
          ...profile,
          isFollowing: false,
          followersCount: profile.followersCount - 1,
        });
      } else {
        await usersApi.followUser(profile.id);
        setProfile({
          ...profile,
          isFollowing: true,
          followersCount: profile.followersCount + 1,
        });
      }
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Action failed',
        type: 'error',
      });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-600 mb-6">User not found</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const socialIcons: Record<string, string> = {
    twitter: '𝕏',
    github: '⌨',
    website: '🔗',
    linkedin: 'in',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-white">
                  {(profile.fullName || profile.username)[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {profile.fullName || profile.username}
                </h1>
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      profile.isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {followLoading
                      ? '...'
                      : profile.isFollowing
                        ? 'Following'
                        : 'Follow'}
                  </button>
                )}
                {isOwnProfile && (
                  <Link
                    href="/settings"
                    className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    Edit profile
                  </Link>
                )}
              </div>

              <p className="text-gray-500 mb-2">@{profile.username}</p>

              {profile.bio && (
                <p className="text-gray-700 mb-3">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-sm text-gray-600 mb-3">
                <span>
                  <strong className="text-gray-900">
                    {profile.followersCount}
                  </strong>{' '}
                  Followers
                </span>
                <span>
                  <strong className="text-gray-900">
                    {profile.followingCount}
                  </strong>{' '}
                  Following
                </span>
              </div>

              {/* Social Links */}
              {profile.socialLinks &&
                Object.entries(profile.socialLinks).some(([, v]) => v) && (
                  <div className="flex gap-3">
                    {Object.entries(profile.socialLinks).map(
                      ([key, value]) =>
                        value && (
                          <a
                            key={key}
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-900 text-sm font-medium"
                            title={key}
                          >
                            {socialIcons[key] || key}
                          </a>
                        ),
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Articles</h2>

        {articles.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No articles published yet.
          </p>
        ) : (
          <div className="space-y-8">
            {articles.map((article) => (
              <article
                key={article.id}
                className="border-b pb-8 last:border-0"
              >
                <Link href={`/article/${article.slug}`} className="group">
                  <div className="flex gap-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {new Date(
                            article.publishedAt || article.createdAt,
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>·</span>
                        <span>
                          {Math.ceil(article.content.length / 1000)} min read
                        </span>
                        {article.tags && article.tags.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                              {article.tags[0]}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {article.coverImageUrl && (
                      <img
                        src={article.coverImageUrl}
                        alt=""
                        className="w-28 h-28 rounded object-cover shrink-0"
                      />
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => loadArticles(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-sm rounded border hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadArticles(page + 1)}
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
  );
}
