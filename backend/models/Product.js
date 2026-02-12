const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productDescription: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Couplings', 'Gear pump', 'Torque Limiters'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);

