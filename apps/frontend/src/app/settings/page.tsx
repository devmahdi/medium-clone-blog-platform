'use client';

import { useState, useEffect } from 'react';
import { usersApi, authApi, getCurrentUser, ApiError } from '@/lib/api';
import Toast, { ToastType } from '@/components/Toast';
import ProtectedRoute from '@/components/ProtectedRoute';

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

interface ProfileData {
  fullName: string;
  bio: string;
  avatarUrl: string;
  socialLinks: {
    twitter: string;
    github: string;
    website: string;
    linkedin: string;
  };
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    bio: '',
    avatarUrl: '',
    socialLinks: {
      twitter: '',
      github: '',
      website: '',
      linkedin: '',
    },
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        window.location.href = '/login';
        return;
      }

      const profile = await usersApi.getProfile(currentUser.sub);
      setProfileData({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        socialLinks: profile.socialLinks || {
          twitter: '',
          github: '',
          website: '',
          linkedin: '',
        },
      });
    } catch (error) {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (profileData.fullName && profileData.fullName.length > 100) {
      newErrors.fullName = 'Full name must be less than 100 characters';
    }

    if (profileData.bio && profileData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    // Validate URLs
    const urlFields = ['avatarUrl', 'twitter', 'github', 'website', 'linkedin'];
    urlFields.forEach((field) => {
      const value =
        field === 'avatarUrl'
          ? profileData.avatarUrl
          : profileData.socialLinks[field as keyof typeof profileData.socialLinks];

      if (value && value.trim()) {
        try {
          new URL(value);
        } catch {
          newErrors[field] = 'Please enter a valid URL';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateProfileForm()) {
      return;
    }

    setSaving(true);
    try {
      await usersApi.updateProfile(profileData);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validatePasswordForm()) {
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast('Password changed successfully!', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to change password', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Profile Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Profile Information
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={profileData.fullName}
                onChange={(e) =>
                  setProfileData({ ...profileData, fullName: e.target.value })
                }
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.fullName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } px-3 py-2 border`}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700"
              >
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.bio
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } px-3 py-2 border`}
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <div className="mt-1 flex justify-between">
                {errors.bio ? (
                  <p className="text-sm text-red-600">{errors.bio}</p>
                ) : (
                  <span />
                )}
                <p className="text-sm text-gray-500">
                  {profileData.bio.length}/500
                </p>
              </div>
            </div>

            {/* Avatar URL */}
            <div>
              <label
                htmlFor="avatarUrl"
                className="block text-sm font-medium text-gray-700"
              >
                Avatar URL
              </label>
              <input
                type="url"
                id="avatarUrl"
                value={profileData.avatarUrl}
                onChange={(e) =>
                  setProfileData({ ...profileData, avatarUrl: e.target.value })
                }
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.avatarUrl
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } px-3 py-2 border`}
                placeholder="https://example.com/avatar.jpg"
              />
              {errors.avatarUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.avatarUrl}</p>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                Social Links
              </h3>

              <div>
                <label
                  htmlFor="twitter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Twitter
                </label>
                <input
                  type="url"
                  id="twitter"
                  value={profileData.socialLinks.twitter}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      socialLinks: {
                        ...profileData.socialLinks,
                        twitter: e.target.value,
                      },
                    })
                  }
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.twitter
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } px-3 py-2 border`}
                  placeholder="https://twitter.com/username"
                />
                {errors.twitter && (
                  <p className="mt-1 text-sm text-red-600">{errors.twitter}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="github"
                  className="block text-sm font-medium text-gray-700"
                >
                  GitHub
                </label>
                <input
                  type="url"
                  id="github"
                  value={profileData.socialLinks.github}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      socialLinks: {
                        ...profileData.socialLinks,
                        github: e.target.value,
                      },
                    })
                  }
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.github
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } px-3 py-2 border`}
                  placeholder="https://github.com/username"
                />
                {errors.github && (
                  <p className="mt-1 text-sm text-red-600">{errors.github}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700"
                >
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  value={profileData.socialLinks.website}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      socialLinks: {
                        ...profileData.socialLinks,
                        website: e.target.value,
                      },
                    })
                  }
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.website
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } px-3 py-2 border`}
                  placeholder="https://yourwebsite.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="linkedin"
                  className="block text-sm font-medium text-gray-700"
                >
                  LinkedIn
                </label>
                <input
                  type="url"
                  id="linkedin"
                  value={profileData.socialLinks.linkedin}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      socialLinks: {
                        ...profileData.socialLinks,
                        linkedin: e.target.value,
                      },
                    })
                  }
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.linkedin
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } px-3 py-2 border`}
                  placeholder="https://linkedin.com/in/username"
                />
                {errors.linkedin && (
                  <p className="mt-1 text-sm text-red-600">{errors.linkedin}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.currentPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } px-3 py-2 border`}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.newPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } px-3 py-2 border`}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } px-3 py-2 border`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
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
