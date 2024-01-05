const express = require('express');
const router = express.Router();
const Products = require('../models/productsModel');
const Category = require('../models/categoriesModel');
const fs = require('fs');
const session = require('express-session');
const sharp = require("sharp");
const cron = require('node-cron');

//adding new products page
const loadAddProductsPage = async (req, res) => {
    try {
        const categoriesData = await Category.find({});
        const productsData = await Products.find({});
        res.render('./admin/addProducts', { categoriesData: categoriesData, productsData: productsData })
    } catch (error) {
        console.error("Error in productsController-loadAddProductsPage: ", error.message);
    }
}


const loadProductsListPage = async (req, res) => {
    try {
        // getting data from form
        const productsListSearch = req.query.productsListSearch || '';
        const selectedCategory = req.query.productsListSearchSelect || '';
        const statusFilter = req.query.statusFilter || '';
        const productsListPage = req.query.productsListPage || 1;

        //showing 5 data in page 
        const productsListPagesLimit = 5;

        const categoriesData = await Category.find({});

        const requiredData = {
            $and: [{ category: selectedCategory ? { $regex: '.*' + selectedCategory + '.*', $options: 'i' } : { $exists: true } }],
            $or: [
                { productName: { $regex: '.*' + productsListSearch + '.*', $options: 'i' } },
                { submodel: { $regex: '.*' + productsListSearch + '.*', $options: 'i' } },
                { category: { $regex: '.*' + productsListSearch + '.*', $options: 'i' } },
            ],
            isActive: statusFilter === 'Active' ? true : statusFilter === 'Blocked' ? false : { $exists: true },
        };

        const productsData = await Products.find(requiredData)
            .limit(productsListPagesLimit * 1)
            .skip((productsListPage - 1) * productsListPagesLimit)
            .sort({ $natural: -1 })
            .exec();

        const productsListPagesCount = await Products.countDocuments(requiredData);

        res.render('./admin/productsList', {
            productsData,
            categoriesData,
            productsListPagesTotalPages: Math.ceil(productsListPagesCount / productsListPagesLimit),
            productsListPagesCurrentPage: productsListPage,
            selectedCategory,
            statusFilter,
            productsListSearch,

        });
    } catch (error) {
        console.error("Error in productsController-productsList: ", error.message);
    }
};

const addProducts = async (req, res) => {
    try {
        const products = new Products({
            productName: req.body.productName,
            weight: req.body.weight,
            shape: req.body.shape,
            description: req.body.description,
            color: req.body.color,
            submodel: req.body.submodel,
            regularPrice: req.body.regularPrice,
            salesPrice: req.body.salesPrice,
            image: [],
            category: req.body.category,
            gender: req.body.gender,
            tags: req.body.tags,
            quantity: req.body.quantity,
            displayInHomePage: req.body.displayInHomePage,
        });

        const imagePaths = req.files.map((file) => file.path);

        // Create a new folder for processed images
        const processedImagesFolder = 'productImages/';
        if (!fs.existsSync(processedImagesFolder)) {
            fs.mkdirSync(processedImagesFolder, { recursive: true });
        }

        // Process and crop images using sharp
        const processedImages = await Promise.all(imagePaths.map(async (imagePath, index) => {
            const uniqueIdentifier = Date.now() + index;

            // Update the outputPath to include the processedImagesFolder
            const outputPath = `${processedImagesFolder}${uniqueIdentifier}_cropped.jpg`;

            await sharp(imagePath)
                .resize(750, 750)
                .toFile(outputPath);

            return outputPath;
        }));

         products.image = processedImages;

        const newProductData = await products.save();

         imagePaths.forEach((imagePath) => {
             if (!processedImages.includes(imagePath)) {
                fs.unlinkSync(imagePath);
            }else{
                console.log("addProducts couldnt delete")
            }
        });

        res.redirect('/admin/productList');
    } catch (error) {
        console.error("Error in productsController-addProducts: ", error.message);
        // Handle the error appropriately, e.g., send an error response to the client
        res.status(500).send("Internal Server Error");
    }
};


const blockProducts = async (req, res) => {
    try {
        const productid = req.query._id
        const updatedproducts = await Products.findByIdAndUpdate({ _id: productid }, { $set: { isActive: false } })
        res.redirect('/admin/productList')

    } catch (error) {
        console.error("Error in productsController-blockProducts: ", error.message);
    }
}

