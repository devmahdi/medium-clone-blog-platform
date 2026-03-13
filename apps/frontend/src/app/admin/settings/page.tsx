'use client';

import { useState, useEffect } from 'react';
import { adminApi, isAdmin, ApiError } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Toast, { ToastType } from '@/components/Toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    siteName: '',
    siteDescription: '',
    homepageBanner: {
      enabled: false,
      title: '',
      subtitle: '',
      ctaText: '',
      ctaLink: '',
    },
    featuredArticleIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAdmin()) {
      window.location.href = '/';
    } else {
      loadSettings();
    }
  }, []);

  const loadSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      setSettings(data);
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      setToast({
        show: true,
        message: 'Settings saved successfully!',
        type: 'success',
      });
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof ApiError ? err.message : 'Failed to save settings',
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Site Settings
            </h1>
            <p className="text-gray-600">
              Configure site-wide settings and homepage content
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* General Settings */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                General
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="My Blog"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        siteDescription: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="A place for great stories"
                  />
                </div>
              </div>
            </div>

            {/* Homepage Banner */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Homepage Banner
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepageBanner.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        homepageBanner: {
                          ...settings.homepageBanner,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Enable</span>
                </label>
              </div>

              {settings.homepageBanner.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Title
                    </label>
                    <input
                      type="text"
                      value={settings.homepageBanner.title}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          homepageBanner: {
                            ...settings.homepageBanner,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Welcome to our blog"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Subtitle
                    </label>
                    <input
                      type="text"
                      value={settings.homepageBanner.subtitle}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          homepageBanner: {
                            ...settings.homepageBanner,
                            subtitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Discover great stories"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={settings.homepageBanner.ctaText}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          homepageBanner: {
                            ...settings.homepageBanner,
                            ctaText: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Get Started"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA Link
                    </label>
                    <input
                      type="text"
                      value={settings.homepageBanner.ctaLink}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          homepageBanner: {
                            ...settings.homepageBanner,
                            ctaLink: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="/write"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Featured Articles */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Featured Articles
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Enter article IDs (one per line) to feature on homepage
              </p>

              <textarea
                value={settings.featuredArticleIds.join('\n')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    featuredArticleIds: e.target.value
                      .split('\n')
                      .map((id) => id.trim())
                      .filter(Boolean),
                  })
                }
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="article-id-1&#10;article-id-2&#10;article-id-3"
              />
              <p className="text-xs text-gray-500 mt-2">
                {settings.featuredArticleIds.length} article(s) featured
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
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
