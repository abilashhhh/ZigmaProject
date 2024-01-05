const express = require('express');
const router = express.Router();
const Category = require('../models/categoriesModel');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const upload = multer({ dest: 'categoryImages/' });
const cron = require('node-cron');
const Product = require('../models/productsModel');


const loadCategories = async (req, res) => {
    try {
        // const categoriesData = await Category.find({});



        const categoriesListSearch = req.query.categoriesListSearch || '';

        const categoriesResultData = {

            $or: [
                { categoryName: { $regex: '.*' + categoriesListSearch + '.*', $options: 'i' } },
                { categoryCountry: { $regex: '.*' + categoriesListSearch + '.*', $options: 'i' } },
            ]
        };

        const categoriesData = await Category.find(categoriesResultData).exec();

        const categoriesWithProductCount = await Category.aggregate([
            {
                $match: categoriesResultData
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'categoryName',
                    foreignField: 'category',
                    as: 'products'
                }
            },
            {
                $project: {
                    categoryName: 1,
                    categoryCountry: 1,
                    productCount: { $size: '$products' }
                }
            }
        ]);
        // console.log("categoriesWithProductCount:" ,categoriesWithProductCount )

        res.render('./admin/categories', { categoriesData: categoriesData, categoriesWithProductCount: categoriesWithProductCount });
    } catch (error) {
        console.error("Error in categoriesController-loadCategories: ", error.message);
    }
}



const addCategories = async (req, res) => {
    try {
        const category = new Category({
            categoryName: req.body.categoryName,
            categoryCountry: req.body.categoryCountry,
        });

        if (req.file) {
            const imagePath = req.file.path;
            const processedImagePath = `categoryImages/${Date.now()}_cropped.jpg`;

            await sharp(imagePath)
                .resize(750, 750)
                .toFile(processedImagePath);

            category.categoryImage = processedImagePath;

            // Asynchronously unlink the original image path
            fs.unlink(imagePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error unlinking file:', unlinkError.message);
                }
            });
        }

        const existingCategory = await Category.findOne({
            categoryName: category.categoryName,
        });

        if (
            existingCategory &&
            category.categoryName === existingCategory.categoryName
        ) {
            const categoriesData = await Category.find({});
            res.redirect('/admin/categories')
        } else {
            const categoryData = await category.save();
            // const categoriesData = await Category.find({});
            // res.render('./admin/categories', {
            //   message: 'Category created successfully.',
            //   categoriesData: categoriesData,
            //   categoriesWithProductCount: categoriesWithProductCount,
            // });
            res.redirect('/admin/categories')
        }
    } catch (error) {
        console.error('Error in categoriesController-addCategories: ', error.message);
    }
};


const editCategories = async (req, res) => {
    try {
        const categoryId = req.query._id;
        const categoryDataToEdit = await Category.findById({ _id: categoryId });

        // console.log("consoling categoryDataToEdit:", categoryDataToEdit);

        if (categoryDataToEdit) {
            res.render('./admin/editCategories', { categories: categoryDataToEdit });
        } else {
            console.error("Category not found.");
            // Handle the case where the category is not found, perhaps redirect or show an error page.
        }
    } catch (error) {
        console.error("Error in categoriesController-editCategories: ", error.message);
    }
}


const displayUpdatedCategories = async (req, res) => {
    try {
        const categoryId = req.body.categoriesid;

        // Find the category by ID
        const existingCategory = await Category.findById(categoryId);



        // Set the new values
        existingCategory.categoryName = req.body.categoryName;
        existingCategory.categoryCountry = req.body.categoryCountry;

        // Check if a new image is provided
        if (req.file) {
            const imagePath = req.file.path;
            const processedImagePath = `categoryImages/${Date.now()}_cropped.jpg`;

            try {
                // Resize and save the new image
                await sharp(imagePath)
                    .resize(750, 750)
                    .toFile(processedImagePath);

                existingCategory.categoryImage = processedImagePath;

                // Asynchronously unlink the original image path
                fs.unlink(imagePath, (unlinkError) => {
                    if (unlinkError) {
                        console.error('Error unlinking file:', unlinkError.message);
                    }
                });
            } catch (imageError) {
                console.error('Error processing image:', imageError.message);
            }
        }

        // Save the updated category
        const updatedCategory = await existingCategory.save();

        res.redirect('/admin/categories');
    } catch (error) {
        console.error("Error in displayUpdatedCategories:", error.message);
        res.redirect('/admin/categories');
    }
};




