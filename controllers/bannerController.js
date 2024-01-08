const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const sharp = require("sharp");
const cron = require('node-cron');
const Banner = require('../models/bannerModel');

const getBannerManagement = async (req, res) => {
    try {
        const bannerData = await Banner.find({})
        res.render('./admin/bannerManagement', { message: "", bannerData });
    } catch (error) {
        console.error("Error in bannerController-getBannerManagement: ", error.message);
        res.status(500).send('Internal Server Error');
    }
}

const createBanners = async (req, res) => {
    try {
        res.render('./admin/createBanners', { message: "" });
    } catch (error) {
        console.error("Error in bannerController-createBanners: ", error.message);
        res.status(500).send('Internal Server Error');
    }
}

const createBannersPost = async (req, res) => {
    try {
        const {
            bannerText1,
            bannerText2,
            bannerText3,
            bannerText4,
            bannerExpiryDate,
            isBannerActive,
            bannerShape,
            bannerDisplayPlace
        } = req.body;

        const banner = new Banner({
            bannerText1,
            bannerText2,
            bannerText3,
            bannerText4,
            bannerExpiryDate,
            isBannerActive,
            bannerShape,
            bannerDisplayPlace
        });

        if (req.file) {
            const imagePath = req.file.path;
            const processedImagePath = `bannerImages/${Date.now()}_cropped.jpg`;

            let imageProcessing = sharp(imagePath);

            if (bannerDisplayPlace === 'B1') {
                if (bannerShape === 'Landscape') {
                    imageProcessing = imageProcessing.resize({ width: 800, height: 400, fit: 'cover' });
                } else if (bannerShape === 'Portrait') {
                    imageProcessing = imageProcessing.resize({ width: 400, height: 800, fit: 'cover' });
                }
            } else if (bannerDisplayPlace === 'B2') {
                // b2 will be the repair services logo and content
                imageProcessing = imageProcessing.resize({ width: 2000, height: 510, fit: 'cover' });
            } else if (bannerDisplayPlace === 'B3') {
                // counter timer box 1
                imageProcessing = imageProcessing.resize({ width: 570, height: 430, fit: 'cover' });
            } else if (bannerDisplayPlace === 'B4') {
                imageProcessing = imageProcessing.resize({ width: 2000, height: 510, fit: 'cover' });
            } else if (bannerDisplayPlace === 'B5') {
                // todays deal
                imageProcessing = imageProcessing.resize({ width: 1116, height: 168, fit: 'cover' });
            }

            await imageProcessing.toFile(processedImagePath);

            banner.bannerImages = processedImagePath;

            fs.unlink(imagePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error unlinking file:', unlinkError.message);
                }
            });
        }

        await banner.save();
        res.render('./admin/createBanners', { message: 'New banner created successfully' });

    } catch (error) {
        console.error("Error in bannerController-createBannersPost: ", error.message);
        res.status(500).send('Internal Server Error');
    }
};


// const createBannersPost = async (req, res) => {
//     try {
//         const {
//             bannerText1,
//             bannerText2,
//             bannerText3,
//             bannerText4,
//             bannerExpiryDate,
//             isBannerActive,
//             bannerShape,
//             bannerDisplayPlace
//         } = req.body;

//         const banner = new Banner({
//             bannerText1,
//             bannerText2,
//             bannerText3,
//             bannerText4,
//             bannerExpiryDate,
//             isBannerActive,
//             bannerShape,
//             bannerDisplayPlace
//         });

//         if (req.file) {
//             const imagePath = req.file.path;
//             const processedImagePath = `bannerImages/${Date.now()}_cropped.jpg`;

//             let imageProcessing = sharp(imagePath);



//             if (bannerDisplayPlace === 'B1') {
//                 if (bannerShape === 'landscape') {
//                     imageProcessing = imageProcessing.resize({ width: 800, height: 400, fit: 'cover' });
//                 } else if (bannerShape === 'portrait') {
//                     imageProcessing = imageProcessing.resize({ width: 400, height: 800, fit: 'cover' });
//                 }
//             } else if (bannerDisplayPlace === 'B2') { // b2 will be the repair services logo and content
//                 imageProcessing = imageProcessing.resize({ width: 800, height: 200, fit: 'cover' });

//             } else if (bannerDisplayPlace === 'B3') { // counter timer box 1
//                 imageProcessing = imageProcessing.resize({ width: 570, height: 430, fit: 'cover' });

//             } else if (bannerDisplayPlace === 'B4') { // counter timer box 2
//                 imageProcessing = imageProcessing.resize({ width: 570, height: 430, fit: 'cover' });

//             } else if (bannerDisplayPlace === 'B5') { // todays deal
//                 imageProcessing = imageProcessing.resize({ width: 1116, height: 168, fit: 'cover' });
//             }

//             await imageProcessing.toFile(processedImagePath);

//             banner.bannerImages = processedImagePath;

//             fs.unlink(imagePath, (unlinkError) => {
//                 if (unlinkError) {
//                     console.error('Error unlinking file:', unlinkError.message);
//                 }
//             });
//         }

//         await banner.save();
//         res.render('./admin/createBanners', { message: 'New banner created successfully' });

//     } catch (error) {
//         console.error("Error in bannerController-createBannersPost: ", error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };


const blockBanner = async (req, res) => {
    try {
        const bannerId = req.query.bannerId;

        const updatedBanner = await Banner.findByIdAndUpdate({ _id: bannerId }, { $set: { isBannerActive: false } })
        const bannerData = await Banner.find({})
        res.render('./admin/bannerManagement', { bannerData, message: "Banner is blocked successfully" });

    } catch (error) {
        console.error("Error in bannerController-blockBanner: ", error.message);
        res.status(500).send('Internal Server Error');
    }
}

const unblockBanner = async (req, res) => {
    try {
        const bannerId = req.query.bannerId;

        const updatedProduct = await Banner.findByIdAndUpdate({ _id: bannerId }, { $set: { isBannerActive: true } })

        const bannerData = await Banner.find({})
        res.render('./admin/bannerManagement', { bannerData, message: "Banner is unblocked successfully" });
    } catch (error) {
        console.error("Error in  bannerController-unblockBanner: ", error.message);
        res.status(500).send('Internal Server Error');
    }
}

const deleteBanner = async (req, res) => {
    try {
        const bannerId = req.query.bannerId;

        const updatedProduct = await Banner.findByIdAndDelete({ _id: bannerId })

        const bannerData = await Banner.find({})
        res.render('./admin/bannerManagement', { bannerData, message: "Banner is deleted successfully" });
    } catch (error) {
        console.error("Error in  bannerController-deleteBanner: ", error.message);
        res.status(500).send('Internal Server Error');
    }
}



const bannersExpiryChecking = async () => {
    try {
        const currentDate = new Date();

        const expiredBanners = await Banner.find({ bannerExpiryDate: { $lte: currentDate } });

        // Expired banners
        if (expiredBanners.length > 0) {
            const expiredBannersIds = expiredBanners.map(banner => banner._id);

            await Banner.updateMany(
                { _id: { $in: expiredBannersIds } },
                { $set: { isBannerActive: false } }
            );
        }
    } catch (error) {
        console.error("Error in bannerController - bannersExpiryChecking:", error.message);
    }
};

// cron job - runs every minute
cron.schedule('* * * * * *', async () => {
    await bannersExpiryChecking();
});




module.exports = {
    getBannerManagement,
    createBanners,
    createBannersPost,
    blockBanner,
    unblockBanner,
    deleteBanner,

};
