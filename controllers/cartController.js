const express = require('express');
const router = express.Router();
const Product = require('../models/productsModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Coupon = require('../models/couponsModel');

const loadCart = async (req, res) => {
  try {
    const userData = req.session.userData;
    const username = userData.username;

    if (userData) {
  
      const userId = userData._id;

      let cart = await Cart.findOne({ userId: userId });

      if (!cart) {
        cart = new Cart({ userId: userId, products: [] });
        await cart.save();
      }

      const updatedCart = await Cart.findOne({ userId: userId }).populate(
        'products.productId'
      );

      res.render('./users/cartPage', {
        productData: updatedCart.products,
        userData: userData
      });
    }
  } catch (error) {
    console.error('Error in cartController-loadCart:', error);
    res.status(500).send('Internal Server Error');
  }
};

const addNewProductsToCart = async (req, res) => {
  try {
    const userData = req.session.userData;

    if (userData) {
    
      const userId = userData._id;
      const productId = req.query.productId;
      let qty = parseInt(req.query.qty, 10) || 1;

      qty = Math.max(1, Math.floor(qty));
      // const quantity = req.query.quantity;
      // console.log("Quantity" , quantity)

      const productData = await Product.findById({ _id: productId });

      let cart = await Cart.findOne({ userId: userId });

      if (!cart) {
        cart = new Cart({ userId: userId, products: [] });
      }

      const existingProduct = cart.products.find(
        (product) => product.productId.toString() === productId
      );

      if (existingProduct) {
        existingProduct.quantity += qty;
      } else {
        cart.products.push({ productId, quantity: qty });
      }

      await cart.save();
    }

    return res.status(200).json({
      success : true,
      message :  "Product added to cart successfully"
    })

  } catch (error) {
    console.error('Error in cartController-addNewProductsToCart', error.message);
    res.status(500).json({
      success : false,
      message :  "Internal server error"
    })
  }
};



const updateCartQuantity = async (req, res) => {
  try {
    const userData = req.session.userData;
    const userId = userData._id;
    const productId = req.query.productId;
    const newQuantity = parseInt(req.query.newQuantity);

    console.log("new quantity of cart : ", newQuantity);

    let cart = await Cart.findOne({ userId: userId });

    const productIndex = cart.products.findIndex(
      (product) => product.productId.toString() === productId
    );

    if (productIndex !== -1) {
      cart.products[productIndex].quantity = newQuantity;
      await cart.save();

      const updatedCart = await Cart.findOne({ userId: userId }).populate(
        'products.productId'
      );

      return res.status(200).json({
        message: 'Cart quantity updated successfully using fetch',
        productData: updatedCart.products
      });
    } else {
      return res.status(404).json({
        message: 'Product not found in the cart',
      });
    }
  } catch (error) {
    console.error('Error in cartController-updateCartQuantity:', error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};

const removeProduct = async (req, res) => {
  try {
    const userData = req.session.userData;
    const userId = userData._id;
    const productId = req.query.productId;

    let cart = await Cart.findOne({ userId: userId });
    cart.products = cart.products.filter(product => product.productId.toString() !== productId);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    console.error('Error in cartController-removeProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

 

const clearCart = async (req, res) => {
  try {
    const userData = req.session.userData;
    const userId = userData._id;

    let cart = await Cart.findOne({ userId: userId });
    cart.products = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Error in cartController-clearCart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }

}


const loadCheckoutPage = async (req, res) => {
  try {
    const userData = req.session.userData;
    const userId = userData._id;

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      cart = new Cart({ userId: userId, products: [] });
      await cart.save();
    }

    const updatedCart = await Cart.findOne({ userId: userId }).populate(
      'products.productId'
    );

    const couponsData = await Coupon.find();

    const usersNewData = await User.findById(userId)

    res.render('./users/checkout', { productData: updatedCart.products, username: userData.username, userData: usersNewData, couponsData: couponsData, message: '' })
  } catch (error) {
    console.error('Error in cartController-loadCheckoutPage:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

const checkCouponValididty = async (req, res) => {
  try {
    const userData = req.session.userData;
    const userId = userData._id;
    let cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      cart = new Cart({ userId: userId, products: [] });
      await cart.save();
    }
    const updatedCart = await Cart.findOne({ userId: userId }).populate(
      'products.productId'
    );
    const couponsData = await Coupon.find();

    const enteredCoupon = req.query.enteredCoupon;
    const priceChecking = req.query.priceChecking;

    const couponData = await Coupon.find({ couponCode: enteredCoupon });

    if (couponData.length > 0) {
      let couponCode = couponData[0].couponCode;
      let discountPercentage = couponData[0].discountPercentage;
      let minimumAmount = couponData[0].minimumAmount;
      let isActive = couponData[0].isActive;
      let maximumAmount = couponData[0].maximumAmount;

      const checkingNumberOfTimesUsed = await Coupon.find({ "redemptionHistory.userId": userId }).countDocuments();

      if (couponData[0].maxUsesPerUser <= checkingNumberOfTimesUsed) {
        res.render('./users/checkout', {
          productData: updatedCart.products,
          username: userData.username,
          userData: userData,
          couponsData: couponsData,
          message: "Coupon usage limit exceeded (Already applied earlier)"
        });
        return;
      }

      if (priceChecking < minimumAmount) {
        const additionalAmountNeeded = minimumAmount - priceChecking;
        res.render('./users/checkout', {
          productData: updatedCart.products,
          username: userData.username,
          userData: userData,
          couponsData: couponsData,
          message: `Add more products worth Rs.${additionalAmountNeeded} more to apply coupon`,
        });
        return;
      }

      if (isActive === true) {
        res.render('./users/checkout', {
          productData: updatedCart.products,
          username: userData.username,
          userData: userData,
          couponsData: couponsData,
          couponCode,
          discountPercentage,
          minimumAmount,
          maximumAmount,
          message: "Coupon applied successfully"
        });
      } else {
        res.render('./users/checkout', {
          productData: updatedCart.products,
          username: userData.username,
          userData: userData,
          couponsData: couponsData,
          message: "Coupon expired or invalid"
        });
      }
    } else {
      res.render('./users/checkout', {
        productData: updatedCart.products,
        username: userData.username,
        userData: userData,
        couponsData: couponsData,
        message: "Coupon is not valid"
      });
    }

  } catch (error) {
    console.error('Error in cartController-checkCouponValididty:', error);
  }
}

module.exports = {
  loadCart,
  addNewProductsToCart,
  updateCartQuantity,
  removeProduct,
  loadCheckoutPage,
  checkCouponValididty,
  clearCart

};
