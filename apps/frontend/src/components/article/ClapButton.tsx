'use client';

import { useState, useEffect } from 'react';
import { clapsApi, isAuthenticated } from '@/lib/api';

interface ClapButtonProps {
  articleId: string;
  initialCount: number;
}

export default function ClapButton({ articleId, initialCount }: ClapButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [userClaps, setUserClaps] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  const handleClap = async () => {
    if (!isAuthenticated()) {
      alert('Please log in to clap');
      return;
    }

    if (userClaps >= 50) {
      alert('Maximum 50 claps per article');
      return;
    }

    // Optimistic update
    setCount(count + 1);
    setUserClaps(userClaps + 1);
    setAnimating(true);

    // Add particle animation
    const particleId = Date.now();
    setParticles((prev) => [...prev, particleId]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((id) => id !== particleId));
    }, 1000);

    try {
      const result = await clapsApi.clap(articleId, 1);
      setCount(result.totalClaps);
    } catch {
      // Revert on error
      setCount(count);
      setUserClaps(userClaps);
    } finally {
      setTimeout(() => setAnimating(false), 300);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClap}
        className={`group flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:border-green-500 transition-all ${
          animating ? 'scale-110' : 'scale-100'
        }`}
        style={{ transition: 'transform 0.2s ease-out' }}
      >
        <span
          className={`text-2xl ${animating ? 'animate-bounce' : ''}`}
          style={{ display: 'inline-block' }}
        >
          👏
        </span>
        <span className="text-sm font-medium text-gray-700">{count}</span>
      </button>

      {/* Particle animations */}
      {particles.map((id) => (
        <div
          key={id}
          className="absolute text-xl pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            animation: 'float-up 1s ease-out forwards',
            transform: 'translate(-50%, -50%)',
          }}
        >
          +1
        </div>
      ))}

      {userClaps > 0 && (
        <div className="text-xs text-gray-500 mt-1 text-center">
          You clapped {userClaps}x
        </div>
      )}

      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -150%) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
