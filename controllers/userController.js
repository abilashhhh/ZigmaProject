  const express = require('express');
  const router = express.Router();
  const User = require('../models/userModel');
  const nodemailer = require("nodemailer");
  const sharp = require("sharp");
  const fs = require("fs");
  const randomstring = require("randomstring")
  const Products = require('../models/productsModel');
  const Category = require('../models/categoriesModel');
  const Order = require('../models/orderModel');
  const Carts = require('../models/cartModel');
  const Banner = require('../models/bannerModel');
  const Rating = require('../models/ratingModel');

  const bcrypt = require('bcrypt')
  require('dotenv').config();

 
  const securePassword = async (password) => {
    try {
      //10 is the salt value
      const passwordHash = await bcrypt.hash(password, 10)
      return passwordHash
    } catch (error) {
      console.log("error in userController, securePassword  ", error.message)
    }
  }


  const loadHome = async (req, res, next) => {
    try {

      const wholeProducts = await Products.find();
      // console.log("wholeProducts:", wholeProducts)

      var homePageSearch = req.query.homePageSearch || '';
      var categoryName = req.query.categoryName || '';

      const query = {
        category: categoryName ? { $regex: '.*' + categoryName + '.*', $options: 'i' } : { $exists: true },
        $or: [
          { productName: { $regex: '.*' + homePageSearch + '.*', $options: 'i' } },
        ],
      };

      const categoriesData = await Category.find({});


      // sort queries 
      const sortQuery = req.query.sort;
      let productsData;

      switch (sortQuery) {
        case 'Newest':
          productsData = await Products.find(query).sort({ _id: -1 });
          break;
        case 'InStock':
          productsData = await Products.find({ $and: [query, { quantity: { $gt: 1 } }] });
          break;
        case 'OutOfStock':
          productsData = await Products.find({ $and: [query, { quantity: { $lt: 1 } }] });
          break;
        case 'LowToHigh':
          productsData = await Products.find(query).sort({ salesPrice: 1 });
          break;
        case 'HighToLow':
          productsData = await Products.find(query).sort({ salesPrice: -1 });
          break;
        default:
          productsData = await Products.find(query);
      }

      // range queries 
      const rangeQuery = req.query.range;

      switch (rangeQuery) {
        case '1':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 0, $lte: 500 } }] });
          break;
        case '2':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 500, $lte: 1000 } }] });
          break;
        case '3':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 1000, $lte: 2000 } }] });
          break;
        case '4':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 2000, $lte: 3000 } }] });
          break;
        case '5':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 3000 } }] });
          break;
        default:
          break;
      }

      const categoriesOffersData = await Category.find({ isCategoryOfferActive: true });
      const productsOffersData = await Products.find({ isProductOfferActive: true });
      const b1Portrait = await Banner.find({ isBannerActive: true , bannerDisplayPlace: 'B1' , bannerShape : "Portrait"});
      const b1Landscape = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B1' ,  bannerShape : "Landscape"});
      const b2 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B2' });
      const b3 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B3' });
      const b4 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B4' });
      const b5 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B5' });
    
      res.render('./users/home', 
      { productsData,
         categoriesData, 
         categoriesOffersData, 
         productsOffersData,
         b1Portrait ,
         b1Landscape ,
         b5,
         b4,
         b3,
         b2
        });

    } catch (error) {
      console.error("Error in userController-loadHome", error.message);
    }
  };



  const loadLoggedinHome = async (req, res) => {
    try {
      const userData = req.session.userData
      let username = userData.username

      // const productsData = await Products.find({});
      const categoriesData = await Category.find({});
      const cartData = await Carts.find({ userId: userData._id });
      let numberOfProductsInCart = 0;

      const firstCart = cartData[0];
      if (firstCart) {
        numberOfProductsInCart = firstCart.products.length;
      }

      req.session.numberOfProductsInCart = numberOfProductsInCart

      //search
      var loggedInHomePageSearch = req.query.loggedInHomePageSearch || '';
      var loggedInCategoryName = req.query.loggedInCategoryName || '';

      const query = {
        category: loggedInCategoryName ? { $regex: '.*' + loggedInCategoryName + '.*', $options: 'i' } : { $exists: true },
        $or: [
          { productName: { $regex: '.*' + loggedInHomePageSearch + '.*', $options: 'i' } },
        ],
      };


      // sort queries 
      const sortQuery = req.query.sort
      // console.log("sort query:", sortQuery)

      // range queries 
      const rangeQuery = req.query.range
      // console.log("rangeQuery:", rangeQuery)


      let productsData;
      switch (sortQuery) {
        case 'Newest':
          productsData = await Products.find(query).sort({ _id: -1 });
          break;
        case 'InStock':
          productsData = await Products.find({ $and: [query, { quantity: { $gt: 1 } }] });
          break;
        case 'OutOfStock':
          productsData = await Products.find({ $and: [query, { quantity: { $lt: 1 } }] });
          break;
        case 'LowToHigh':
          productsData = await Products.find(query).sort({ salesPrice: 1 });
          break;
        case 'HighToLow':
          productsData = await Products.find(query).sort({ salesPrice: -1 });
          break;
        default:
          productsData = await Products.find(query);
      }

      switch (rangeQuery) {
        case '1':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 0, $lte: 500 } }] });
          break;
        case '2':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 500, $lte: 1000 } }] });
          break;
        case '3':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 1000, $lte: 2000 } }] });
          break;
        case '4':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 2000, $lte: 3000 } }] });
          break;
        case '5':
          productsData = await Products.find({ $and: [query, { salesPrice: { $gte: 3000 } }] });
          break;
        default:
          break;
      }
      const categoriesOffersData = await Category.find({ isCategoryOfferActive: true });
      const productsOffersData = await Products.find({ isProductOfferActive: true });
      // console.log("productsOffersData:" , productsOffersData.productName)
 
      const b1Portrait = await Banner.find({ isBannerActive: true , bannerDisplayPlace: 'B1' , bannerShape : "Portrait"});
      const b1Landscape = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B1' ,  bannerShape : "Landscape"});
      const b2 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B2' });
      const b3 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B3' });
      const b4 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B4' });
      const b5 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B5' });

      res.render('./users/loginHome', {
        username: username,
        userData: userData,
        productsData: productsData,
        categoriesData: categoriesData,
        numberOfProductsInCart: numberOfProductsInCart,
        categoriesOffersData,
        productsOffersData,
        b1Landscape,
        b1Portrait,
        userData,
        b2,b3,b4,b5
      });



    } catch (error) {
      console.log("Error in userController-loadLoggedinHome", error.message);
    }
  };

  const loadRegister = async (req, res) => {
    try {
      const userData = req.session.userData
      res.render('./users/registration' , {userData});
    } catch (error) {
      console.log("Error in userController-loadRegister", error.message);
    }
  };

  const maxResendAttempts = 3;

  const insertUser = async (req, res) => {
    try {


      const username = req.body.username
      const email = req.body.email
      const mobile = req.body.mobile
      const password = req.body.password
      const confirmPassword = req.body.confirmPassword
      const referralCode = await generateReferralCode(6);
 
      if (req.session.referralEnteredAtSignUp) {
        wallet = 100;   
        isReferralRewardClaimed = true
      }else{
        wallet = 0
        isReferralRewardClaimed = false
      }
      
   
      if (password === confirmPassword) {
        const password = await securePassword(req.body.password)

        const user = new User({
          username,
          email,
          mobile,
          password,
          confirmPassword,
          referralCode,
          wallet,
          isReferralRewardClaimed

       
        });

        const mailExisting = await User.findOne({ email: user.email });
        const usernames = await User.findOne({ username: user.username });

        if (usernames && user.username === usernames.username) {
          const userData = req.session.userData
          return res.render('./users/registration', { message: "Username already exists in the system, Try logging in or create new account with a different username" , userData});
        }
        else if (mailExisting && user.email === mailExisting.email) {
          const userData = req.session.userData
          return res.render('./users/registration', { message: "An account already exists with this email id, Try logging in" , userData});
        } else {
          const generatedOtp = generateOtp();
          req.session.user = {
            ...user.toObject(),
            otp: generatedOtp,
            otpTimestamp: Date.now(),
            resendAttempts: 0,
          };

          console.log("Otp for user verification:", generatedOtp);

          mailTransporter(email, generatedOtp);
          res.render('./users/verifyotp', {
            message: {
              type: 'success',
              title: ' OTP Sent',
              text: `Hello ${username}, Please enter the OTP sent to  ${email} within 60 seconds`
            },
            time: new Date(new Date().getTime() + 60000).toLocaleString()
          });
          
        }
      }
    } catch (error) {
      console.log("Error in insertUser: " + error.message);
      const userData = req.session.userData
      res.render('./users/registration', { message: "An error occurred. Please try again." , userData});
    }
  };


  const verifyOtp = async (req, res) => {
    try {
      const enteredOtp = req.body.verifyotp;
      const user = req.session.user;

      const isOtpValid = enteredOtp === user.otp.toString();
      const isExpired = isOtpExpired(user.otpTimestamp);

      if (isOtpValid && !isExpired) {
        await User.create(user);
        console.log("User successfully created:", user);
        res.render('./users/verifyotp', { message: { type: 'success', title: 'User registered', text: 'Your registration is successful, Please login now' }, time: new Date(Date.now()).toLocaleString() });
      } else {

        if (isExpired) {
          return res.render('./users/verifyotp', { message: { type: 'error', title: 'OTP Expired', text: 'Please regenerate OTP and try again.' } , time: new Date(Date.now()).toLocaleString() });
        }
        res.render('./users/verifyotp', { message: { type: 'error', title: 'Invalid OTP', text: 'The otp you entered is incorrect, Please try again.' }, time: new Date(Date.now()).toLocaleString() });
      }
    } catch (error) {
      console.log("Error in verifyOtp: " + error.message);
      res.render('./users/verifyotp', { message: { type: 'error', title: 'An error occurred', text: ' Please try again later' }, time: new Date(Date.now()).toLocaleString() });
    }
  };

  const mailTransporter = (email, otp) => {
    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });

    let details = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: " OTP for registration",
      text: `Hello, Your OTP for registration is:"${otp}",
          This otp is only valid for 60 seconds Please verify before the time expires`
    };

    mailTransporter.sendMail(details, (err) => {
      if (err) {
        console.log("Error in sending mail", err);
      } else {
        console.log(`OTP sent to  ${email} for verification`);
      }
    });
  };

  const resendOtp = async (req, res) => {
    try {
      if (req.session.user.resendAttempts < maxResendAttempts) {
        const email = req.session.user.email;
        const generatedOtp = generateOtp();
        req.session.user.otp = generatedOtp;
        req.session.user.otpTimestamp = Date.now();
        req.session.user.resendAttempts++;

        console.log("New otp :", generatedOtp);

        mailTransporter(email, generatedOtp);
        res.render('./users/verifyotp', { message: { type: 'info', title: 'OTP sent', text: 'Please enter the new OTP sent to your mail id.' },   time: new Date(new Date().getTime() + 60000).toLocaleString() });

      } else {
        res.render('./users/verifyotp', { message: { type: 'error', title: 'Resent attempts exceeded', text: 'Please complete registration and try again' }, time: new Date(Date.now()).toLocaleString() });

      }
    } catch (error) {
      console.log("Error in resendOtp: " + error.message);
      res.render('./users/verifyotp', { message: { type: 'error', title: 'Error', text: 'Please try again later' } , time: new Date(Date.now()).toLocaleString()});
    }
  };

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  const isOtpExpired = (timestamp) => {
    const now = Date.now();
    const otpExpirationTime = timestamp + 65 * 1000; // OTP is valid for 60 seconds
    return now > otpExpirationTime;
  };

  const loadLogin = async (req, res) => {
    try {
      const userData = req.session.userData;
      res.render('./users/loginpage', {userData});
    } catch (error) {
      console.log("Error in userController-loadLogin", error.message);
    }
  };

  const verifyLogin = async (req, res) => {
    try {
      const data = req.body.data;
      const password = req.body.password;
      const userData2 = req.session.userData;

      const userData = await User.findOne({ username: data });
      req.session.userData = userData;

      if (!userData) {
        const productsData = await Products.find({});
        const categoriesData = await Category.find({})
        res.render('./users/loginpage', { message: { type: 'error', title: 'Login Failed', text: 'Check your username and password and try again' }, productsData: productsData, categoriesData: categoriesData , userData:userData2});
      }

      if (userData.isAdmin === 1) {
        const productsData = await Products.find({});
        const categoriesData = await Category.find({})
        return res.render('./users/loginpage', { message: { type: 'error', title: 'Login Failed', text: 'Admins should login using the admin page' }, productsData: productsData, categoriesData: categoriesData ,userData: userData2});
      }

      if (userData.isActive === 0) {
        const productsData = await Products.find({});
        const categoriesData = await Category.find({})
        
        return res.render('./users/loginpage', { message: { type: 'error', title: 'Login Failed', text: 'You are blocked by the admin, Cant login' }, productsData: productsData, categoriesData: categoriesData ,userData :userData2});
      }

      const passwordMatch = await bcrypt.compare(password, userData.password)

      if (passwordMatch) {
        req.session.user_id = userData._id;
        const productsData = await Products.find({});
        const categoriesData = await Category.find({})
        const cartData = await Carts.find({ userId: userData._id });
        let numberOfProductsInCart = 0;

        const firstCart = cartData[0];
        if (firstCart) {
          numberOfProductsInCart = firstCart.products.length;
        }
        const categoriesOffersData = await Category.find({ isCategoryOfferActive: true });
        const productsOffersData = await Products.find({ isProductOfferActive: true });
        const b1Portrait = await Banner.find({ isBannerActive: true , bannerDisplayPlace: 'B1' , bannerShape : "Portrait"});
        const b1Landscape = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B1' ,  bannerShape : "Landscape"});
        const b2 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B2' });
        const b3 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B3' });
        const b4 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B4' });
        const b5 = await Banner.find({ isBannerActive: true ,bannerDisplayPlace: 'B5' });
      
        res.render('./users/loginHome', {
          message: { type: 'success', title: 'Welcome', text: 'Logged in successfully..' },
          username: userData.username,
          userData:userData,
          productsData: productsData,
          categoriesData: categoriesData,
          numberOfProductsInCart: numberOfProductsInCart,
          categoriesOffersData,
          productsOffersData,
          b1Portrait,
          b1Landscape,
          userData,
          b2,
          b3,
          b4,
          b5

        });

      } else {
        const productsData = await Products.find({});
        const categoriesData = await Category.find({})
const userData = req.session.userData
        res.render('./users/loginpage', { message: { type: 'error', title: 'Login Failed', text: 'Check your user name and password and try again' }, productsData: productsData, categoriesData: categoriesData , userData});
      }
    } catch (error) {
      console.log("verifyLogin - users: " + error.message);
    }
  }

  const forgetLoad = async (req, res) => {
    try {
      res.render('./users/forget')
    } catch (error) {
      console.log("Error in userController - forgetLoad : ", error.message)
    }
  }

  const forgetVerify = async (req, res) => {
    try {
      const email = req.body.email;
      const userData = await User.findOne({ email: email });

      if (userData) {
        const randomString = randomstring.generate();

        const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } });

        resetMailTransporter(userData.name, userData.email, randomString);

        res.render('./users/forget', { message: { type: 'success', title: 'Reset link sent', text: 'Password reset link is sent to the registered mail id' } });

      } else {

        res.render('./users/forget', { message: { type: 'error', title: 'User not found', text: 'The email id is not registered . Please try again' } });
      }

    } catch (error) {
      console.log(" Error in userController-forgetVerify : ", error.message)
    }
  }

  const resetMailTransporter = (name, email, token) => {
    let resetMailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });

    let details = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Reset Password",
      html: `<p>Hallo ${name}, Click here to 
            <a href="http://127.0.0.1:4000/forget-password?token=${token}"> reset </a> your password.
            </p>`
    };

    resetMailTransporter.sendMail(details, (err) => {
      if (err) {
        console.log("Error in sending mail", err);
      } else {
        console.log(`Reset password link sent to  ${email}`);
      }
    });
  };

  const forgetPasswordLoad = async (req, res) => {
    try {
      const userData = req.session.userData
      const token = req.query.token
      const tokenData = await User.findOne({ token: token })

      if (token) {
        res.render('./users/forget-password', { user_id: tokenData._id ,userData});

      } else {
        res.render('./users/404', { message: "Token is invalid" ,userData})
      }

    } catch (error) {
      console.log("Error in userController-forgetPasswordLoad: ", error.message)
    }
  }

  const resetPassword = async (req, res) => {
    try {

      const password = await securePassword(req.body.password)
      const user_id = req.body.user_id;
const userData = req.session.userData
      const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: password, token: '' } });
      console.log("Password updated: ", updatedData)
      const productsData = await Products.find({});
      const categoriesData = await Category.find({})
      res.render('./users/loginpage', { message: { type: 'success', title: 'Password Updated', text: 'Your password have been updated, You can login now with the new password' }, productsData: productsData, categoriesData: categoriesData ,userData});
    } catch (error) {
      console.log("error in userController-resetPasswordP: ", error.message)
    }
  }


  const loadShop = async (req, res) => {
    try {
      const username = req.session && req.session.userData ? req.session.userData.username : false;
      const userData = req.session.userData;
      const categoryName = req.query.categoryName;
      // Cart quantity
      const cartData = await Carts.find({ userId: userData._id });
      let numberOfProductsInCart = 0;
      const firstCart = cartData[0];
      if (firstCart) {
        numberOfProductsInCart = firstCart.products.length;
      }

      const splProductsData = await Products.find()

      let sort = req.query.sort
      let productsData;
      if (categoryName === 'All Brands') {

        switch (sort) {
          case 'Newest':
            productsData = await Products.find().sort({ _id: -1 });
            break;
          case 'InStock':
            productsData = await Products.find({ quantity: { $gt: 0 } });
            break;
          case 'OutOfStock':
            productsData = await Products.find({ quantity: { $lt: 1 } });
            break;
          case 'LowToHigh':
            productsData = await Products.find().sort({ salesPrice: 1 });
            break;
          case 'HighToLow':
            productsData = await Products.find().sort({ salesPrice: -1 });
            break;
          default:
            productsData = await Products.find();
            break;
        }



      } else {
        switch (sort) {
          case 'Newest':
            productsData = await Products.find({ category: categoryName }).sort({ _id: -1 });
            break;
          case 'InStock':
            productsData = await Products.find({ $and: [{ category: categoryName }, { quantity: { $gt: 0 } }] });
            break;
          case 'OutOfStock':
            productsData = await Products.find({ $and: [{ category: categoryName }, { quantity: { $lt: 1 } }] });
            break;
          case 'LowToHigh':
            productsData = await Products.find({ category: categoryName }).sort({ salesPrice: 1 });
            break;
          case 'HighToLow':
            productsData = await Products.find({ category: categoryName }).sort({ salesPrice: -1 });
            break;
          default:
            productsData = await Products.find({ category: categoryName });
            break;
        }
      }

      const AllcategoriesData = await Category.find();
      const productsOffersData = await Products.find({ isProductOfferActive: true });
      res.render('./users/shopHome', {
        productsData,
        AllcategoriesData,
        userData,
        splProductsData,
        numberOfProductsInCart,
        productsOffersData
      });
    } catch (error) {
      console.log("Error in userController-loadShop", error.message);
      res.status(500).send("Internal Server Error");
    }
  };




  const individualProductPage = async (req, res) => {
    try {
      const productid = req.query._id
      const userData = req.session.userData;
      const categoriesData = await Category.find({})
      // let username = userData ? userData.username : undefined;
      const productsData = await Products.find({ _id: productid });
      // console.log("productid of individual product : ",productid)

      const productRatings = await Rating.find({ 'product.productId': productid })
      .populate('userId', 'username profileImages'); 
      
         // console.log("productRatings : ",productRatings)
      
      const categoryName = productsData[0].category;
      const relatedProducts = await Products.find({ category: categoryName });
      
        // console.log("productsData : ",productsData)
        // console.log("categoryName : ",categoryName)
        // console.log("relatedProducts : ",relatedProducts)
   
 

  res.render('./users/individualProductPage', {
      userData ,
      productsData,
      categoriesData,
      productRatings,
      relatedProducts  
  });
    } catch (error) {
      console.log("Error in userController-individualProductPage", error.message);
    }
  }

  const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.status(200).send({ message: 'Logged out successfully' });
    } catch (error) {
        console.log("error in usercontroller-logout", error.message);
        res.status(500).send({ message: 'Error logging out' });
    }
};

  const loadChangePassword = async (req, res) => {
    try {

      res.render('./users/changePassword', { message: "  " });
    } catch (error) {
      console.log("Error in usercontroller-loadChangePassword", error.message);
    }
  };


  const changePassword = async (req, res) => {
    try {
      const oldpassword = req.body.oldpassword;
      const newpassword = req.body.newpassword;
      const confirmpassword = req.body.confirmpassword;
      const username = req.query.username;
      const userData = await User.findOne({ username: username });


      if (!userData) {
        return res.render('./users/changePassword', { message: "User not found." });
      }
      const oldPasswordMatch = await bcrypt.compare(oldpassword, userData.password);

      if (!oldPasswordMatch) {
        return res.render('./users/changePassword', { message: "Old password is incorrect, try again" });
      }
      const newPasswordHash = await securePassword(newpassword);
      const updatedpass = await User.findOneAndUpdate({ username: username }, { $set: { password: newPasswordHash } });

      res.render('./users/changePassword', { message: "Password changed successfully." });
    } catch (error) {
      console.log("Error in usercontroller-changePassword", error.message);
      res.render('./users/changePassword', { message: "An error occurred. Please try again." });
    }
  };

  const loadAccount = async (req, res) => {
    try {
      const userData = req.session.userData;
      
      let username = userData.username
      const categoriesData = await Category.find({})
      const productsData = await Products.find({});
      // const ordersData = await Order.findById( userData._id);
      const ordersData = await Order.find({ userId: userData._id });

      // console.log("userdata : ", userData)

      res.render('./users/account', { username: username,  productsData: productsData, categoriesData: categoriesData, message: "", userData: userData, ordersData: ordersData });
    } catch (error) {
      console.log("Error in userController-loadAccount", error.message);
    }
  };

  const updateloadAccount = async (req, res) => {
    try {
      const userid = req.session.userData._id;
      let userData = req.session.userData;
      const username = userData.username;

      const categoriesData = await Category.find({});
      const productsData = await Products.find({});
      const ordersData = await Order.find({ userId: userData._id });

      const mobileUpdate = req.body.mobileUpdate;
      const emailUpdate = req.body.emailUpdate;
      const usernameUpdate = req.body.usernameUpdate;

      const existingMobileUser = await User.findOne({ mobile: mobileUpdate, _id: { $ne: userid } });
      if (existingMobileUser) {
        return res.render('./users/account', { username, userData, productsData, categoriesData, message: "Mobile number already in use, Cannot be changed", ordersData });
      }

      const existingEmailUser = await User.findOne({ email: emailUpdate, _id: { $ne: userid } });
      if (existingEmailUser) {
        return res.render('./users/account', { username, userData, productsData, categoriesData, message: "Email already in use, try a different email", ordersData });
      }

      const existingUsernameUser = await User.findOne({ username: usernameUpdate, _id: { $ne: userid } });
      if (existingUsernameUser) {
        return res.render('./users/account', { username, userData, productsData, categoriesData, message: "Username already in use, try another username", ordersData });
      }

      const updatedUser = await User.findByIdAndUpdate(
        { _id: userid },
        { $set: { username: usernameUpdate, mobile: mobileUpdate, email: emailUpdate } },
        { new: true }
      );

      // Update session data
      req.session.userData = updatedUser;

      return res.render('./users/account', { username, userData: updatedUser, productsData, categoriesData, message: "Details updated successfully", ordersData });
    } catch (error) {
      console.log("Error in userController-updateloadAccount", error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  const addUserAddress = async (req, res) => {
    try {
      const userData = req.session.userData
      res.render('./users/addAddress' , { userData})
    } catch (error) {
      console.error('Error in usercontroller-addUserAddress:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  const insertNewUserAddress = async (req, res) => {
    try {
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;
      const deliveryemail = req.body.deliveryemail;
      const phone = req.body.phone;
      const street = req.body.street;
      const addressLine2 = req.body.addressLine2;
      const city = req.body.city;
      const state = req.body.state;
      const country = req.body.country;
      const zipCode = req.body.zipCode;

      const userData = req.session.userData;

      const newAddress = {
        firstName,
        lastName,
        deliveryemail,
        phone,
        street,
        addressLine2,
        city,
        state,
        country,
        zipCode,
      };

      const userD = await User.findByIdAndUpdate(userData._id, {
        $push: { address: newAddress },
      }, { new: true });
      const ordersData = await Order.find({ userId: userData._id });
      res.render('./users/account', { message: "Address added successfully", username: userData.username, userData: userD, ordersData: ordersData });
    } catch (error) {
      console.error('Error in usercontroller-insertNewUserAddress:', error);
      res.status(500).send('Internal Server Error');
    }
  };


  const loadEditUserAddress = async (req, res) => {
    try {
      const addressid = req.query.addressid;
      const userData = req.session.userData;
      const addressData = await User.findById(
        userData._id,
        { 'address.$': 1 },
        { new: true }
      ).elemMatch('address', { _id: addressid });

      res.render('./users/editAddress', { userData: userData, addressData: addressData });
    } catch (error) {
      console.error('Error in usercontroller-loadEditUserAddress:', error);
      res.status(500).send('Internal Server Error');
    }
  };


  const updateEditUserAddress = async (req, res) => {
    try {
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;
      const deliveryemail = req.body.deliveryemail;
      const phone = req.body.phone;
      const street = req.body.street;
      const addressLine2 = req.body.addressLine2;
      const city = req.body.city;
      const state = req.body.state;
      const country = req.body.country;
      const zipCode = req.body.zipCode;

      const userData = req.session.userData;

      const updatedAddress = {
        firstName,
        lastName,
        deliveryemail,
        phone,
        street,
        addressLine2,
        city,
        state,
        country,
        zipCode,
      };

      const updatedUserData = await User.findOneAndUpdate(
        {
          _id: userData._id,
          'address._id': req.body.addressId,
        },
        {
          $set: { 'address.$': updatedAddress }
        },
        { new: true }
      );

      const ordersData = await Order.find({ userId: userData._id });
      res.render('./users/account', { message: "Address updated successfully", username: userData.username, userData: updatedUserData, ordersData: ordersData, message:"Your address is updated successfully" });
    } catch (error) {
      console.error('Error in usercontroller-updateEditUserAddress:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  const deleteAddress = async (req, res) => {
    try {
      const addressId = req.query.addressid;
      const userData = req.session.userData;

      const updatedUser = await User.findByIdAndUpdate(
        userData._id,
        { $pull: { address: { _id: addressId } } },
        { new: true }
      );
      const ordersData = await Order.find({ userId: userData._id });
      res.render('./users/account', { userData: updatedUser, message: "Address deleted successfully", username: userData.username, ordersData: ordersData });
    } catch (error) {
      console.error('Error in userController-deleteAddress:', error);
      res.status(500).send('Internal Server Error');
    }
  };


  const generateReferralCode = async (length) => {
    try {
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset.charAt(randomIndex);
      }

      return result;
    } catch (error) {
      console.error('Error in userController-generateReferralCode:', error);
      res.status(500).send('Internal Server Error');
    }
  }
 
  
  const referralCodeClaim = async (req, res) => {
    try {
      const userData = req.session.userData;
      const referralEntered = req.body.referralEntered;
      const walletIncrement = 100;
      const numberOfReferrals = 1;
      
      let messageSuccess;

      if(referralEntered === userData.referralCode){
       return messageSuccess = "Cant use your own referral id, try again";
      }
      
      if (referralEntered) {
        // console.log("reached here 1");
        const existingUserOfReferral = await User.findOneAndUpdate(
          { referralCode: referralEntered },
          { $inc: { wallet: walletIncrement, numberOfReferralsDone: numberOfReferrals } },
          { new: true }
        );
      
      
  
        if (existingUserOfReferral) {
          const currentUser = await User.findOneAndUpdate(
            { username: userData.username },
            { $inc: { wallet: walletIncrement }, $set: { isReferralRewardClaimed: true } },
            { new: true }
          );
          
          
          if (currentUser) {
            messageSuccess = "Referral claimed successfully";
          } else {
            messageSuccess = "Referral cannot be claimed, try again";
          }
        
      }else{
        messageSuccess = "Invalid referral code, Try again with a valid code";
      }
    }
    
      const username = userData.username;
      const categoriesData = await Category.find({});
      const productsData = await Products.find({});
      const ordersData = await Order.find({ userId: userData._id });
  
      res.render('./users/account', {
        username,
        userData,
        productsData,
        categoriesData,
        ordersData,
        message: messageSuccess || '', // Ensuring it's not undefined
      });
      
    } catch (error) {
      console.error('Error in userController-referralCodeClaim:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  
 
 const referralAtRegistration = async(req,res) => {
  try {
    const userData = req.session.userData
    res.render('./users/referralAtRegistration' , {message  : "" , userData})
  } catch (error) {
    console.error('Error in userController-referralAtRegistration:', error);
    res.status(500).send('Internal Server Error');
  }
 }
 

 const postReferralAtRegistration = async(req,res) => {
  try {
    const referralEntered = req.body.referralEntered;
    const walletIncrement = 100;
    const numberOfReferrals = 1;
    const userData = req.session.userData
    let messageSuccess;
 
    
    console.log("reached referralEntered 1: ", referralEntered);
    if (referralEntered) {
      const existingUserOfReferral = await User.findOneAndUpdate(
        { referralCode: referralEntered },
        { $inc: { wallet: walletIncrement, numberOfReferralsDone: numberOfReferrals } },
        { new: true }
      );
    
    

      if (existingUserOfReferral) {
        req.session.referralEnteredAtSignUp =    referralEntered
 
          messageSuccess = "Valid referral code, Continue to complete your signup. Redirecting now";
        
      
    }else{
      messageSuccess = "Invalid referral code, Try again with a valid code";
    }
  }
  
   
    res.render('./users/referralAtRegistration', { message: messageSuccess || ''  , userData });
    
  } catch (error) {
    console.error('Error in userController-postReferralAtRegistration:', error);
    res.status(500).send('Internal Server Error');
  }
 }


 const addProfileImage = async (req, res) => {
  try {

    const userId = req.session.userData._id;
 
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {},
      { upsert: true, new: true }
    );

    if (req.file) {
      const imagePath = req.file.path;
      const processedImagePath = `profileImages/${Date.now()}_cropped.jpg`;
      console.log("processedImagePath: ", processedImagePath)
      await sharp(imagePath)
        .resize(750, 750)
        .toFile(processedImagePath);
 
      user.profileImages = processedImagePath;

      fs.unlink(imagePath, (unlinkError) => {
        if (unlinkError) {
          console.error('Error unlinking file:', unlinkError.message);
        }
      });

      await user.save();
    }
    const userData = await User.findById(userId);

      let username = userData.username
      const categoriesData = await Category.find({})
      const productsData = await Products.find({});
      // const ordersData = await Order.findById( userData._id);
      const ordersData = await Order.find({ userId: userData._id });

      // console.log("userdata : ", userData)

      res.render('./users/account', { username: username,  productsData: productsData, categoriesData: categoriesData, message: "Profile image is  updated successfully", userData: userData, ordersData: ordersData });
  } catch (error) {
    console.error('Error in userController-addProfileImage:', error);
    res.status(500).send('Internal Server Error');
  }
};



  module.exports = {
    verifyLogin,
    loadHome,
    loadLogin,
    loadRegister,
    insertUser,
    verifyOtp,
    resendOtp,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    loadAccount,
    loadLoggedinHome,
    individualProductPage,
    userLogout,
    loadChangePassword,
    changePassword,
    addUserAddress,
    insertNewUserAddress,
    loadEditUserAddress,
    updateEditUserAddress,
    deleteAddress,
    loadShop,
    updateloadAccount,
    referralCodeClaim,
    referralAtRegistration,
    postReferralAtRegistration,
    addProfileImage
  };
