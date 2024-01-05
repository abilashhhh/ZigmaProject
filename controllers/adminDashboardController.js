const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Product = require('../models/productsModel');
const Category = require('../models/categoriesModel');
const Order = require('../models/orderModel');
const adminHomeLoad = async (req, res) => {
    try {
        const orderData = await Order.find();

        let totalPriceIncome = 0;
        let orderPlacedProducts = 0;
        let shippedProducts = 0;
        let cancelledProducts = 0;
        let deliveredProducts = 0;
        let returnedProducts = 0;

        orderData.forEach(order => {
            if (order.canceledOrderPaymentStatus === "Refunded") {
                totalPriceIncome -= order.totalPrice;
            } else {
                totalPriceIncome += order.totalPrice;
            }

        order.products.forEach(product => {
                if (product.canceledOrderStatus === "Order Placed") {
                    orderPlacedProducts += product.quantity;
                }
                if (product.canceledOrderStatus === "Shipped") {
                    shippedProducts += product.quantity;
                }
                if (product.canceledOrderStatus === "Delivered") {
                    deliveredProducts += product.quantity;
                }
                if (product.canceledOrderStatus === "Cancelled") {
                    cancelledProducts += product.quantity;
                }
                if (product.canceledOrderStatus === "Returned") {
                    returnedProducts += product.quantity;
                }
            });
        });

        const orderDataCount = await Order.find().countDocuments();
        const categoriesDataCount = await Category.find().countDocuments();
        const productsDataCount = await Product.find().countDocuments();
        const productsData = await Product.find();
        const usersCount = await User.find().countDocuments();
        const usersData = await User.find();

        res.render('./admin/adminDashboard', {
            orderData,
            categoriesDataCount,
            productsDataCount,
            productsData,
            orderDataCount,
            totalPriceIncome,
            usersCount,
            usersData,
            orderPlacedProducts,
            shippedProducts,
            cancelledProducts,
            deliveredProducts,
            returnedProducts
        });
    } catch (error) {
        console.error("Error in adminDashboardController-adminHomeLoad: ", error.message);
    }
};


const fetchMonthlyData = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const monthlyOrderData = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "Completed",
                    orderDate: {
                        $gte: new Date(currentYear, 0, 1), // Start of the current year
                        $lt: new Date(currentYear + 1, 0, 1)  // Start of the next year
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$orderDate" },
                    totalMonthlyPrice: { $sum: "$totalPrice" }
                }
            }
        ]);

        const monthlyUserData = await User.aggregate([
            {
                $match: {
                    registrationDate: {
                        $gte: new Date(currentYear, 0, 1), // Start of the current year
                        $lt: new Date(currentYear + 1, 0, 1)  // Start of the next year
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$registrationDate" },
                    userCount: { $sum: 1 }
                }
            }
        ]);

        const allMonths = Array.from({ length: 12 }, (_, index) => index + 1);
        const formattedMonthlyOrderData = allMonths.map(month => {
            const matchingOrderData = monthlyOrderData.find(data => data._id === month);
            return { _id: month, totalMonthlyPrice: matchingOrderData ? matchingOrderData.totalMonthlyPrice : 0 };
        });

        const formattedMonthlyUserData = allMonths.map(month => {
            const matchingUserData = monthlyUserData.find(data => data._id === month);
            return { _id: month, userCount: matchingUserData ? matchingUserData.userCount : 0 };
        });

        res.json({ monthlyOrderData: formattedMonthlyOrderData, monthlyUserData: formattedMonthlyUserData });
    } catch (error) {
        console.error("Error in adminDashboardController-fetchMonthlyData: ", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const fetchWeeklyData = async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());

        const weeklyOrderData = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "Completed",
                    orderDate: {
                        $gte: startOfWeek,
                        $lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - currentDate.getDay()))
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$orderDate" },
                    totalWeeklyPrice: { $sum: "$totalPrice" }
                }
            }
        ]);

        const weeklyUserData = await User.aggregate([
            {
                $match: {
                    registrationDate: {
                        $gte: startOfWeek,
                        $lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - currentDate.getDay()))
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$registrationDate" },
                    userCount: { $sum: 1 }
                }
            }
        ]);

        // Generate an array of days with 0 values for missing days
        const allDays = Array.from({ length: 7 }, (_, index) => index + 1);
        const formattedWeeklyOrderData = allDays.map(day => {
            const matchingOrderData = weeklyOrderData.find(data => data._id === day);
            return { _id: day, totalWeeklyPrice: matchingOrderData ? matchingOrderData.totalWeeklyPrice : 0 };
        });

        const formattedWeeklyUserData = allDays.map(day => {
            const matchingUserData = weeklyUserData.find(data => data._id === day);
            return { _id: day, userCount: matchingUserData ? matchingUserData.userCount : 0 };
        });

        res.json({ weeklyOrderData: formattedWeeklyOrderData, weeklyUserData: formattedWeeklyUserData });
    } catch (error) {
        console.error("Error in adminDashboardController-fetchWeeklyData: ", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const productDataChartDetails = async (req, res) => {
    try {
        // Aggregate pipeline to count the number of times each product has been sold
        const productSoldData = await Order.aggregate([
            // Unwind the products array to have one document per product
            { $unwind: "$products" },
            // Group by productId and count the occurrences
            {
                $group: {
                    _id: "$products.productId",
                    productName: { $first: "$products.productName" },
                    totalSold: { $sum: "$products.quantity" },
                },
            },
        ]);

        res.json({ productSoldData: productSoldData });
    } catch (error) {
        console.error("Error in adminDashboardController-productDataChartDetails: ", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const loadSalesReport = async (req, res) => {
    try {
        res.render('./admin/salesReport' , {message : "" , requestedData :'' ,  orderStatus : ''  ,paymentStatus : '' , fromDate : '', toDate : ''})
    } catch (error) {
        console.error("Error in adminDashboardController-loadSalesReport: ", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const salesReportData = async (req, res) => {
    try {
        const fromDate = new Date(req.body.fromDate);
        const toDate = new Date(req.body.toDate);
        const orderStatus = req.body.orderStatus;
        const paymentStatus = req.body.paymentStatus;

        // console.log("fromDate ", fromDate);
        // console.log("toDate ", toDate);
        // console.log("orderStatus ", orderStatus);
        // console.log("paymentStatus ", paymentStatus);
        // console.log("======================================");

        const matchConditions = {};

        matchConditions.orderDate = {
            $gte: fromDate,
            $lt: toDate
        };

        if (orderStatus !== "All") {
            matchConditions["products.canceledOrderStatus"] = orderStatus;
        }

        if (paymentStatus !== "All") {
            matchConditions["products.canceledOrderPaymentStatus"] = paymentStatus;
        }

        const requestedData = await Order.aggregate([
            {
                $match: matchConditions
            }
        ]);
        // console.log("requestedData:", requestedData);
        // console.log("======================================");

        if(requestedData.length > 0) {
            res.render('./admin/salesReport' ,{message: "",requestedData ,orderStatus ,paymentStatus, fromDate , toDate} )

        }else{
            res.render('./admin/salesReport' ,{message : "There is no data to display for the selected options" , requestedData  , orderStatus  ,paymentStatus , fromDate , toDate})
        }

    } catch (error) {
        console.error("Error in adminDashboardController-salesReportData: ", error.message);
    }
}


module.exports = {
    adminHomeLoad,
    fetchMonthlyData,
    fetchWeeklyData,
    productDataChartDetails,
    loadSalesReport,
    salesReportData
};
