const express = require('express');
const router = express.Router();
const Product = require('../models/productsModel');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
 
// wishlist --------------------------------------------------------------------------------------------------

const loadWishlist = async (req, res) => {
    try {
      const userData = req.session.userData;
      const username = userData.username
  
      if (userData) {
        const userId = userData._id;
  
        // Check if the user has a wihslist
        let wishlist = await Wishlist.findOne({ userId: userId });
  
        if (!wishlist) {
          wishlist = new Wishlist({ userId: userId, products: [] });
          await wishlist.save();
        }
  
        // Fetch the updated cart to get the latest quantities
        const updatedWishlist = await Wishlist.findOne({ userId: userId }).populate(
          'products.productId'
        );
  
        res.render('./users/wishlist', {
          productData: updatedWishlist.products, userData: userData
        });
      }
    } catch (error) {
      console.error('Error in wishlistController-loadWishlist:', error);
      res.status(500).send('Error in wishlistController-loadWishlist:', error);
    }
  };
  

 
const addNewProductsToWishlist = async (req, res) => {
  try {
    const userData = req.session.userData;

    if (userData) {
   
      const userId = userData._id;
      const productId = req.query.productId;
    
      // console.log("addNewProductsToWishlist- productId :  ", productId)

      const productData = await Product.findById({ _id: productId });
      // console.log("productData: ",productData)

      let wishlist = await Wishlist.findOne({ userId: userId });

      if (!wishlist) {
        wishlist = new Wishlist({ userId: userId, products: [] });
      }

      const existingProduct = wishlist.products.find(
        (product) => product.productId.toString() === productId
      );

      if (existingProduct) {
       
      } else {
        wishlist.products.push({ productId });
      }

      
      await wishlist.save();

      return res.status(200).json({
        success : true,
        message :  "Product added to wishlist successfully"
      })
    }
  } catch (error) {
    console.error('Error in cartController-addNewProductsToCart', error.message);
    res.status(500).send('Internal Server Error');
}
  }
 

 
 

const removeProductFromWishlist = async (req, res) => {
  try {
    const userData = req.session.userData;
    const userId = userData._id;
    const productId = req.query.productId;

    let wishlist = await Wishlist.findOne({ userId: userId });
    wishlist.products = wishlist.products.filter(product => product.productId.toString() !== productId);
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    console.error('Error in wishlistController-removeProductFromWishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};


const addProductToCart = async (req, res) => {
  try {
      const userData = req.session.userData;

      if (userData) {
          const userId = userData._id;
          const productId = req.query.productId;

          const productData = await Product.findById({ _id: productId });

          let cart = await Cart.findOne({ userId: userId });

          if (!cart) {
              cart = new Cart({ userId: userId, products: [] });
          }

          const existingProduct = cart.products.find(
              (product) => product.productId.toString() === productId
          );

          if (existingProduct) {
           } else {
              cart.products.push({ productId });
          }

          await cart.save();

          return res.status(200).json({
              success: true,
              message: 'Product added to cart successfully',
          });
      }
  } catch (error) {
      console.error('Error in cartController-addProductToCart', error.message);
      res.status(500).json({
          success: false,
          message: 'Internal Server Error',
      });
  }
};


 


  module.exports = {
    loadWishlist,
    addNewProductsToWishlist,
    removeProductFromWishlist,
    addProductToCart
    
  }