const blockCategories = async (req, res) => {
    try {
        const categoriesid = req.query._id
        const updatedCategory = await Category.findByIdAndUpdate({ _id: categoriesid }, { $set: { isActive: false } })
        res.redirect('/admin/categories')

    } catch (error) {
        console.error("Error in categoriesController-blockCategories: ", error.message);
    }
}

const unblockCategories = async (req, res) => {
    try {
        const categoriesid = req.query._id
        const updatedCategory = await Category.findByIdAndUpdate({ _id: categoriesid }, { $set: { isActive: true } })
        res.redirect('/admin/categories')

    } catch (error) {
        console.error("Error in adminController-unblockCategories: ", error.message);
    }
}



const categoryOffersLoad = async (req, res) => {
    try {
        const categoriesData = await Category.find();
        res.render('./admin/categoryOffers', { categoriesData });
    } catch (error) {
        console.error("Error in adminController-categoryOffersLoad: ", error.message);
        res.status(500).send("Internal Server Error");
    }
};
const editCategoryOffersLoad = async (req, res) => {
    try {
        const categoriesid = req.query._id
        const categoriesData = await Category.findById(categoriesid);

        res.render('./admin/editCategoryOffers', { categoriesData, message: "" });
    } catch (error) {
        console.error("Error in adminController-editCategoryOffersLoad: ", error.message);
        res.status(500).send("Internal Server Error");
    }
};

const categoryOffersPost = async (req, res) => {
    try {


        const categoryId = req.body.categoryId;
        const categoryToUpdate = await Category.findById(categoryId);
        categoryToUpdate.categoryOfferPercentage = req.body.categoryOfferPercentage;
        categoryToUpdate.categoryOfferExpiryDate = req.body.categoryOfferExpiryDate;
        categoryToUpdate.isCategoryOfferActive = req.body.isCategoryOfferActive;

        if (req.file) {
         

            const imagePath = req.file.path;
            const processedImagePath = `categoryImages/categoryOfferImages/${Date.now()}_cropped.jpg`;

            await sharp(imagePath)
                .resize({ width: 1000, height: 500, fit: 'cover' })
                .toFile(processedImagePath);
            categoryToUpdate.categoryOfferImages = processedImagePath;

            fs.unlink(imagePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error unlinking file:', unlinkError.message);
                }
            });
        }

        await categoryToUpdate.save();
        const categoriesData = await Category.findById(categoryId);
        res.render('./admin/editCategoryOffers', { categoriesData, message: "Offer added successfully" });
    } catch (error) {
        console.error("Error in categoriesController-categoryOffersLoad: ", error.message);
        res.status(500).send("Internal Server Error");
    }
};


const blockCategoriesOffers = async (req, res) => {
    try {
        const categoriesid = req.query._id
        // console.log("blockCategoriesOffers - categoriesid : ", categoriesid)

        const updatedCategory = await Category.findByIdAndUpdate({ _id: categoriesid }, { $set: { isCategoryOfferActive: false } })
        const categoriesData = await Category.findById(categoriesid)

        res.render('./admin/editCategoryOffers', { categoriesData, message: "Category offer is blocked successfully" });

    } catch (error) {
        console.error("Error in categoriesController-blockCategoriesOffers: ", error.message);
    }
}

