const express = require('express');
const router = express.Router();
const Coupon = require('../models/couponsModel');
const cron = require('node-cron');

const loadCouponPage = async (req, res) => {
    try {
        const couponData = await Coupon.find();
        res.render('./admin/coupon', { couponData, message: "" });
    } catch (error) {
        console.log("Error in couponController- loadCouponPage", error.message);
    }
};

const createCoupon = async (req, res) => {
    try {
        const isActive = req.body.isActive === 'on';

        const newCoupon = new Coupon({
            couponCode: req.body.couponCode,
            discountPercentage: req.body.discountPercentage,
            minimumAmount: req.body.minimumAmount,
            maximumAmount: req.body.maximumAmount,
            couponExpiry: req.body.couponExpiry,
            maxUsesPerUser: req.body.maxUsesPerUser,
            isActive,
        });

        const couponData = await Coupon.find();

        let existingCouponCode = couponData.some(coupon => coupon.couponCode === newCoupon.couponCode);

        if (existingCouponCode) {
            res.render('./admin/coupon', { couponData, message: "Coupon already exists with that coupon code, Duplicate coupon is not created" });
        } else {
            await newCoupon.save();
            res.redirect('/admin/addCoupons');
        }
    } catch (error) {
        console.log("Error in couponController - createCoupon", error.message);
        res.status(500).send("Internal Server Error");
    }
};

const editCouponPageLoad = async (req, res) => {
    try {
        const couponId = req.query.couponId;
        const couponDataToEdit = await Coupon.findById(couponId);
        const couponData = await Coupon.find();
        res.render('./admin/editCoupon', { couponData, couponDataToEdit });
    } catch (error) {
        console.log("Error in couponController- loadCouponPage", error.message);
    }
};

const updateCoupons = async (req, res) => {
    try {
        const isActive = req.body.isActive === 'on';
        const couponId = req.body.couponId;
        const edittedCouponData = {
            couponCode: req.body.couponCode,
            discountPercentage: req.body.discountPercentage,
            minimumAmount: req.body.minimumAmount,
            maximumAmount: req.body.maximumAmount,
            couponExpiry: req.body.couponExpiry,
            maxUsesPerUser: req.body.maxUsesPerUser,
            isActive,
        };

        const couponData = await Coupon.find();

        let existingCouponCode = couponData.some(coupon => coupon.couponCode === edittedCouponData.couponCode);

        if (existingCouponCode) {
            res.render('./admin/coupon', { couponData, message: "Error in editing coupon, Editted data is not saved" });
        } else {
            await Coupon.findByIdAndUpdate(couponId, edittedCouponData);
            const couponDataNew = await Coupon.find();
            res.render('./admin/coupon', { couponData: couponDataNew, message: "Coupon edited successfully" });
        }
    } catch (error) {
        console.log("Error in couponController - updateCoupons", error.message);
        res.status(500).send("Internal Server Error");
    }
};

const updateCouponStatus = async () => {
    try {
        
        const currentDate = new Date();
        const expiredCoupons = await Coupon.find({ couponExpiry: { $lte: currentDate } });

        if (expiredCoupons.length > 0) {
            for (const coupon of expiredCoupons) {
                await Coupon.findByIdAndUpdate(coupon._id, { isActive: false });
                // console.log(`Coupon: ${coupon.couponCode} is expired.`);
            }
        }
    } catch (error) {
        console.error("Error in couponController - updateCouponStatus:", error.message);
    }
};

// cron job - runs every minute
cron.schedule('* * * * * *', async () => {
    await updateCouponStatus();
});

module.exports = {
    loadCouponPage,
    createCoupon,
    editCouponPageLoad,
    updateCoupons
};
