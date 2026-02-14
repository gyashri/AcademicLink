'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { listingAPI, aiAPI } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { ChevronLeft, Camera, Upload, Sparkles, X } from 'lucide-react';

export default function CreateListingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'digital' as 'physical' | 'digital',
    category: 'notes',
    price: '',
    department: '',
    courseCode: '',
    professor: '',
    condition: 'good',
    tags: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  // AI Smart Upload - OCR from photo
  const handleSmartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await aiAPI.ocrExtract(formData);
      const meta = data.data;

      // Auto-fill extracted info
      setForm((prev) => ({
        ...prev,
        title: meta.extractedTitle || prev.title,
        tags: meta.tags?.join(', ') || prev.tags,
      }));

      // Add to images
      setImages((prev) => [...prev, file].slice(0, 5));
    } catch {
      setError('AI extraction failed. Please fill in details manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.description || !form.price || !form.department || !form.courseCode) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      images.forEach((img) => formData.append('images', img));
      if (pdfFile) formData.append('file', pdfFile);

      const { data } = await listingAPI.create(formData);

      if (data.data.status === 'flagged') {
        alert('Your listing has been flagged for review due to potential academic integrity concerns. Our team will review it shortly.');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 lg:px-8 lg:pt-8">
          <button onClick={() => router.back()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center lg:hidden">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Create Listing</h1>
        </div>

        <form onSubmit={handleSubmit} className="px-5 space-y-4 lg:max-w-2xl lg:mx-auto lg:px-0">
        {/* AI Smart Upload */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-blue-600" />
            <h3 className="font-semibold text-sm">Smart Upload</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Take a photo of your book cover or notes — AI will auto-fill details</p>
          <label className={`flex items-center justify-center gap-2 py-3 bg-white rounded-xl border-2 border-dashed border-blue-200 cursor-pointer hover:bg-blue-50 transition ${ocrLoading ? 'opacity-50' : ''}`}>
            <Camera size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {ocrLoading ? 'AI analyzing...' : 'Snap & Auto-fill'}
            </span>
            <input type="file" accept="image/*" capture="environment" onChange={handleSmartUpload} className="hidden" disabled={ocrLoading} />
          </label>
        </div>

        {/* Type Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setForm({ ...form, type: 'digital' })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${form.type === 'digital' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
          >
            Digital (PDF)
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, type: 'physical' })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${form.type === 'physical' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
          >
            Physical
          </button>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm"
          >
            <option value="notes">Notes</option>
            <option value="book">Textbook</option>
            <option value="cheatsheet">Cheatsheet</option>
            <option value="calculator">Calculator</option>
            <option value="labcoat">Lab Coat</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Calculus II Complete Notes"
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what's included, quality, etc."
            rows={3}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Price, Course Code, Department */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Price (INR) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="₹ 150"
              required
              min="1"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Course Code *</label>
            <input
              type="text"
              value={form.courseCode}
              onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
              placeholder="CS50"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Department *</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="Computer Science"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Professor</label>
            <input
              type="text"
              value={form.professor}
              onChange={(e) => setForm({ ...form, professor: e.target.value })}
              placeholder="Dr. Smith"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Condition (physical only) */}
        {form.type === 'physical' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm"
            >
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="calculus, integration, midterm (comma-separated)"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Images */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Photos (up to 5)</label>
          <label className="flex items-center justify-center gap-2 py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition">
            <Upload size={18} className="text-gray-400" />
            <span className="text-sm text-gray-500">Upload images</span>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
          </label>
          {images.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PDF Upload (digital) */}
        {form.type === 'digital' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">PDF File *</label>
            <label className="flex items-center justify-center gap-2 py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition">
              <Upload size={18} className="text-gray-400" />
              <span className="text-sm text-gray-500">{pdfFile ? pdfFile.name : 'Upload PDF'}</span>
              <input type="file" accept=".pdf" onChange={handlePdfChange} className="hidden" />
            </label>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition"
        >
          {loading ? 'Creating listing...' : 'Publish Listing'}
        </button>
        </form>
      </div>
    </AppShell>
  );
}
