const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true
  },
  quantityRequested: {
    type: Number,
    required: true,
    min: 1
  },
  requesterEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  requesterNumber: {
    type: String,
    required: false,
    trim: true
  },
  assignedEmployee: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  quotation: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: null
  },
  comments: {
    type: [{
      comment: {
        type: String,
        required: true,
        trim: true
      },
      authorType: {
        type: String,
        enum: ['admin', 'employee'],
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);

