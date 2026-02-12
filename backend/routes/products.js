const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/products', async (req, res) => {
  try {
    console.log('GET /api/products endpoint called');
    const products = await Product.find().sort({ createdAt: -1 });
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Create new product
router.post('/products', async (req, res) => {
  try {
    const { productName, productDescription, price, category } = req.body;

    // Validate input
    if (!productName || !productDescription || price === undefined || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    // Create product
    const product = new Product({
      productName: productName.trim(),
      productDescription: productDescription.trim(),
      price: parseFloat(price),
      category: category.trim()
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { productName, productDescription, price, category } = req.body;
    const productId = req.params.id;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update fields if provided
    if (productName !== undefined) {
      product.productName = productName.trim();
    }
    if (productDescription !== undefined) {
      product.productDescription = productDescription.trim();
    }
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: 'Price must be a positive number' });
      }
      product.price = parseFloat(price);
    }
    if (category !== undefined) {
      product.category = category.trim();
    }

    await product.save();

    res.json({
      message: 'Product updated successfully',
      product: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

module.exports = router;

