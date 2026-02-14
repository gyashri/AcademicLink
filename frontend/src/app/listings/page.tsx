'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { listingAPI } from '@/lib/api';
import ListingCard from '@/components/ui/ListingCard';
import AppShell from '@/components/ui/AppShell';
import { Search, SlidersHorizontal, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ListingsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <ListingsPage />
    </Suspense>
  );
}

const categories = [
  { id: '', label: 'All' },
  { id: 'book', label: 'Books' },
  { id: 'notes', label: 'Notes' },
  { id: 'cheatsheet', label: 'Cheatsheets' },
  { id: 'calculator', label: 'Calculators' },
  { id: 'other', label: 'Other' },
];

function ListingsPage() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: '', department: '', minPrice: '', maxPrice: '' });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 30 };
      if (activeCategory) params.category = activeCategory;
      if (filters.type) params.type = filters.type;
      if (filters.department) params.department = filters.department;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      let res;
      if (searchQuery.trim()) {
        res = await listingAPI.search(searchQuery, params);
      } else {
        res = await listingAPI.getAll(params);
      }
      setListings(res.data.data.listings);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <AppShell>
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 lg:px-8 lg:pt-8">
        <Link href="/dashboard" className="lg:hidden">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1">Browse</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-5 mb-4 lg:px-8">
        <form onSubmit={handleSearch} className="relative lg:max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for notes, books, courses..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </form>
      </div>

      {/* Category Pills */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:px-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-5 mb-4 lg:px-8">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm"
              >
                <option value="">All Types</option>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>
              <input
                type="text"
                placeholder="Department"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm"
              />
              <input
                type="number"
                placeholder="Min &#8377;"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm"
              />
              <input
                type="number"
                placeholder="Max &#8377;"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm"
              />
            </div>
            <button
              onClick={fetchListings}
              className="mt-3 w-full md:w-auto md:px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Listings Grid */}
      <div className="px-5 lg:px-8 lg:pb-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {listings.map((listing: any) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">No listings found</p>
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}