const unblockProducts = async (req, res) => {
    try {
        const productid = req.query._id
        const updatedproducts = await Products.findByIdAndUpdate({ _id: productid }, { $set: { isActive: true } })
        res.redirect('/admin/productList')

    } catch (error) {
        console.error("Error in productsController-unblockProducts: ", error.message);
    }
}


const editProductPageLoad = async (req, res) => {
    try {
        const productid = req.query._id
        const categoriesData = await Category.find({});
        const productsDataToEdit = await Products.findById({ _id: productid })
        if (productsDataToEdit) {
            res.render('./admin/editAddProducts', { categoriesData: categoriesData, product: productsDataToEdit });
        } else {
            res.redirect('/admin/productList')
        }
    } catch (error) {
        console.error("Error in productsController-editProductPageLoad: ", error.message);
    }
}



const displayUpdatedProducts = async (req, res) => {
    try {
        const productid = req.body.productid;

        const existingProduct = await Products.findById(productid);

        // Extract deleted image filenames from the request
        const deletedImages = JSON.parse(req.body.deletedImages || '[]');

        const updatedImages = existingProduct.image.filter(image => !deletedImages.includes(image));

        // Process and save the new images in addition to existing images
        const newImages = await Promise.all(req.files.map(async (file) => {
            const uniqueIdentifier = `${Date.now()}_${Math.floor(Math.random() * 1000)}`; // Add a unique identifier with randomness

            const outputPath = `productImages/${uniqueIdentifier}_cropped.jpg`;

            await sharp(file.path)
                .resize(750, 750)
                .toFile(outputPath);

            return outputPath;
        }));

        const updatedData = {
            productName: req.body.productName,
            weight: req.body.weight,
            shape: req.body.shape,
            description: req.body.description,
            color: req.body.color,
            submodel: req.body.submodel,
            regularPrice: req.body.regularPrice,
            salesPrice: req.body.salesPrice,
            category: req.body.category,
            gender: req.body.gender,
            tags: req.body.tags,
            quantity: req.body.quantity,
            image: [...updatedImages, ...newImages],
            displayInHomePage: req.body.displayInHomePage,
        };

        // Updating
        const updatedProduct = await Products.findByIdAndUpdate(productid, { $set: updatedData });

        res.redirect('/admin/productList');
    } catch (error) {
        console.error("Error in productsController-displayUpdatedProducts: ", error.message);
        res.status(500).send('Internal Server Error');
    }
};


