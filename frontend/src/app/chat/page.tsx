'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { chatAPI } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { ChevronLeft, MessageCircle } from 'lucide-react';

export default function ChatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    const fetchChats = async () => {
      try {
        const { data } = await chatAPI.getAll();
        setChats(data.data);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [user, router]);

  return (
    <AppShell>
    <div className="pb-24 lg:pb-8">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 lg:px-8 lg:pt-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center lg:hidden">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div className="px-5 lg:px-8 lg:pb-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : chats.length > 0 ? (
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {chats.map((chat: any) => {
              const otherUser = chat.participants?.find((p: any) => p._id !== user?.id);
              return (
                <button
                  key={chat._id}
                  onClick={() => router.push(`/chat/${chat._id}`)}
                  className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {otherUser?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm">{otherUser?.name || 'User'}</p>
                      {chat.lastMessageAt && (
                        <p className="text-xs text-gray-400">
                          {new Date(chat.lastMessageAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Re: {chat.listing?.title || 'Listing'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <MessageCircle size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No conversations yet</p>
          </div>
        )}
      </div>

    </div>
    </AppShell>
  );
}
