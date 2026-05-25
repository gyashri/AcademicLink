import React, { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { FiSearch } from 'react-icons/fi';
import './Home.css';

const CATEGORIES = ['All', 'Electronics', 'Stationery', 'Notes', 'Books', 'Other'];
const DEPARTMENTS = [
  'All', 'Computer Science', 'Mechanical', 'Civil', 'Electrical',
  'Electronics', 'Chemical', 'IT', 'Other',
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [department, setDepartment] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (department !== 'All') params.department = department;

      const res = await getProducts(params);
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load listings. Make sure the backend server is running.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, department, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, department]);

  const handleDelete = (id) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="home">
      {/* Hero */}
      <div className="hero">
        <h1>Campus<span>Swap</span></h1>
        <p>Buy & sell college essentials with AI-powered smart listings</p>

        {/* Search Bar */}
        <div className="search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="Search for gadgets, notes, books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={category === c ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="dept-select"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="products-section">
        {loading ? (
          <div className="loading">Loading listings...</div>
        ) : error ? (
          <div className="empty">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty">
            <h3>No listings found</h3>
            <p>Be the first to list something!</p>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onClick={setSelectedProduct}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
