// productController.js
const Product = require('../models/Product');

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, quantity, rate, commissionPercent } = req.body;
    if (!name || quantity == null || rate == null) {
      return res.status(400).json({ message: 'name, quantity and rate required' });
    }
    const product = new Product({
      name,
      quantity: Number(quantity),
      rate: Number(rate),
      commissionPercent: commissionPercent == null ? 3 : Number(commissionPercent)
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // allow updating commissionPercent as well
    const { name, quantity, rate, commissionPercent } = req.body;
    const update = {};
    if (name != null) update.name = name;
    if (quantity != null) update.quantity = Number(quantity);
    if (rate != null) update.rate = Number(rate);
    if (commissionPercent != null) update.commissionPercent = Number(commissionPercent);

    const product = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
