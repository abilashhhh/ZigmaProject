const mongoose = require('mongoose');

const categoriesSchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  categoryImage: {
    type: String
  },
  categoryCountry:{
    type: String,
    required:true
  },
  isActive: {
    type: Boolean, 
    default : true
  },
  categoryOfferPercentage: {
    type:Number
  },
  categoryOfferExpiryDate :{
    type : Date
  },
  categoryOfferImages : {
    type : String
  },
  isCategoryOfferActive: {
    type: Boolean, 
    default : true
  },
});

module.exports = mongoose.model('Category', categoriesSchema);
