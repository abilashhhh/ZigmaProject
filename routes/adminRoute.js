const express = require('express');
const router = express.Router();
const session = require('express-session');
const adminController = require('../controllers/adminController');
const adminDashboardController = require('../controllers/adminDashboardController');
const categoriesController = require('../controllers/categoriesController');
const productsController = require('../controllers/productsController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const bannerController = require('../controllers/bannerController');

// Middleware
const auth = require('../middleware/adminAuth');

// Session handling
router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
);
 
const multerConfig = require('../multerConfig');
const { upload, productOfferImage, categoryImage, categoryOfferImages, bannerImages } = multerConfig;

// Login page
router.get('/', auth.isLogout, adminController.adminLoginLoad);
router.post('/', auth.isLogout, adminController.adminVerifyLogin);

// Admin home page
router.get('/adminHome', auth.isLogin, adminDashboardController.adminHomeLoad);
router.get('/fetchMonthlyData', auth.isLogin, adminDashboardController.fetchMonthlyData);
router.get('/fetchWeeklyData', auth.isLogin, adminDashboardController.fetchWeeklyData);
router.get('/productSoldData', auth.isLogin, adminDashboardController.productDataChartDetails);
router.get('/salesReport', auth.isLogin, adminDashboardController.loadSalesReport);
router.post('/salesReport', auth.isLogin, adminDashboardController.salesReportData);

// Userlist
router.get('/userslist', auth.isLogin, adminController.displayUsersList);
router.get('/blockUser', auth.isLogin, adminController.blockUser);
router.get('/unblockUser', auth.isLogin, adminController.unblockUser);

// Categories
router.get('/categories', auth.isLogin, categoriesController.loadCategories);
router.get('/addCategories', auth.isLogin, categoriesController.addCategories);
router.post('/addCategories', categoryImage.single('categoryImage'), auth.isLogin, categoriesController.addCategories);
router.get('/blockCategories', auth.isLogin, categoriesController.blockCategories);
router.get('/unblockCategories', auth.isLogin, categoriesController.unblockCategories);
router.get('/editCategories', auth.isLogin, categoriesController.editCategories);
router.post('/editCategories', categoryImage.single('categoryImage'), auth.isLogin, categoriesController.displayUpdatedCategories);

// categories offer
router.get('/categoryOffers', auth.isLogin, categoriesController.categoryOffersLoad);
router.get('/editCategoryOffers', auth.isLogin, categoriesController.editCategoryOffersLoad);
router.post('/editCategoryOffers', categoryOfferImages.single('categoryOfferImages'), auth.isLogin, categoriesController.categoryOffersPost);
router.get('/blockCategoriesOffers', auth.isLogin, categoriesController.blockCategoriesOffers);
router.get('/unblockCategoriesOffers', auth.isLogin, categoriesController.unblockCategoriesOffers);

// Products
router.get('/addProducts', auth.isLogin, productsController.loadAddProductsPage);
router.post('/addProducts', auth.isLogin, upload.array('image', 15), productsController.addProducts);
router.get('/productList', auth.isLogin, productsController.loadProductsListPage);
router.get('/blockProducts', auth.isLogin, productsController.blockProducts);
router.get('/unblockProducts', auth.isLogin, productsController.unblockProducts);

//products offers
router.get('/productsOffers', auth.isLogin, productsController.loadProductOffersPage);
router.get('/productOfferIndividualPage', auth.isLogin, productsController.loadProductOffersIndividualPage);
router.post('/productOfferIndividualPage', productOfferImage.single('productOfferImage'), auth.isLogin, productsController.PostProductOffersIndividualPage);
router.get('/blockProductOffers', auth.isLogin, productsController.blockProductsOffers);
router.get('/unblockProductOffers', auth.isLogin, productsController.unblockProductsOffers);

// Edit products
router.get('/editProductPage', auth.isLogin, productsController.editProductPageLoad);
router.post('/editProductPage', auth.isLogin, upload.array('image', 15), productsController.displayUpdatedProducts);

// Logout
router.get('/logout', auth.isLogin, adminController.adminLogout);

//orders
router.get('/orderListAdmin', auth.isLogin, orderController.adminOrdersList);
router.get('/changeStatus', auth.isLogin, orderController.changeOrderStatus);
router.get('/individualOrdersPage', auth.isLogin, orderController.individualOrdersPage);
router.get('/cancelOrderAdmin', auth.isLogin, orderController.loadCancelOrderProcessAdmin);
router.post('/cancelOrderAdmin', auth.isLogin, orderController.cancelOrderProcessAdmin);

//coupons
router.get('/addCoupons', auth.isLogin, couponController.loadCouponPage);
router.post('/addCoupons', auth.isLogin, couponController.createCoupon);
router.get('/editCoupons', auth.isLogin, couponController.editCouponPageLoad);
router.post('/editCoupons', auth.isLogin, couponController.updateCoupons);

//transactions
router.get('/transactions', auth.isLogin, adminController.transactionsLoad);

//reviews
router.get('/reviews', auth.isLogin, adminController.reviewsLoad);

//settings
router.get('/settings', auth.isLogin, adminController.loadAdminSettings);
router.post('/settings', auth.isLogin, adminController.adminSettings);

//banner 
router.get('/bannerManagement', auth.isLogin, bannerController.getBannerManagement);
router.get('/createBanners', auth.isLogin, bannerController.createBanners);
router.post('/createBanners',bannerImages.single('bannerImages'), auth.isLogin, bannerController.createBannersPost);
router.get('/blockBanner', auth.isLogin, bannerController.blockBanner);
router.get('/unblockBanner', auth.isLogin, bannerController.unblockBanner);
router.get('/deleteBanner', auth.isLogin, bannerController.deleteBanner);

 
module.exports = router;
