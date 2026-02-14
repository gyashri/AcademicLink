'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listingAPI, orderAPI, chatAPI, aiAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/ui/AppShell';
import {
  ChevronLeft, Heart, Share2, MessageCircle, ShoppingCart,
  BookOpen, FileText, Eye, Star, Tag, Brain, Sparkles,
  ExternalLink, CheckCircle, Download,
} from 'lucide-react';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [studyKit, setStudyKit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'studykit'>('details');
  const [purchasedOrder, setPurchasedOrder] = useState<any>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data } = await listingAPI.getById(id as string);
        setListing(data.data);

        if (user) {
          try {
            const ordersRes = await orderAPI.getMine('buyer');
            const existing = ordersRes.data.data.find(
              (o: any) => o.listing?._id === (id as string) && ['pending', 'escrow', 'completed'].includes(o.status)
            );
            if (existing) setPurchasedOrder(existing);
          } catch {}
        }

        if (data.data.type === 'digital' && data.data.aiMetadata?.summary) {
          try {
            const skRes = await aiAPI.getStudyKit(id as string);
            setStudyKit(skRes.data.data);
          } catch {}
        }
      } catch {
        router.replace('/listings');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, router, user]);

  const handleBuy = async () => {
    if (!user) { router.push('/login'); return; }
    setBuying(true);
    try {
      const { data } = await orderAPI.create(listing._id);
      const { order, razorpayOrder } = data.data;

      if (razorpayOrder) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise<void>((resolve) => { script.onload = () => resolve(); });

        const options = {
          key: razorpayOrder.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'AcademicLink',
          description: listing.title,
          order_id: razorpayOrder.id,
          handler: async (response: any) => {
            try {
              await orderAPI.verifyPayment({
                orderId: order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              alert('Payment successful! Order is now in escrow.');
              router.push('/orders');
            } catch {
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: { name: user.name, email: user.email },
          theme: { color: '#2563EB' },
          modal: { ondismiss: () => { setBuying(false); } },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } else {
        alert(`Order created successfully! (Dev mode - payment skipped)\nStatus: ${order.status}`);
        router.push('/orders');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create order.');
    } finally {
      setBuying(false);
    }
  };

  const handleOpenDownload = async () => {
    if (!purchasedOrder) return;
    try {
      const { data } = await orderAPI.getDownload(purchasedOrder._id);
      let url = data.data.downloadUrl;
      if (url.startsWith('/uploads/')) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        url = apiBase.replace('/api', '') + url;
      }
      window.open(url, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Download failed.');
    }
  };

  const handleChat = async () => {
    if (!user) { router.push('/login'); return; }
    try {
      const { data } = await chatAPI.getOrCreate(listing._id, listing.seller._id);
      router.push(`/chat/${data.data._id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start chat.');
    }
  };

  if (loading || !listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isOwner = user?.id === listing.seller?._id;

  return (
    <AppShell>
    <div className="pb-32 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 lg:px-8 lg:pt-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center lg:hidden">
          <ChevronLeft size={20} />
        </button>
        <div className="hidden lg:block">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ChevronLeft size={16} /> Back to listings
          </button>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
            <Heart size={18} />
          </button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Desktop: side-by-side layout */}
      <div className="lg:flex lg:gap-8 lg:px-8 lg:pb-8">
        {/* Left column: Image */}
        <div className="lg:w-1/2 lg:flex-shrink-0">
          <div className="aspect-square bg-gray-50 flex items-center justify-center mx-5 rounded-2xl overflow-hidden lg:mx-0 lg:sticky lg:top-8">
            {listing.imageUrls?.[0] ? (
              <img src={listing.imageUrls[0]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-300">
                {listing.category === 'book' ? <BookOpen size={64} /> : <FileText size={64} />}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Details */}
        <div className="lg:w-1/2">
          {/* Tabs for digital listings */}
          {listing.type === 'digital' && (
            <div className="flex mx-5 mt-4 bg-gray-100 rounded-xl p-1 lg:mx-0 lg:mt-0">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'details' ? 'bg-white shadow-sm' : 'text-gray-500'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('studykit')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                  activeTab === 'studykit' ? 'bg-white shadow-sm' : 'text-gray-500'
                }`}
              >
                <Sparkles size={14} /> Study Kit
              </button>
            </div>
          )}

          {activeTab === 'details' ? (
            <div className="px-5 mt-4 lg:px-0">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  listing.type === 'digital' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {listing.type === 'digital' ? 'Digital' : 'Physical'}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Eye size={12} /> {listing.viewCount} views
                </span>
              </div>

              <h1 className="text-xl lg:text-2xl font-bold mb-1">{listing.title}</h1>
              <p className="text-2xl lg:text-3xl font-bold text-blue-600 mb-3">&#8377;{listing.price}</p>

              {/* Course Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                <p className="text-sm"><span className="text-gray-500">Course:</span> <span className="font-medium">{listing.courseCode}</span></p>
                <p className="text-sm"><span className="text-gray-500">Department:</span> <span className="font-medium">{listing.department}</span></p>
                {listing.professor && (
                  <p className="text-sm"><span className="text-gray-500">Professor:</span> <span className="font-medium">{listing.professor}</span></p>
                )}
                {listing.condition && (
                  <p className="text-sm"><span className="text-gray-500">Condition:</span> <span className="font-medium capitalize">{listing.condition}</span></p>
                )}
              </div>

              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-sm text-gray-600 mb-4">{listing.description}</p>

              {listing.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Seller Info */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {listing.seller?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{listing.seller?.name}</p>
                    <p className="text-xs text-gray-500">Seller</p>
                  </div>
                </div>
                {!isOwner && (
                  <button onClick={handleChat} className="text-blue-600">
                    <MessageCircle size={22} />
                  </button>
                )}
              </div>

              {/* Desktop Buy/Action Buttons (inline) */}
              {!isOwner && (
                <div className="hidden lg:flex gap-3 mt-6">
                  <button
                    onClick={handleChat}
                    className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                  >
                    <MessageCircle size={18} /> Chat
                  </button>
                  {purchasedOrder ? (
                    listing.type === 'digital' ? (
                      <button
                        onClick={handleOpenDownload}
                        className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition"
                      >
                        <Download size={18} /> Open Notes
                      </button>
                    ) : (
                      <div className="flex-[2] py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Purchased
                      </div>
                    )
                  ) : (
                    <button
                      onClick={handleBuy}
                      disabled={buying}
                      className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-blue-300 transition"
                    >
                      <ShoppingCart size={18} /> {buying ? 'Processing...' : `Buy ₹${listing.price}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Study Kit Tab */
            <div className="px-5 mt-4 lg:px-0">
              {listing.aiMetadata?.summary ? (
                <>
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Brain size={16} className="text-blue-600" /> AI Summary
                    </h3>
                    <p className="text-sm text-gray-700">{listing.aiMetadata.summary}</p>
                  </div>

                  {studyKit?.mcqs && studyKit.mcqs.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-3">Practice MCQs</h3>
                      {studyKit.mcqs.map((mcq: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 mb-3">
                          <p className="text-sm font-medium mb-2">Q{i + 1}. {mcq.question}</p>
                          <div className="space-y-1">
                            {mcq.options.map((opt: string, j: number) => (
                              <p key={j} className="text-sm text-gray-600 pl-2">
                                {String.fromCharCode(65 + j)}. {opt}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                      {studyKit.previewOnly && (
                        <p className="text-xs text-center text-gray-400 mt-2">
                          Purchase to unlock all 5 MCQs and full study kit
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">No AI study kit available for this listing</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      {!isOwner && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40 lg:hidden">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={handleChat}
              className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} /> Chat
            </button>
            {purchasedOrder ? (
              listing.type === 'digital' ? (
                <button
                  onClick={handleOpenDownload}
                  className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition"
                >
                  <Download size={18} /> Open Notes
                </button>
              ) : (
                <div className="flex-[2] py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> Purchased
                </div>
              )
            ) : (
              <button
                onClick={handleBuy}
                disabled={buying}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-blue-300 transition"
              >
                <ShoppingCart size={18} /> {buying ? 'Processing...' : `Buy ₹${listing.price}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}
