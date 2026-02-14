'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { ChevronLeft, Download, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

export default function OrdersPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <OrdersPage />
    </Suspense>
  );
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: 'text-yellow-600 bg-yellow-50', icon: Clock, label: 'Pending' },
  escrow: { color: 'text-blue-600 bg-blue-50', icon: Clock, label: 'In Escrow' },
  completed: { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'Completed' },
  disputed: { color: 'text-red-600 bg-red-50', icon: AlertCircle, label: 'Disputed' },
  refunded: { color: 'text-gray-600 bg-gray-100', icon: XCircle, label: 'Refunded' },
};

function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const role = searchParams.get('role') || (user?.activeMode === 'seller' ? 'seller' : 'buyer');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await orderAPI.getMine(role);
        setOrders(data.data);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [role]);

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      await orderAPI.confirmDelivery(orderId);
      setOrders(orders.map((o) => o._id === orderId ? { ...o, status: 'completed' } : o));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm delivery.');
    }
  };

  const handleDispute = async (orderId: string) => {
    const reason = prompt('Please describe the issue:');
    if (!reason) return;
    try {
      await orderAPI.dispute(orderId, reason);
      setOrders(orders.map((o) => o._id === orderId ? { ...o, status: 'disputed' } : o));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to raise dispute.');
    }
  };

  const handleDownload = async (orderId: string) => {
    try {
      const { data } = await orderAPI.getDownload(orderId);
      let url = data.data.downloadUrl;
      // If relative path (local storage), prepend backend URL
      if (url.startsWith('/uploads/')) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        url = apiBase.replace('/api', '') + url;
      }
      window.open(url, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Download failed.');
    }
  };

  return (
    <AppShell>
      <div className="pb-24 lg:pb-8">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 lg:px-8 lg:pt-8">
          <button onClick={() => router.back()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center lg:hidden">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">My Orders</h1>
        </div>

        {/* Role filter */}
        <div className="flex mx-5 mb-4 bg-gray-100 rounded-xl p-1 lg:px-8">
        <button
          onClick={() => router.push('/orders?role=buyer')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${role === 'buyer' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
        >
          Purchases
        </button>
        <button
          onClick={() => router.push('/orders?role=seller')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${role === 'seller' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
        >
          Sales
        </button>
      </div>

      <div className="px-5 space-y-3 lg:px-8 lg:pb-8 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : orders.length > 0 ? (
          orders.map((order: any) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{order.listing?.title || 'Listing'}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {role === 'buyer' ? `Seller: ${order.seller?.name}` : `Buyer: ${order.buyer?.name}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${status.color}`}>
                    <StatusIcon size={12} /> {status.label}
                  </span>
                </div>

                <p className="font-bold mb-3">&#8377;{order.amount}</p>

                {/* Buyer actions */}
                {role === 'buyer' && (order.status === 'escrow' || (order.status === 'completed' && order.listing?.type === 'digital')) && (
                  <div className="flex gap-2 border-t border-gray-100 pt-3">
                    {order.status === 'escrow' && (
                      <>
                        <button
                          onClick={() => handleConfirmDelivery(order._id)}
                          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium"
                        >
                          Receipt
                        </button>
                        <button
                          onClick={() => handleDispute(order._id)}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-medium"
                        >
                          Dispute
                        </button>
                      </>
                    )}
                    {['escrow', 'completed'].includes(order.status) && order.listing?.type === 'digital' && (
                      <button
                        onClick={() => handleDownload(order._id)}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium flex items-center gap-1"
                      >
                        <Download size={12} /> Download
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">No orders yet</p>
          </div>
        )}
      </div>
      </div>
    </AppShell>
  );
}
