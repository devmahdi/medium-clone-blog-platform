'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  articlesApi,
  mediaApi,
  getCurrentUser,
  ApiError,
} from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import MarkdownEditor from '@/components/MarkdownEditor';
import Toast, { ToastType } from '@/components/Toast';

interface FormErrors {
  title?: string;
  content?: string;
  coverImage?: string;
  tags?: string;
}

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      const article = await articlesApi.getBySlug(slug);
      const currentUser = getCurrentUser();
      if (!currentUser || article.author.id !== currentUser.sub) {
        router.push('/');
        return;
      }
      setTitle(article.title);
      setContent(article.content);
      setExcerpt(article.excerpt || '');
      setCoverImageUrl(article.coverImageUrl || '');
      setCoverPreview(article.coverImageUrl || '');
      setTags(article.tags || []);
      setCurrentStatus(article.status);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!title.trim()) errs.title = 'Title is required';
    else if (title.length > 200) errs.title = 'Title must be under 200 characters';
    if (!content.trim()) errs.content = 'Content is required';
    else if (content.length < 50) errs.content = 'Content must be at least 50 characters';
    if (tags.length > 5) errs.tags = 'Maximum 5 tags allowed';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, coverImage: 'Image must be under 5MB' });
      return;
    }
    setCoverPreview(URL.createObjectURL(file));
    try {
      const result = await mediaApi.uploadCover(file);
      setCoverImageUrl(result.url);
      setErrors({ ...errors, coverImage: undefined });
    } catch {
      setErrors({ ...errors, coverImage: 'Failed to upload image' });
      setCoverPreview('');
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!validate()) return;

    setSaving(true);
    try {
      const article = await articlesApi.update(slug, {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        coverImageUrl: coverImageUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
        status,
      });

      setToast({
        show: true,
        message: status === 'published' ? 'Article updated!' : 'Draft saved!',
        type: 'success',
      });

      setTimeout(() => {
        router.push(
          status === 'published'
            ? `/article/${article.slug}`
            : '/settings',
        );
      }, 1000);
    } catch (err) {
      setToast({
        show: true,
        message:
          err instanceof ApiError ? err.message : 'Failed to save article',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-600 mb-6">Article not found</p>
        <a href="/" className="text-blue-600 hover:underline">
          Go home
        </a>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Top Bar */}
        <div className="border-b sticky top-0 bg-white z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Editing · {currentStatus}
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                onClick={() => handleSubmit('published')}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Cover Image */}
          <div className="mb-6">
            {coverPreview ? (
              <div className="relative">
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setCoverPreview('');
                    setCoverImageUrl('');
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
              >
                <span className="text-sm">+ Add a cover image</span>
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
            {errors.coverImage && (
              <p className="mt-1 text-sm text-red-600">{errors.coverImage}</p>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              rows={1}
              className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 resize-none focus:outline-none leading-tight"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                minHeight: '60px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Write a brief excerpt (optional)..."
              rows={2}
              maxLength={300}
              className="w-full text-lg text-gray-600 placeholder-gray-300 resize-none focus:outline-none leading-relaxed"
            />
            <p className="text-xs text-gray-400 text-right">
              {excerpt.length}/300
            </p>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={
                tags.length >= 5
                  ? 'Max 5 tags'
                  : 'Add a tag (press Enter)...'
              }
              disabled={tags.length >= 5}
              className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none border-b pb-2"
            />
            {errors.tags && (
              <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
            )}
          </div>

          {/* Editor */}
          <div className="mb-8">
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Tell your story..."
            />
            {errors.content && (
              <p className="mt-2 text-sm text-red-600">{errors.content}</p>
            )}
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
