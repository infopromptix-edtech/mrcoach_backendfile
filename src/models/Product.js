const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String, // e.g. "In Stock", "Out of Stock", "Limited"
    default: 'In Stock'
  },
  deliveryTime: {
    type: String, // e.g. "Free Delivery", "Same Day", "Next Day"
    default: 'Free Delivery'
  },
  location: {
    type: String,
    default: 'Ships from Chennai'
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
