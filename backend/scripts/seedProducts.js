const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@evolutionapi.ipbubyl.mongodb.net/Protorq?appName=EvolutionAPI';

const seedProducts = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB - Protorq database');

    // Clear existing products (optional - remove if you want to keep existing products)
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Create products - 2 entries for each category
    const products = [
      // Couplings
      {
        productName: 'Flexible Coupling Type A',
        productDescription: 'High-quality flexible coupling designed for industrial applications. Provides excellent torque transmission and vibration damping.',
        price: 1250.00,
        category: 'Couplings'
      },
      {
        productName: 'Rigid Coupling Type B',
        productDescription: 'Durable rigid coupling for precise shaft alignment. Made from premium steel with corrosion-resistant coating.',
        price: 890.50,
        category: 'Couplings'
      },
      // Gear pump
      {
        productName: 'External Gear Pump Model X1',
        productDescription: 'Efficient external gear pump with high flow rate. Suitable for hydraulic systems and fluid transfer applications.',
        price: 2450.00,
        category: 'Gear pump'
      },
      {
        productName: 'Internal Gear Pump Model Y2',
        productDescription: 'Compact internal gear pump with low noise operation. Ideal for precision fluid handling and metering applications.',
        price: 1890.75,
        category: 'Gear pump'
      },
      // Torque Limiters
      {
        productName: 'Mechanical Torque Limiter TL-100',
        productDescription: 'Reliable mechanical torque limiter with adjustable torque setting. Protects machinery from overload conditions.',
        price: 1650.00,
        category: 'Torque Limiters'
      },
      {
        productName: 'Electronic Torque Limiter TL-200',
        productDescription: 'Advanced electronic torque limiter with digital display and programmable settings. Features real-time monitoring capabilities.',
        price: 3200.50,
        category: 'Torque Limiters'
      }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`Created product: ${productData.productName} (${productData.category})`);
    }

    console.log('Seed completed! All products added to Protorq database.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();

