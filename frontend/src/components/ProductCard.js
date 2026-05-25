import React from 'react';
import { FiFileText, FiCpu } from 'react-icons/fi';
import './ProductCard.css';

export default function ProductCard({ product, onClick }) {
  const isNote = product.type === 'Note';

  return (
    <div className="product-card" onClick={() => onClick(product)}>
      <div className="card-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} />
        ) : (
          <div className="card-placeholder">
            {isNote ? <FiFileText size={48} /> : <FiCpu size={48} />}
          </div>
        )}
        <span className={`card-badge ${isNote ? 'badge-note' : 'badge-gadget'}`}>
          {product.type}
        </span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{product.title}</h3>
        <p className="card-dept">{product.department}</p>
        {product.aiGeneratedData?.caption && (
          <p className="card-caption">{product.aiGeneratedData.caption}</p>
        )}
        <div className="card-footer">
          <span className="card-price">
            {product.price === 0 ? 'FREE' : `₹${product.price}`}
          </span>
          <span className="card-seller">
            by {product.sellerId?.name || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}