const loadProductOffersPage = async (req, res) => {
    try {
        const allProductsData = await Products.find({})
        res.render('./admin/productsOffersPage', { allProductsData })
    } catch (error) {
        console.error("Error in productsController-loadProductOffersPage: ", error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loadProductOffersIndividualPage = async (req, res) => {
    try {
        const productId = req.query.id;
        // console.log('productIdn: ', productId)
        const productData = await Products.findById(productId);
        // console.log("productsdata from individual page: ", productData);
        res.render('./admin/productsOffersIndividualPage', { productData, message: '' });
    } catch (error) {
        console.error("Error in productsController-loadProductOffersIndividualPage: ", error.message);
        res.status(500).send('Internal Server Error');
    }
};

const PostProductOffersIndividualPage = async (req, res) => {
    try {
        const productId = req.body.productId;
        const productToUpdate = await Products.findById(productId);
        productToUpdate.productOfferPercentage = req.body.productOfferPercentage;
        productToUpdate.productOfferExpiryDate = req.body.productOfferExpiryDate;
        productToUpdate.isProductOfferActive = req.body.isProductOfferActive;

        if (req.file) {

            const imagePath = req.file.path;
            const processedImagePath = `productImages/productOfferImage/${Date.now()}_cropped.jpg`;

            await sharp(imagePath)
                .resize({ width: 1000, height: 500, fit: 'cover' })
                .toFile(processedImagePath);
            productToUpdate.productOfferImage = processedImagePath;

            fs.unlink(imagePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error unlinking file:', unlinkError.message);
                }
            });
        }

        await productToUpdate.save();
        const productData = await Products.findById(productId);

        res.render('./admin/productsOffersIndividualPage', { productData, message: "Offer added successfully" });

    } catch (error) {
        console.error("Error in productsController-loadProductOffersIndividualPage: ", error.message);
        res.status(500).send('Internal Server Error');
    }
};



const blockProductsOffers = async (req, res) => {
    try {
        const productId = req.query.productId;

        const updatedProduct = await Products.findByIdAndUpdate({ _id: productId }, { $set: { isProductOfferActive: false } })
        const productData = await Products.findById(productId)

        res.render('./admin/productsOffersIndividualPage', { productData, message: "Product offer is blocked successfully" });

    } catch (error) {
        console.error("Error in productsController-blockProductsOffers: ", error.message);
        res.status(500).send('Internal Server Error');
    }
}

const unblockProductsOffers = async (req, res) => {
    try {
        const productId = req.query.productId;

        const updatedProduct = await Products.findByIdAndUpdate({ _id: productId }, { $set: { isProductOfferActive: true } })
        const productData = await Products.findById(productId)

        res.render('./admin/productsOffersIndividualPage', { productData, message: "Product offer is unblocked successfully" });
    } catch (error) {
        console.error("Error in productsController-unblockProductsOffers: ", error.message);
        res.status(500).send('Internal Server Error');
    }
}

const updateSalesPriceForProducts = async (products) => {
    for (const product of products) {

        if (product.category && typeof product.category !== 'undefined') {
            let categoryData = await Category.findOne({ categoryName: product.category });
            // console.log("categoryData:", categoryData);


            if (categoryData.isCategoryOfferActive === false) {
                const updatedData = await Products.findByIdAndUpdate(
                    product._id,
                    { salesPrice: product.regularPrice },
                    { new: true }
                );
                // console.log("updatedData:", updatedData)

            }
        }
        // console.log(`Updated salesPrice for Product: ${product.productName} - ${product._id} to ${updatedData.salesPrice}`);
    }
};

const productsOffersExpiryChecking = async () => {
    try {
        const currentDate = new Date();

        const expiredProductOffers = await Products.find({ productOfferExpiryDate: { $lte: currentDate } });
        const activeProductOffers = await Products.find({ isProductOfferActive: true, productOfferExpiryDate: { $gt: currentDate } });
        const inactiveProductOffers = await Products.find({ isProductOfferActive: false });


        // console.log("expiredProductOffers: ", expiredProductOffers , "/n")
        // console.log("activeProductOffers: ", activeProductOffers , "/n")
        // console.log("inactiveProductOffers: ", inactiveProductOffers , "/n")

        // Expired products
        if (expiredProductOffers.length > 0) {
            const expiredProductOfferIds = expiredProductOffers.map(products => products._id);

            await Products.updateMany(
                { _id: { $in: expiredProductOfferIds } },
                { $set: { isProductOfferActive: false } }
            );

            const expiredProductOfferNames = expiredProductOffers.map(product => ({ _id: product._id, category: product.category }));

            await updateSalesPriceForProducts(expiredProductOfferNames);
        }

        // Inactive Categories
        await updateSalesPriceForProducts(inactiveProductOffers);



        // Active products 

        for (const product of activeProductOffers) {

            if (product.category && typeof product.category !== 'undefined') {
                let categoryData = await Category.findOne({ categoryName: product.category });
                // console.log("categoryData:", categoryData);


                if (categoryData.isCategoryOfferActive === false) {

                    const productOfferPercentageData = product.productOfferPercentage;
                    // console.log("productOfferPercentageData:", productOfferPercentageData)

                    const updatedSalesPrice = product.regularPrice - (product.regularPrice * (productOfferPercentageData / 100));

                    await Products.findByIdAndUpdate(product._id, { salesPrice: updatedSalesPrice.toFixed(2) });
                    // console.log(`Updated salesPrice for Product in Active Category: ${product.productName} - ${product._id} to ${updatedSalesPrice}`);
                }
            }
        }


    } catch (error) {
        console.error("Error in productsController - productsOffersExpiryChecking:", error.message);
    }
};

// cron job - runs every minute
cron.schedule('* * * * * *', async () => {
    await productsOffersExpiryChecking();
});

module.exports = {
    loadAddProductsPage,
    loadProductsListPage,
    addProducts,
    blockProducts,
    unblockProducts,
    editProductPageLoad,
    displayUpdatedProducts,
    loadProductOffersPage,
    loadProductOffersIndividualPage,
    PostProductOffersIndividualPage,
    blockProductsOffers,
    unblockProductsOffers

}

