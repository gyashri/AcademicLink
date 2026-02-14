'use client';

import { useAuth } from '@/context/AuthContext';

export default function ModeSwitcher() {
  const { user, switchMode } = useAuth();

  if (!user) return null;

  return (
    <div className="flex bg-gray-100 rounded-full p-1 w-full max-w-xs">
      <button
        onClick={() => switchMode('buyer')}
        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
          user.activeMode === 'buyer'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Buy
      </button>
      <button
        onClick={() => switchMode('seller')}
        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
          user.activeMode === 'seller'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Sell
      </button>
    </div>
  );
}
