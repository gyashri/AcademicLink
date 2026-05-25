const express = require('express');
const pdfParse = require('pdf-parse');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const Product = require('../models/Product');
const { generateImageCaption, generatePdfSummary } = require('../utils/gemini');
const router = express.Router();

// POST /api/products - Create listing with AI
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { type, price, department, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    let aiData = { caption: '', fivePointSummary: [], category: 'Other' };
    let title = '';
    let imageUrl = '';
    let pdfUrl = '';

    if (type === 'Gadget') {
      // Image uploaded -> AI caption
      imageUrl = file.path;
      try {
        const aiResult = await generateImageCaption(imageUrl);
        title = aiResult.title || 'Untitled Gadget';
        aiData.caption = aiResult.caption || '';
        aiData.category = aiResult.category || 'Other';
      } catch (aiError) {
        console.error('AI caption error:', aiError.message);
        title = req.body.title || 'Untitled Gadget';
      }
    } else if (type === 'Note') {
      // PDF uploaded -> extract text -> AI summary
      pdfUrl = file.path;
      try {
        const pdfResponse = await fetch(pdfUrl);
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        const pdfData = await pdfParse(pdfBuffer, { max: 3 }); // First 3 pages
        const aiResult = await generatePdfSummary(pdfData.text);
        title = aiResult.title || 'Untitled Notes';
        aiData.fivePointSummary = aiResult.fivePointSummary || [];
        aiData.category = 'Notes';
      } catch (aiError) {
        console.error('AI summary error:', aiError.message);
        title = req.body.title || 'Untitled Notes';
      }
    }

    // Allow manual title override
    if (req.body.title) {
      title = req.body.title;
    }

    const product = new Product({
      sellerId: req.user._id,
      type,
      title,
      description: description || aiData.caption,
      price: parseFloat(price),
      imageUrl,
      pdfUrl,
      aiGeneratedData: aiData,
      department,
      category: aiData.category,
    });

    await product.save();
    await product.populate('sellerId', 'name department whatsappNumber');

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products - List with search & filters
router.get('/', async (req, res) => {
  try {
    const { search, category, department, type, page = 1, limit = 12 } = req.query;
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;
    if (department) query.department = department;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('sellerId', 'name department whatsappNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'name department whatsappNumber');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id/recommendations
router.get('/:id/recommendations', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // "You might also need" - same department, different items
    const recommendations = await Product.find({
      _id: { $ne: product._id },
      department: product.department,
    })
      .populate('sellerId', 'name department')
      .sort({ createdAt: -1 })
      .limit(4);

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products/:id/report
router.post('/:id/report', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { reportCount: 1 }, isReported: true },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Listing reported successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id - seller can delete own listing
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      sellerId: req.user._id,
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
