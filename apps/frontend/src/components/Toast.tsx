'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type,
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in max-w-md`}
    >
      <span className="text-xl font-bold">{icon}</span>
      <p className="flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 font-bold text-xl leading-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
