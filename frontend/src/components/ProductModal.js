import React, { useEffect, useState } from 'react';
import { FiX, FiMessageCircle, FiFlag, FiTrash2 } from 'react-icons/fi';
import { getRecommendations, reportProduct, deleteProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from './ProductCard';
import './ProductModal.css';

export default function ProductModal({ product, onClose, onDelete }) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (product?._id) {
      getRecommendations(product._id)
        .then((res) => setRecommendations(res.data))
        .catch(() => {});
    }
  }, [product]);

  if (!product) return null;

  const isOwner = user && product.sellerId?._id === user._id;
  const sellerPhone = product.sellerId?.whatsappNumber || '';
  const whatsappUrl = `https://wa.me/${sellerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hi! I'm interested in your "${product.title}" listed on CampusSwap for ₹${product.price}. Is it still available?`
  )}`;

  const handleReport = async () => {
    try {
      await reportProduct(product._id);
      setReported(true);
    } catch {}
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this listing?')) {
      try {
        await deleteProduct(product._id);
        onDelete(product._id);
        onClose();
      } catch {}
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FiX size={22} /></button>

        <div className="modal-grid">
          {/* Left: Image/PDF */}
          <div className="modal-media">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title} />
            ) : (
              <div className="modal-pdf-badge">PDF Notes</div>
            )}
          </div>

          {/* Right: Details */}
          <div className="modal-details">
            <span className={`modal-type ${product.type === 'Note' ? 'type-note' : 'type-gadget'}`}>
              {product.type}
            </span>
            <h2>{product.title}</h2>
            <p className="modal-price">
              {product.price === 0 ? 'FREE' : `₹${product.price}`}
            </p>
            <p className="modal-dept">{product.department} &bull; {product.category}</p>

            {/* AI Caption */}
            {product.aiGeneratedData?.caption && (
              <div className="modal-ai-section">
                <h4>AI Description</h4>
                <p>{product.aiGeneratedData.caption}</p>
              </div>
            )}

            {/* 5-Point Summary for Notes */}
            {product.aiGeneratedData?.fivePointSummary?.length > 0 && (
              <div className="modal-ai-section">
                <h4>AI Study Guide</h4>
                <ul className="summary-list">
                  {product.aiGeneratedData.fivePointSummary.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="modal-seller">
              Seller: <strong>{product.sellerId?.name}</strong> ({product.sellerId?.department})
            </p>

            {/* Actions */}
            <div className="modal-actions">
              {!isOwner && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  <FiMessageCircle /> Chat to Buy
                </a>
              )}
              {isOwner && (
                <button onClick={handleDelete} className="btn-delete">
                  <FiTrash2 /> Delete Listing
                </button>
              )}
              {!isOwner && user && (
                <button onClick={handleReport} className="btn-report" disabled={reported}>
                  <FiFlag /> {reported ? 'Reported' : 'Report'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="modal-recommendations">
            <h4>You might also need</h4>
            <div className="rec-grid">
              {recommendations.map((rec) => (
                <ProductCard key={rec._id} product={rec} onClick={() => {}} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