const unblockCategoriesOffers = async (req, res) => {
    try {
        const categoriesid = req.query._id
        // console.log("unblockCategoriesOffers - categoriesid : ", categoriesid)
        const updatedCategory = await Category.findByIdAndUpdate({ _id: categoriesid }, { $set: { isCategoryOfferActive: true } })
        const categoriesData = await Category.findById(categoriesid)
        res.render('./admin/editCategoryOffers', { categoriesData, message: "Category offer is unblocked successfully" });

    } catch (error) {
        console.error("Error in categoriesController-unblockCategoriesOffers: ", error.message);
    }
}

const updateSalesPriceForProducts = async (products) => {
    for (const product of products) {
    // console.log("product - updateSalesPriceForProducts - categories offer:" , product)
    // console.log("productCategory:" , product.category)
 

    if(product.isProductOfferActive === false ){
        var updatedData = await Product.findByIdAndUpdate(
            product._id,
            { salesPrice: product.regularPrice },
            { new: true }
        );
    }
        // console.log(`Updated salesPrice for Product: ${product.productName} - ${product._id} to ${updatedData.salesPrice}`);
    }
};

const categoryOffersExpiryChecking = async () => {
    try {
        const currentDate = new Date();

        const expiredCategories = await Category.find({ categoryOfferExpiryDate: { $lte: currentDate } });
        const activeCategories = await Category.find({ isCategoryOfferActive: true, categoryOfferExpiryDate: { $gt: currentDate } });
        const inactiveCategories = await Category.find({ isCategoryOfferActive: false });

        // Expired Categories
        if (expiredCategories.length > 0) {
            const expiredCategoryIds = expiredCategories.map(category => category._id);

            await Category.updateMany(
                { _id: { $in: expiredCategoryIds } },
                { $set: { isCategoryOfferActive: false } }
            );

            const expiredCategoryNames = expiredCategories.map(category => category.categoryName);
            const productsInExpiredCategories = await Product.find({ category: { $in: expiredCategoryNames } }, { productName: 1 });

            // console.log("Products in Expired Categories:", productsInExpiredCategories);
            await updateSalesPriceForProducts(productsInExpiredCategories);
        }

        // Active Categories
        const categoriesWithActiveOffers = await activeCategories;
        const productsInActiveCategories = await Product.find({ category: { $in: categoriesWithActiveOffers.map(cat => cat.categoryName) } });

        for (const product of productsInActiveCategories) {
            if(product.isProductOfferActive === false ){
            const category = categoriesWithActiveOffers.find(cat => cat.categoryName === product.category);
            const categoryOfferPercentageData = category.categoryOfferPercentage;
            const updatedSalesPrice = product.regularPrice - (product.regularPrice * (categoryOfferPercentageData / 100));

            await Product.findByIdAndUpdate(product._id, { salesPrice: updatedSalesPrice.toFixed(2) });
            // console.log(`Updated salesPrice for Product in Active Category: ${product.productName} - ${product._id} to ${updatedSalesPrice}`);
        }
    }

        // Inactive Categories
        const categoriesWithInActiveOffers = await inactiveCategories;
        const productsInInactiveCategories = await Product.find({ category: { $in: categoriesWithInActiveOffers.map(cat => cat.categoryName) } });

        await updateSalesPriceForProducts(productsInInactiveCategories);

    } catch (error) {
        console.error("Error in categoriesController - categoryOffersExpiryChecking:", error.message);
    }
};

// cron job - runs every minute
cron.schedule('* * * * * *', async () => {
    await categoryOffersExpiryChecking();
});

 



module.exports = {
    loadCategories,
    addCategories,
    blockCategories,
    unblockCategories,
    editCategories,
    displayUpdatedCategories,
    categoryOffersLoad,
    categoryOffersPost,
    blockCategoriesOffers,
    unblockCategoriesOffers,
    editCategoryOffersLoad

}