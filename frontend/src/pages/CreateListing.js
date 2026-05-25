import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../services/api';
import { FiUploadCloud, FiLoader } from 'react-icons/fi';
import './CreateListing.css';

const DEPARTMENTS = [
  'Computer Science', 'Mechanical', 'Civil', 'Electrical',
  'Electronics', 'Chemical', 'IT', 'Other',
];

export default function CreateListing() {
  const [type, setType] = useState('Gadget');
  const [price, setPrice] = useState('');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a file');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('price', price);
      formData.append('department', department);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);

      const res = await createProduct(formData);
      setAiResult(res.data);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-container">
      <form className="create-form" onSubmit={handleSubmit}>
        <h2>Create Smart Listing</h2>
        <p className="create-subtitle">
          Upload a photo or PDF and let AI write your listing
        </p>

        {error && <div className="auth-error">{error}</div>}

        {/* Type Toggle */}
        <div className="type-toggle">
          <button
            type="button"
            className={type === 'Gadget' ? 'active' : ''}
            onClick={() => setType('Gadget')}
          >
            Gadget / Item
          </button>
          <button
            type="button"
            className={type === 'Note' ? 'active' : ''}
            onClick={() => setType('Note')}
          >
            Notes / PDF
          </button>
        </div>

        {/* File Upload */}
        <label className="file-upload">
          <input
            type="file"
            accept={type === 'Gadget' ? 'image/*' : 'application/pdf'}
            onChange={handleFileChange}
          />
          <div className="upload-area">
            {preview ? (
              <img src={preview} alt="Preview" className="upload-preview" />
            ) : (
              <>
                <FiUploadCloud size={36} />
                <span>
                  {type === 'Gadget'
                    ? 'Upload a photo of your item'
                    : 'Upload your PDF notes'}
                </span>
                <small>{file ? file.name : 'Click to browse'}</small>
              </>
            )}
          </div>
        </label>

        <input
          type="text"
          placeholder="Title (optional - AI will generate one)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="form-row">
          <input
            type="number"
            placeholder="Price (₹)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
          />
          <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
            <option value="">Department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? (
            <>
              <FiLoader className="spin" /> AI is analyzing...
            </>
          ) : (
            'Create Smart Listing'
          )}
        </button>

        {/* AI Result Preview */}
        {aiResult && (
          <div className="ai-result">
            <h4>Listing Created!</h4>
            <p><strong>Title:</strong> {aiResult.title}</p>
            {aiResult.aiGeneratedData?.caption && (
              <p><strong>AI Caption:</strong> {aiResult.aiGeneratedData.caption}</p>
            )}
            {aiResult.aiGeneratedData?.fivePointSummary?.length > 0 && (
              <>
                <p><strong>AI Study Guide:</strong></p>
                <ul>
                  {aiResult.aiGeneratedData.fivePointSummary.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="redirect-msg">Redirecting to marketplace...</p>
          </div>
        )}
      </form>
    </div>
  );
}
