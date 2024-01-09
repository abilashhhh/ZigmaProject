const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Product = require('../models/productsModel');
const Categories = require('../models/categoriesModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Feedback = require('../models/feedbackModel');

 
const termsPage = async(req,res) => {
    try {
        const userData = req.session.userData
        res.render('./users/termsPage', {userData})
    } catch (error) {
        console.error("Error in additionalPagesController-termsPage: ", error.message);
    }
}

const privacyPolicy = async(req,res) => {
    try {
        const userData = req.session.userData
        res.render('./users/privacyPolicy', {userData})
    } catch (error) {
        console.error("Error in additionalPagesController-privacyPolicy: ", error.message);
    }
}

// not used anywhere 
const purchaseGuide = async(req,res) => {
    try {
        const userData = req.session.userData
        res.render('./users/purchaseGuide', {userData})
    } catch (error) {
        console.error("Error in additionalPagesController-purchaseGuide: ", error.message);
    }
}

const contactPage = (req, res) => {
    try {
        const userData = req.session.userData;
        res.render('./users/contactPage', { userData, message: '', messageType: '' });
    } catch (error) {
        console.error("Error in additionalPagesController-contactPage: ", error.message);
        res.status(500).json({ messageType: 'error', message: 'Internal Server Error' });
    }
}

const feedbackData = async (req, res) => {
    try {
        const { name, email, telephone, subject, message } = req.body;

        console.log("All feedbackData:", name, email, telephone, subject, message);

        const feedback = new Feedback({
            name: name,
            email: email,
            telephone: telephone,
            subject: subject,
            message: message
        });

        const savedFeedback = await feedback.save();

        console.log("Feedback data saved:", savedFeedback);

        res.status(200).json({ messageType: 'success', message: 'Data submitted successfully' });
    } catch (error) {
        console.error("Error in additionalPagesController-feedbackData: ", error.message);
        res.status(500).json({ messageType: 'error', message: 'Error submitting data, Try again' });
    }
}


const aboutPage = async(req,res) => {
    try {
        const userData = req.session.userData
        const categoriesData = await Categories.find({})
        res.render('./users/aboutPage', {userData, categoriesData})
    } catch (error) {
        console.error("Error in additionalPagesController-aboutPage: ", error.message);
    }
}

 
const blogCategoryFullwidth = async(req,res) => {
    try {
        const userData = req.session.userData
        res.render('./users/blogCategoryFullwidth', {userData})
    } catch (error) {
        console.error("Error in additionalPagesController-blogCategoryFullwidth: ", error.message);
    }
}

 
const blogPostFullwidth = async(req,res) => {
    try {
        const userData = req.session.userData
        res.render('./users/blogPostFullwidth', {userData})
    } catch (error) {
        console.error("Error in additionalPagesController-blogPostFullwidth: ", error.message);
    }
}
const brands = async(req,res) => {
    try {
        const userData = req.session.userData
        const categoriesData = await Categories.find({})
        res.render('./users/brands', {userData,categoriesData})
    } catch (error) {
        console.error("Error in additionalPagesController-brands: ", error.message);
    }
}

module.exports = {
    termsPage,
    privacyPolicy,
    purchaseGuide,
    contactPage,
    feedbackData,
    aboutPage,
    blogCategoryFullwidth,
    blogPostFullwidth,
    brands

}