// multerConfig.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'productImages'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const productOfferImage = multer({ dest: 'productImages/productOfferImage' });
const categoryImage = multer({ dest: 'categoryImages/' });
const categoryOfferImages = multer({ dest: 'categoryImages/categoryOfferImages' });
const bannerImages = multer({ dest: 'bannerImages/' });
const profileImages = multer({ dest: 'profileImages/' });

module.exports = {
  upload,
  productOfferImage,
  categoryImage,
  categoryOfferImages,
  bannerImages,
  profileImages
};
