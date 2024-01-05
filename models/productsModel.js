  const mongoose = require('mongoose');

  const productsSchema = new mongoose.Schema({
    productName: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    shape: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    submodel: {
      type: String,
      required: true
    },
    regularPrice: {
      type: Number,
      required: true
    },
    salesPrice: {
      type: Number,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    
    image: [{
      type: String
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    tags: {
      type: String
    },
    displayInHomePage: {
      type: String,
      default: 'Yes'
    },
    productOfferPercentage: {
      type: Number
    },
    isProductOfferActive: {
      type: Boolean
    },
    productOfferExpiryDate: {
      type: Date
    },
    productOfferImage: {
      type: String
    }

  });

  module.exports = mongoose.model('Product', productsSchema);
