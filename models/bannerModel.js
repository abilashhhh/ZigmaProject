const mongoose = require('mongoose');

const bannersSchema = new mongoose.Schema({
   bannerName: {
    type: String,
    required: true
  },
   bannerText1: {
    type: String,
    required: true
  },
  bannerText2: {
    type: String,
  },
  bannerText3: {
    type: String,
  },
  bannerImages: {
    type: String,
    required : true
  },
  bannerExpiryDate :{
    type : Date
  },
  isBannerActive: {
    type: Boolean, 
    default : true
  },
  bannerShape: {
    type: String,
    enum: ["Portrait", "Landscape"],
    required : true
  }
  
});
module.exports = mongoose.model('Banner', bannersSchema);
