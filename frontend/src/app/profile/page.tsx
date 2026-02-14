'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut, Mail, School, Shield, ChevronRight, User, Settings, HelpCircle } from 'lucide-react';
import AppShell from '@/components/ui/AppShell';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const menuItems = [
    { icon: User, label: 'Edit Profile', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
    { icon: HelpCircle, label: 'Help & Support', href: '#' },
    { icon: Shield, label: 'Privacy Policy', href: '#' },
  ];

  return (
    <AppShell>
      <div className="pb-24 lg:pb-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 lg:px-8 lg:pt-8">
        <h1 className="text-xl font-bold mb-6">Profile</h1>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-blue-100 text-sm flex items-center gap-1">
              <Mail size={14} />
              {user.email}
            </p>
            {user.university && (
              <p className="text-blue-100 text-sm flex items-center gap-1 mt-1">
                <School size={14} />
                {user.university.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="lg:px-8 lg:pb-8">
        <div className="lg:max-w-2xl lg:mx-auto">
          {/* Mode Badge */}
          <div className="px-6 -mt-4 lg:px-0">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Mode</p>
            <p className="font-semibold capitalize">{user.activeMode} Mode</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            user.activeMode === 'buyer'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {user.activeMode === 'buyer' ? 'Buying' : 'Selling'}
          </span>
        </div>
      </div>

          {/* Menu Items */}
          <div className="px-6 mt-4 lg:px-0">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-gray-500" />
                <span className="text-gray-700">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>

          {/* Logout Button */}
          <div className="px-6 mt-6 lg:px-0">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-semibold py-3.5 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>

          {/* App Version */}
          <p className="text-center text-gray-400 text-xs mt-6">AcademicLink v1.0.0</p>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
