// routes.js
const express = require('express');
const router = express.Router();
const session = require('express-session');
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const additionalPagesController = require('../controllers/additionalPagesController');
const wishlistController = require('../controllers/wishlistController');


// Session handling
router.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

const multerConfig = require('../multerConfig');
const { profileImages } = multerConfig;

// Home
router.get('/', auth.isLogout, userController.loadHome);

// Login
router.get('/login', auth.isLogout, userController.loadLogin);
router.post('/login', auth.isLogout, userController.verifyLogin);

//shop page
router.get('/shop', userController.loadShop)

// Registration
router.get('/register', auth.isLogout, userController.loadRegister);
router.post('/register', auth.isLogout, userController.insertUser);
router.get('/referralAtRegistrarion', auth.isLogout, userController.referralAtRegistration);
router.post('/referralAtRegistrarion', auth.isLogout, userController.postReferralAtRegistration);
router.post('/verifyotp', auth.isLogout, userController.verifyOtp);
router.post('/resendotp', auth.isLogout, userController.resendOtp);

// Forget Password
router.get('/forget', auth.isLogout, userController.forgetLoad);
router.post('/forget', auth.isLogout, userController.forgetVerify);
router.get('/forget-password', auth.isLogout, userController.forgetPasswordLoad);
router.post('/forget-password', auth.isLogout, userController.resetPassword);

// Account
router.get('/accountPage', auth.isLogin, userController.loadAccount);
router.post('/editUserDetails', auth.isLogin, userController.updateloadAccount);
router.post('/addProfileImage', profileImages.single('profileImages'), auth.isLogin, userController.addProfileImage);
router.post('/referralCodeClaim', auth.isLogin, userController.referralCodeClaim);

// Logged-in Home page
router.get('/loginHome', auth.isLogin, userController.loadLoggedinHome);

// Individual Product Page
router.get('/individualProductPage', userController.individualProductPage);

// Logout
router.get('/logout', auth.isLogin, userController.userLogout);

// Cart
router.get('/cart', auth.isLogin, cartController.loadCart);
router.post('/cart', auth.isLogin, cartController.addNewProductsToCart);
router.get('/updateCartQuantity', auth.isLogin, cartController.updateCartQuantity);
router.delete('/removeProduct', auth.isLogin, cartController.removeProduct);
router.post('/clearCart', auth.isLogin, cartController.clearCart);

//wishlist
router.get('/wishlist', auth.isLogin, wishlistController.loadWishlist);
router.post('/wishlist', auth.isLogin, wishlistController.addNewProductsToWishlist);
router.delete('/wishlist/remove', auth.isLogin, wishlistController.removeProductFromWishlist);
router.post('/cart/add', auth.isLogin, wishlistController.addProductToCart);

// checkout
router.get('/loadcheckout', auth.isLogin, cartController.loadCheckoutPage);
router.post('/loadcheckout', auth.isLogin, orderController.orderPlaced);

//coupon
router.get('/checkCouponValididty', auth.isLogin, cartController.checkCouponValididty);

//order
router.get('/displayOrder', auth.isLogin, orderController.displayOrderDetails);
router.get('/cancelOrder', auth.isLogin, orderController.cancelOrder)
router.post('/cancelOrder', auth.isLogin, orderController.cancelOrderProcess)
router.get('/returnOrder', auth.isLogin, orderController.returnOrder)
router.post('/returnOrder', auth.isLogin, orderController.returnOrderProcess)

//rating
router.get('/addRating', auth.isLogin, orderController.loadAddRating);
router.post('/addRating', auth.isLogin, orderController.addRating);

//payments
router.post('/createRazorpayOrder', orderController.createOrder);

//address
router.get('/addAddress', auth.isLogin, userController.addUserAddress);
router.post('/addAddress', auth.isLogin, userController.insertNewUserAddress);
router.get('/editAddress', auth.isLogin, userController.loadEditUserAddress);
router.post('/editAddress', auth.isLogin, userController.updateEditUserAddress);
router.get('/deleteAddress', auth.isLogin, userController.deleteAddress);

// Change password
router.get('/changePassword', auth.isLogin, userController.loadChangePassword);
router.post('/changePassword', auth.isLogin, userController.changePassword);

// additional pages
router.get('/termsPage', additionalPagesController.termsPage)
router.get('/privacyPolicy', additionalPagesController.privacyPolicy)
router.get('/purchaseGuide', additionalPagesController.purchaseGuide)
  router.get('/contactPage', additionalPagesController.contactPage)   
  router.post('/contactPage', additionalPagesController.feedbackData)   
router.get('/aboutPage', additionalPagesController.aboutPage)
router.get('/blogCategoryFullwidth', additionalPagesController.blogCategoryFullwidth)
router.get('/blogPostFullwidth', additionalPagesController.blogPostFullwidth)
router.get('/brands', additionalPagesController.brands)


module.exports = router;
