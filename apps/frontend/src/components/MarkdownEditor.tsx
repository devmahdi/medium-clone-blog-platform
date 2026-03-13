'use client';

import { useState, useRef, useCallback } from 'react';
import { mediaApi } from '@/lib/api';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your story...',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);

  const insertText = (before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selected +
      after +
      value.substring(end);
    onChange(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    }, 0);
  };

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const result = await mediaApi.uploadContent(file);
        insertText(`![${file.name}](${result.url})`);
      } catch {
        alert('Failed to upload image');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [value]);

  const toolbar = [
    { label: 'B', action: () => insertText('**', '**'), title: 'Bold' },
    { label: 'I', action: () => insertText('*', '*'), title: 'Italic' },
    {
      label: 'H1',
      action: () => insertText('\n# '),
      title: 'Heading 1',
    },
    {
      label: 'H2',
      action: () => insertText('\n## '),
      title: 'Heading 2',
    },
    {
      label: 'H3',
      action: () => insertText('\n### '),
      title: 'Heading 3',
    },
    {
      label: '""',
      action: () => insertText('\n> '),
      title: 'Blockquote',
    },
    {
      label: '—',
      action: () => insertText('\n---\n'),
      title: 'Divider',
    },
    {
      label: '</>',
      action: () => insertText('\n```\n', '\n```\n'),
      title: 'Code block',
    },
    {
      label: '🔗',
      action: () => insertText('[', '](url)'),
      title: 'Link',
    },
    {
      label: '📷',
      action: handleImageUpload,
      title: 'Upload image',
    },
    { label: '•', action: () => insertText('\n- '), title: 'List' },
    {
      label: '1.',
      action: () => insertText('\n1. '),
      title: 'Numbered list',
    },
  ];

  // Simple markdown to HTML for preview
  const renderPreview = (md: string) => {
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headings
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      // Bold & italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Images
      .replace(
        /!\[(.+?)\]\((.+?)\)/g,
        '<img src="$2" alt="$1" class="max-w-full rounded my-4" />',
      )
      // Links
      .replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" class="text-blue-600 underline" target="_blank">$1</a>',
      )
      // Code blocks
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 p-4 rounded my-4 overflow-x-auto"><code>$1</code></pre>',
      )
      // Inline code
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      // Blockquotes
      .replace(
        /^&gt; (.+)$/gm,
        '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">$1</blockquote>',
      )
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br />');

    return `<p class="mb-4">${html}</p>`;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-gray-50 flex-wrap">
        {toolbar.map((item) => (
          <button
            key={item.title}
            onClick={item.action}
            title={item.title}
            type="button"
            className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 font-mono"
          >
            {item.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setPreview(!preview)}
          type="button"
          className={`px-3 py-1 text-sm rounded ${
            preview
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200 text-gray-600'
          }`}
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
        {uploading && (
          <span className="text-xs text-gray-500">Uploading...</span>
        )}
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          className="prose max-w-none p-6 min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[400px] p-6 text-lg leading-relaxed resize-none focus:outline-none font-serif"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        />
      )}
    </div>
  );
}
