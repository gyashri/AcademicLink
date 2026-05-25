const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['Gadget', 'Note'],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, default: '' },
  pdfUrl: { type: String, default: '' },
  aiGeneratedData: {
    caption: { type: String, default: '' },
    fivePointSummary: { type: [String], default: [] },
    category: { type: String, default: '' },
  },
  department: {
    type: String,
    required: true,
    enum: [
      'Computer Science', 'Mechanical', 'Civil', 'Electrical',
      'Electronics', 'Chemical', 'IT', 'Other',
    ],
  },
  category: {
    type: String,
    enum: ['Electronics', 'Stationery', 'Notes', 'Books', 'Other'],
    default: 'Other',
  },
  isReported: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ department: 1, category: 1 });

module.exports = mongoose.model('Product', productSchema);
