'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { chatAPI } from '@/lib/api';
import { ChevronLeft, Send } from 'lucide-react';
import Sidebar from '@/components/ui/Sidebar';

export default function ChatDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [chat, setChat] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const { data } = await chatAPI.getMessages(id as string);
        setChat(data.data);
      } catch {
        router.replace('/chat');
      }
    };
    fetchChat();

    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await chatAPI.sendMessage(id as string, message.trim());
      setMessage('');
      // Refresh messages
      const { data } = await chatAPI.getMessages(id as string);
      setChat(data.data);
    } catch { /* empty */ } finally {
      setSending(false);
    }
  };

  const otherUser = chat?.participants?.find((p: any) => p._id !== user?.id);

  return (
    <>
    <Sidebar />
    <div className="flex flex-col h-screen lg:ml-64">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white lg:px-8">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
          {otherUser?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-semibold text-sm">{otherUser?.name || 'User'}</p>
          <p className="text-xs text-gray-400">Re: {chat?.listing?.title || 'Listing'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 lg:px-8">
        {chat?.messages?.map((msg: any, i: number) => {
          const isMine = msg.sender === user?.id || msg.sender?._id === user?.id;
          return (
            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                isMine
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
              }`}>
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 lg:px-8">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:bg-blue-300"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
    </>
  );
}
