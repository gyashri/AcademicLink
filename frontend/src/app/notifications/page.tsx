'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { notificationAPI } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import {
  ChevronLeft, ShoppingBag, AlertTriangle, MessageCircle,
  Bell, Package, CheckCircle,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  order: ShoppingBag,
  dispute: AlertTriangle,
  message: MessageCircle,
  delivery: Package,
  default: Bell,
};

const colorMap: Record<string, string> = {
  order: 'bg-blue-100 text-blue-600',
  dispute: 'bg-red-100 text-red-600',
  message: 'bg-purple-100 text-purple-600',
  delivery: 'bg-green-100 text-green-600',
  default: 'bg-gray-100 text-gray-600',
};

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      try {
        const { data } = await notificationAPI.getAll();
        setNotifications(data.data.notifications || []);
        // Mark all as read
        await notificationAPI.markRead();
      } catch {
        // silently handle
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <AppShell>
      <div className="pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4 lg:px-8 lg:pt-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center lg:hidden"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>

        {/* Notifications List */}
        <div className="px-5 lg:px-8 lg:pb-8">
          {fetching ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4">
              {notifications.map((notif: any) => {
                const Icon = iconMap[notif.type] || iconMap.default;
                const color = colorMap[notif.type] || colorMap.default;

                return (
                  <div
                    key={notif._id}
                    className={`flex items-start gap-3 p-4 rounded-xl ${
                      notif.read ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
