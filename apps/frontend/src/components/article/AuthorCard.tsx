'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usersApi, getCurrentUser, isAuthenticated, ApiError } from '@/lib/api';

interface AuthorCardProps {
  author: {
    id: string;
    username: string;
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    followersCount?: number;
    isFollowing?: boolean;
  };
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function AuthorCard({ author, onFollowChange }: AuthorCardProps) {
  const [isFollowing, setIsFollowing] = useState(author.isFollowing || false);
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();
  const isOwnProfile = currentUser?.sub === author.id;

  const handleFollow = async () => {
    if (!isAuthenticated()) {
      alert('Please log in to follow authors');
      return;
    }
    setLoading(true);
    try {
      if (isFollowing) {
        await usersApi.unfollowUser(author.id);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await usersApi.followUser(author.id);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg">
      <Link href={`/@${author.username}`}>
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.username}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-white">
            {(author.fullName || author.username)[0].toUpperCase()}
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/@${author.username}`}
          className="font-semibold text-gray-900 hover:underline block"
        >
          {author.fullName || author.username}
        </Link>
        {author.followersCount !== undefined && (
          <p className="text-sm text-gray-500">
            {author.followersCount} Follower{author.followersCount !== 1 ? 's' : ''}
          </p>
        )}
        {author.bio && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{author.bio}</p>
        )}
      </div>

      {!isOwnProfile && (
        <button
          onClick={handleFollow}
          disabled={loading}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
            isFollowing
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          } disabled:opacity-50`}
        >
          {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}
