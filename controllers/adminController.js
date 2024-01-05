const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcrypt')
const Product = require('../models/productsModel');
const Order = require('../models/orderModel');
const Rating = require('../models/ratingModel');
 

const adminLoginLoad = async (req, res) => {
    try {
        
        res.render('./admin/accountLogin' );
    } catch (error) {
        console.error("Error in adminController-adminLoginLoad: ", error.message);
        res.status(500).send("Error in adminController-adminLoginLoad: ", error.message);
    }
}

const adminHomeLoad = async (req, res) => {
    try {
        const orderData = await Order.find()
        // console.log("orderData : ", orderData)
        res.render('./admin/adminDashboard',{orderData:orderData});
    } catch (error) {
        console.error("Error in adminController-adminHomeLoad: ", error.message);
    }
}

const adminVerifyLogin = async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const adminData = await User.findOne({ username: username });

        if (adminData && (await bcrypt.compare(password, adminData.password))) {
            if (adminData.isAdmin === 1) {
                req.session.user_id = adminData._id;
                return res.redirect('/admin/adminHome');
            } else {
                return res.render('./admin/accountLogin', { message: "Can't login. Check your username and password and try again" });
            }
        } else {
            return res.render('./admin/accountLogin', { message: "Can't login. Check your username and password and try again" });
        }

    } catch (error) {
        console.error("Error in adminController-adminVerifyLogin: ", error.message);
    }
}


// user management
const displayUsersList = async (req, res) => {
    try {
        const usersListSearch = req.query.usersListSearch || '';
        const usersListSelect = req.query.usersStatus;
        const usersListPage = parseInt(req.query.usersListPage, 10) || 1;
        const usersListPageLimit = 5;

        let usersResultData;

        if (usersListSelect == '1' || usersListSelect == '0') {
            usersResultData = {
                $and: [
                    { isActive: Number(usersListSelect) }
                ],
                $or: [
                    { username: { $regex: '.*' + usersListSearch + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + usersListSearch + '.*', $options: 'i' } },
                ]
            };
        } else {
            usersResultData = {
                $or: [
                    { username: { $regex: '.*' + usersListSearch + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + usersListSearch + '.*', $options: 'i' } },
                ]
            };
        }

        const usersData = await User.find({ ...usersResultData, isAdmin: 0 })
            .limit(usersListPageLimit)
            .skip((usersListPage - 1) * usersListPageLimit)
            .sort({ $natural: -1 })
            .exec();

        const usersListPageCount = await User.countDocuments({ ...usersResultData, isAdmin: 0 });

        const usersStatus = await User.find({ isAdmin: 0 });

        res.render('./admin/userList', {
            userData: usersData,
            usersStatus: usersStatus,
            usersListTotalPages: Math.ceil(usersListPageCount / usersListPageLimit),
            usersListCurrentPage: usersListPage,
            usersListSearch
        });

    } catch (error) {
        console.error("Error in adminController-displayUsersList: ", error.message);
    }
};




const blockUser = async (req, res) => {
    try {
        const userid = req.query._id
        const updatedUser = await User.findByIdAndUpdate({ _id: userid }, { $set: { isActive: 0 } })
        res.redirect('/admin/userslist')

    } catch (error) {
        console.error("Error in adminController-blockUser: ", error.message);
    }
}

const unblockUser = async (req, res) => {
    try {
        const userid = req.query._id
        const updatedUser = await User.findByIdAndUpdate({ _id: userid }, { $set: { isActive: 1 } })
        res.redirect('/admin/userslist')
    } catch (error) {
        console.error("Error in adminController-unblockUser: ", error.message);
    }
}


const adminLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log("Error in admin logout:", error.message)
    }
}

const transactionsLoad = async(req,res) => {
    try {
        const orderData = await Order.find()
        // console.log("orderData : ", orderData)
        res.render('./admin/transactions',{orderData:orderData});
    } catch (error) {
        console.error("Error in adminController-transactionsLoad: ", error.message);
    }
} 

const reviewsLoad = async(req,res) => {
    try {
        const productRatings = await Rating.find({})
        // console.log("productRatings:", productRatings)
        res.render('./admin/reviews' , {productRatings});
    } catch (error) {
        console.error("Error in adminController-reviewsLoad: ", error.message);
    }
} 

const loadAdminSettings = async(req,res) => {
    try {
        res.render('./admin/adminSettings' , { message : ""})
    } catch (error) {
        console.log("Error in adminController-loadAdminSettings", error.message);
        res.render('./admin/adminSettings', { message: "An error occurred. Please try again." });
    }
}

 

const securePassword = async (password) => {
  try {
    //10 is the salt value
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    console.log("error in userController, securePassword  ", error.message)
  }
}



const adminSettings = async (req, res) => {
    try {
      const oldpassword = req.body.oldpassword;
      const newpassword = req.body.newpassword;
      const confirmpassword = req.body.confirmpassword;
      const username = req.query.username;
      const userData = await User.findOne({ username: username });


      if (!userData) {
        return res.render('./admin/adminSettings', { message: "User not found." });
      }
      const oldPasswordMatch = await bcrypt.compare(oldpassword, userData.password);

      if (!oldPasswordMatch) {
        return res.render('./admin/adminSettings', { message: "Old password is incorrect, try again" });
      }

      if(newpassword == confirmpassword ){      
        const newPasswordHash = await securePassword(newpassword);
        const updatedpass = await User.findOneAndUpdate({ username: username }, { $set: { password: newPasswordHash } });
  
        res.render('./admin/adminSettings', { message: "Password changed successfully." }); 
    }else{
        res.render('./admin/adminSettings', { message: "Passwords doesnt match" }); 
    }


    } catch (error) {
      console.log("Error in adminController-adminSettings", error.message);
      res.render('./admin/adminSettings', { message: "An error occurred. Please try again." });
    }
  };

module.exports = {
    adminLoginLoad,
    adminVerifyLogin,
    adminHomeLoad,
    displayUsersList,
    blockUser,
    unblockUser,
    adminLogout,
    transactionsLoad,
    reviewsLoad,
    loadAdminSettings,
    adminSettings
}

