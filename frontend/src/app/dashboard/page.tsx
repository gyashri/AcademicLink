'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ModeSwitcher from '@/components/ui/ModeSwitcher';
import AppShell from '@/components/ui/AppShell';
import ListingCard from '@/components/ui/ListingCard';
import { listingAPI, orderAPI, paymentAPI, notificationAPI } from '@/lib/api';
import {
  Bell, Search, PlusCircle, ShoppingBag, Package, CreditCard,
  TrendingUp, BookOpen, FileText, Star, ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ totalListings: 0, totalOrders: 0, earnings: 0 });
  const [paymentsConfigured, setPaymentsConfigured] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch notifications count
        const notifRes = await notificationAPI.getAll();
        setUnreadCount(notifRes.data.data.unreadCount);

        if (user.activeMode === 'buyer') {
          // Buyer: fetch recent listings and their orders
          const [listingsRes, ordersRes] = await Promise.all([
            listingAPI.getAll({ limit: 6 }),
            orderAPI.getMine('buyer'),
          ]);
          setListings(listingsRes.data.data.listings);
          setOrders(ordersRes.data.data);
        } else {
          // Seller: fetch my listings, orders, and payment status
          const [myListingsRes, ordersRes, paymentRes] = await Promise.all([
            listingAPI.getMine(),
            orderAPI.getMine('seller'),
            paymentAPI.checkStatus().catch(() => ({ data: { data: { onboarded: false } } })),
          ]);
          setListings(myListingsRes.data.data.slice(0, 6));
          setOrders(ordersRes.data.data);
          setPaymentsConfigured(paymentRes.data.data.onboarded);
          setStats({
            totalListings: myListingsRes.data.data.length,
            totalOrders: ordersRes.data.data.length,
            earnings: ordersRes.data.data
              .filter((o: any) => o.status === 'completed')
              .reduce((sum: number, o: any) => sum + (o.sellerPayout || 0), 0),
          });
        }
      } catch {
        // Silently handle - dashboard still shows UI
      }
    };

    fetchData();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isBuyer = user.activeMode === 'buyer';

  return (
    <AppShell>
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-gray-500 text-sm">Hi,</p>
            <h1 className="text-2xl font-bold">{user.name}</h1>
          </div>
          <button
            onClick={() => router.push('/notifications')}
            className="relative w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Buy/Sell Mode Switcher */}
        <div className="flex justify-center mb-6">
          <ModeSwitcher />
        </div>
      </div>

      {/* Action Cards - 2x2 grid like reference image */}
      <div className="px-5 mb-6 lg:px-8">
        <p className="text-sm text-gray-500 mb-3">Here are some things you can do</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isBuyer ? (
            <>
              <Link href="/listings">
                <div className="bg-blue-50 rounded-2xl p-4 h-32 flex flex-col justify-between hover:bg-blue-100 transition">
                  <Search size={24} className="text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Browse Notes</p>
                    <p className="text-xs text-gray-500">Find study materials</p>
                  </div>
                </div>
              </Link>
              <Link href="/orders">
                <div className="bg-green-50 rounded-2xl p-4 h-32 flex flex-col justify-between hover:bg-green-100 transition">
                  <ShoppingBag size={24} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">My Purchases</p>
                    <p className="text-xs text-gray-500">{orders.length} orders</p>
                  </div>
                </div>
              </Link>
              <Link href="/listings?category=book">
                <div className="bg-orange-50 rounded-2xl p-4 h-32 flex flex-col justify-between hover:bg-orange-100 transition">
                  <BookOpen size={24} className="text-orange-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Textbooks</p>
                    <p className="text-xs text-gray-500">Physical books</p>
                  </div>
                </div>
              </Link>
              <Link href="/listings?category=notes">
                <div className="bg-purple-50 rounded-2xl p-4 h-32 flex flex-col justify-between hover:bg-purple-100 transition">
                  <FileText size={24} className="text-purple-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Digital Notes</p>
                    <p className="text-xs text-gray-500">PDFs & handwritten</p>
                  </div>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/listings/create">
                <div className="bg-blue-50 rounded-2xl p-4 h-32 flex flex-col justify-between hover:bg-blue-100 transition">
                  <PlusCircle size={24} className="text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">New Listing</p>
                    <p className="text-xs text-gray-500">Sell your materials</p>
                  </div>
                </div>
              </Link>
              <Link href="/orders?role=seller">
                <div className="bg-green-50 rounded-2xl p-4 h-32 flex flex-col justify-between hover:bg-green-100 transition">
                  <Package size={24} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Orders</p>
                    <p className="text-xs text-gray-500">{orders.length} total</p>
                  </div>
                </div>
              </Link>
              <Link href="/orders?role=seller">
                <div className="bg-emerald-50 rounded-2xl p-4 h-32 flex flex-col justify-between hover:bg-emerald-100 transition">
                  <TrendingUp size={24} className="text-emerald-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Earnings</p>
                    <p className="text-xs text-gray-500">&#8377;{stats.earnings}</p>
                  </div>
                </div>
              </Link>
              <Link href="/listings">
                <div className="bg-amber-50 rounded-2xl p-4 h-32 flex flex-col justify-between hover:bg-amber-100 transition">
                  <Star size={24} className="text-amber-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">My Listings</p>
                    <p className="text-xs text-gray-500">{stats.totalListings} active</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Payment Status Banner (Seller mode) */}
      {!isBuyer && !paymentsConfigured && (
        <div className="px-5 mb-6 lg:px-8">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <CreditCard size={24} className="text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-green-900">Dev Mode: Payments Active</h3>
                <p className="text-xs text-green-700 mt-1">
                  Orders work without Razorpay in development. Buyers can purchase your listings and orders go directly to escrow.
                </p>
                <p className="text-xs text-green-600 mt-2 font-medium">
                  Add your Razorpay test keys in .env to enable real payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Listings / My Listings */}
      <div className="px-5 lg:px-8 lg:pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">
            {isBuyer ? 'Recent Listings' : 'My Listings'}
          </h2>
          <Link
            href={isBuyer ? '/listings' : '/listings/create'}
            className="text-blue-600 text-sm font-medium flex items-center gap-1"
          >
            {isBuyer ? 'See all' : 'Add new'}
            <ChevronRight size={16} />
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {listings.map((listing: any) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-400 text-sm">
              {isBuyer ? 'No listings yet. Check back soon!' : 'You haven\'t listed anything yet.'}
            </p>
            {!isBuyer && (
              <Link
                href="/listings/create"
                className="inline-block mt-3 text-blue-600 font-semibold text-sm"
              >
                Create your first listing
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
    </AppShell>
  );
}
