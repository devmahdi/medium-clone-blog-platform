'use client';

import { useState } from 'react';
import { bookmarksApi, isAuthenticated, ApiError } from '@/lib/api';

interface BookmarkButtonProps {
  articleId: string;
  initialBookmarked: boolean;
}

export default function BookmarkButton({
  articleId,
  initialBookmarked,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated()) {
      alert('Please log in to bookmark articles');
      return;
    }

    setLoading(true);
    const prevState = bookmarked;

    try {
      if (bookmarked) {
        await bookmarksApi.remove(articleId);
        setBookmarked(false);
      } else {
        await bookmarksApi.add(articleId);
        setBookmarked(true);
      }
    } catch (err) {
      setBookmarked(prevState);
      alert(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:border-blue-500 transition-colors disabled:opacity-50"
      title={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
    >
      <span className="text-xl">
        {bookmarked ? '🔖' : '🏷️'}
      </span>
      <span className="text-sm font-medium text-gray-700">
        {bookmarked ? 'Saved' : 'Save'}
      </span>
    </button>
  );
}
