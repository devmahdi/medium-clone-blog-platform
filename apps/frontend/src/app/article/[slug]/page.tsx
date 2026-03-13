import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { articlesApi, Article } from '@/lib/api';
import { markdownToHtml } from '@/lib/markdown';
import AuthorCard from '@/components/article/AuthorCard';
import ClapButton from '@/components/article/ClapButton';
import BookmarkButton from '@/components/article/BookmarkButton';
import CommentsSection from '@/components/article/CommentsSection';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/articles/${slug}`, {
      cache: 'no-store', // Always fetch fresh for accurate counts
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getRelatedArticles(
  slug: string,
  tags?: string[],
): Promise<Article[]> {
  try {
    const tag = tags?.[0];
    const qs = tag ? `?tag=${encodeURIComponent(tag)}&limit=3` : '?limit=3';
    const res = await fetch(`${API_BASE_URL}/articles${qs}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).filter((a: Article) => a.slug !== slug);
  } catch {
    return [];
  }
}

// Generate metadata for SEO and Open Graph
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  const description = article.excerpt || article.content.substring(0, 160);

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      publishedTime: article.publishedAt || article.createdAt,
      authors: [article.author.fullName || article.author.username],
      tags: article.tags,
      images: article.coverImageUrl ? [{ url: article.coverImageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: article.coverImageUrl ? [article.coverImageUrl] : [],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(slug, article.tags);
  const htmlContent = markdownToHtml(article.content);

  return (
    <div className="min-h-screen bg-white">
      {/* Article content */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-gray-600 text-sm mb-8">
          <Link
            href={`/@${article.author.username}`}
            className="flex items-center gap-2 hover:underline"
          >
            {article.author.avatarUrl ? (
              <img
                src={article.author.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                {(article.author.fullName || article.author.username)[0].toUpperCase()}
              </div>
            )}
            <span className="font-medium text-gray-900">
              {article.author.fullName || article.author.username}
            </span>
          </Link>
          <span>·</span>
          <time dateTime={article.publishedAt || article.createdAt}>
            {new Date(article.publishedAt || article.createdAt).toLocaleDateString(
              'en-US',
              { month: 'long', day: 'numeric', year: 'numeric' },
            )}
          </time>
          <span>·</span>
          <span>{Math.ceil(article.content.length / 1000)} min read</span>
        </div>

        {/* Cover image */}
        {article.coverImageUrl && (
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full rounded-lg mb-8 max-h-[500px] object-cover"
          />
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag}`}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: '1.125rem',
            lineHeight: '1.8',
          }}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-4 py-8 border-t border-b mb-8">
          <ClapButton articleId={article.id} initialCount={article.likeCount} />
          <BookmarkButton
            articleId={article.id}
            initialBookmarked={article.isBookmarked || false}
          />
          <div className="flex-1" />
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: article.title,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied!');
              }
            }}
            className="text-gray-500 hover:text-gray-700"
            title="Share"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>

        {/* Author card */}
        <AuthorCard author={article.author} />

        {/* Comments */}
        <CommentsSection articleId={article.id} />
      </article>

      {/* Sidebar - Related articles */}
      {relatedArticles.length > 0 && (
        <aside className="max-w-3xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Related articles
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/article/${related.slug}`}
                className="group block"
              >
                {related.coverImageUrl && (
                  <img
                    src={related.coverImageUrl}
                    alt=""
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 mb-2 line-clamp-2">
                  {related.title}
                </h3>
                {related.excerpt && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                    {related.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{related.author.username}</span>
                  <span>·</span>
                  <span>
                    {new Date(
                      related.publishedAt || related.createdAt,
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      )}

      {/* Global prose styles */}
      <style jsx global>{`
        .prose h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.25;
        }
        .prose h2 {
          font-size: 1.75rem;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 0.875rem;
          line-height: 1.3;
        }
        .prose h3 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.35;
        }
        .prose p {
          margin-bottom: 1.5rem;
          color: #374151;
        }
        .prose img {
          max-width: 100%;
          height: auto;
          margin: 2rem 0;
          border-radius: 0.5rem;
        }
        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }
        .prose a:hover {
          color: #1d4ed8;
        }
        .prose blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          font-style: italic;
          color: #6b7280;
          margin: 1.5rem 0;
        }
        .prose pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .prose code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }
        .prose pre code {
          background: none;
          padding: 0;
        }
        .prose ul,
        .prose ol {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }
        .prose li {
          margin-bottom: 0.5rem;
        }
        .prose hr {
          margin: 2rem 0;
          border: 0;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
