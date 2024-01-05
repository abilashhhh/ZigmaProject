const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  deliveryemail: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
  },
  zipCode: {
    type: String,
    required: true,
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Number,
    default: 0,
  },
  token: {
    type: String,
    default: '',
  },
  isActive: {
    type: Number,
    default: 1,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  couponsUsed: {
    type: String
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  referralCode: {
    type: String
  },
  isReferralRewardClaimed: {
    type: Boolean
  },
  numberOfReferralsDone: {
    type: Number
  },
  profileImages: {
    type: String
  },
  address: [addressSchema]


});

module.exports = mongoose.model('User', userSchema);
