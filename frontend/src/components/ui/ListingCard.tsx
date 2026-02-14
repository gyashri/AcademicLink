'use client';

import Link from 'next/link';
import { BookOpen, FileText, Tag } from 'lucide-react';

interface ListingCardProps {
  listing: {
    _id: string;
    title: string;
    price: number;
    type: 'physical' | 'digital';
    category: string;
    images: string[];
    imageUrls?: string[];
    courseCode: string;
    department: string;
    seller?: { name: string };
    university?: { name: string };
    tags?: string[];
  };
}

const categoryIcons: Record<string, any> = {
  book: BookOpen,
  notes: FileText,
  cheatsheet: FileText,
};

export default function ListingCard({ listing }: ListingCardProps) {
  const Icon = categoryIcons[listing.category] || Tag;
  const imageUrl = listing.imageUrls?.[0];

  return (
    <Link href={`/listings/${listing._id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        {/* Image / Placeholder */}
        <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
          {imageUrl ? (
            <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <Icon size={48} className="text-gray-300" />
          )}
          {/* Type badge */}
          <span
            className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${
              listing.type === 'digital'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {listing.type === 'digital' ? 'Digital' : 'Physical'}
          </span>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-500 font-medium">{listing.courseCode} &middot; {listing.department}</p>
          <h3 className="font-semibold text-gray-900 text-sm mt-1 line-clamp-2">{listing.title}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-gray-900">&#8377;{listing.price}</span>
            <button className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
              <span className="text-lg leading-none">+</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
