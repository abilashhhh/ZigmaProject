const mongoose = require('mongoose');

const bannersSchema = new mongoose.Schema({
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
  bannerText4: {
    type: String,
  },
  bannerImages: {
    type: String,
    required : true
  },
  bannerExpiryDate :{
    type : Date,
    required : true
  },
  isBannerActive: {
    type: Boolean, 
    default : true
  },
  bannerShape: {
    type: String,
    enum: ["Portrait", "Landscape"],
  },
  bannerDisplayPlace: {
    type : String,
    enum : [ "B1" , "B2" , "B3", "B4" ,"B5"],
    required : true
  }
  
});
module.exports = mongoose.model('Banner', bannersSchema);
