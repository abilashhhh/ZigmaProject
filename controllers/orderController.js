const express = require('express');
const router = express.Router();
const Product = require('../models/productsModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoriesModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Coupon = require('../models/couponsModel');
const Rating = require('../models/ratingModel');
const Razorpay = require('razorpay');

const orderPlaced = async (req, res) => {
  try {
    const userData = req.session.userData;
    const userId = await User.findById(userData._id);
    const { productId, productQuantity, productName, productQuantityTotal, allSubtotal, address_selection, payment_option, couponApplied, dicountAmount } = req.body;

    // console.log(" couponApplied:" , couponApplied)
    // console.log(" dicountAmount:" , dicountAmount)


    //dealing coupons

    if (couponApplied) {
      const updatingCouponData = {
        $push: {
          redemptionHistory: {
            userId: userData._id.toString(),
            redeemedAt: Date.now(),
          },
        },
      };

      const updatedCouponsData = await Coupon.findOneAndUpdate(
        { couponCode: couponApplied },
        updatingCouponData,
        { new: true, upsert: true }
      );

      // console.log("updatedCouponsData:", updatedCouponsData);

    }



    const paymentStatus = (payment_option === 'RazorPay' || payment_option === 'Wallet') ? 'Completed' : 'Pending';
    const canceledOrderPaymentStatus = (payment_option === 'RazorPay' || payment_option === 'Wallet') ? 'Completed' : 'Pending';

    // Quantity updation
    const updateProductQuantities = async (id, quantity) => {
      const product = await Product.findById(id);
      if (product) {
        const updatedQuantity = product.quantity - parseInt(quantity, 10);
        await Product.findByIdAndUpdate(id, { $set: { quantity: updatedQuantity } });
      }
    };

    if (Array.isArray(productId)) {
      // For many products
      for (let i = 0; i < productId.length; i++) {
        await updateProductQuantities(productId[i], productQuantity[i]);
      }
    } else {
      // For a single product
      await updateProductQuantities(productId, productQuantity);
    }

    const addressIndex = parseInt(address_selection, 10);
    const addressss = userData.address && userData.address[addressIndex] || {};

    // Creating order
    const products = Array.isArray(productId)
      ? productId.map((id, index) => ({
        productId: id,
        productName: productName[index] || '',
        quantity: parseInt(productQuantity[index], 10),
        price: parseInt(productQuantityTotal[index], 10),
        canceledOrderPaymentStatus: canceledOrderPaymentStatus,
      }))
      : {
        // For a single product
        productId: productId,
        productName: productName,
        quantity: productQuantity,
        price: productQuantityTotal,
        canceledOrderPaymentStatus: canceledOrderPaymentStatus,
      };

    const newOrder = new Order({
      userId: userId,
      products,
      orderid: generateOrderId(),
      orderDate: new Date(),
      totalPrice: allSubtotal,
      orderStatus: 'Order Placed',
      paymentMethod: payment_option,
      paymentStatus: paymentStatus,
      address: addressss,
      couponApplied: couponApplied,
      dicountAmount: dicountAmount
    });

    const savedOrder = await newOrder.save();

    // Clearing cart
    await Cart.findOneAndUpdate({ userId: userData._id }, { $set: { products: [] } });

    // Reducing the money from the wallet
    if (payment_option === 'Wallet') {
      const updatedWallet = await User.findByIdAndUpdate(userData._id, {
        $set: { wallet: userData.wallet - allSubtotal }
      }, { new: true });
    }

    res.render('./users/orderPlaced', { username: userData.username });
  } catch (error) {
    console.error('Error in orderController - orderPlaced:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

const displayOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderDetails = await Order.find({ orderid: orderId });
    const productDetails = await Product.find({});
    const userData = req.session.userData;
    res.render('./users/orderDetails', { userData: userData, ordersData: orderDetails, productDetails: productDetails });
  } catch (error) {
    console.error('Error in orderController - displayOrderDetails:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

function generateOrderId() {
  return 'ORD' + Date.now();
}

const cancelOrder = async (req, res) => {
  try {
    const cancelOrderId = req.query.orderId;
    const productId = req.query.productId
    const userData = req.session.userData
    // console.log("productId:" ,productId)
    // const orderDetails = await Order.findOne({ orderid: cancelOrderId , productId :productId});

    // console.log("orderDetails: ", orderDetails )

    res.render('./users/cancelOrder', { cancelOrderId: cancelOrderId, productId: productId, userData });
  } catch (error) {
    console.error('Error in orderController - cancelOrder:', error.message);
  }
};



const cancelOrderProcess = async (req, res) => {
  try {
    const userDatas = req.session.userData
    const userId = userDatas._id
    const username = userDatas.username

    const reason = req.body.reason;
    const productId = req.body.productId;
    const cancelOrderId = req.body.cancelOrderId;
    const updatedOrder = await Order.findOneAndUpdate(
      {
        orderid: cancelOrderId,
        'products._id': productId
      },
      {
        $set: {
          'products.$.cancelReason': reason,
          'products.$.cancelDate': new Date(),
          'products.$.canceledOrderStatus': 'Cancelled',
          'products.$.canceledOrderPaymentStatus': 'Cancelled',
        },
      },
      { new: true }
    );


    const orderDetailsCancelledOrder = await Order.findOne({ orderid: cancelOrderId });
    // console.log("details of cancelled order user side:", orderDetailsCancelledOrder , "\n");



    //return refund amount

    const cancelledOrdersData = await Order.find({
      "products._id": productId
    });

    let paymentMethodMessage = '';

    if (cancelledOrdersData[0]?.paymentMethod === 'RazorPay' || cancelledOrdersData[0]?.paymentMethod === 'Wallet') {
      const cancelledOrderDetailsForRefund = await Order.findOne(
        {
          orderid: cancelOrderId,
          'products._id': productId
        },
        {
          'products': {
            $elemMatch: { _id: productId }
          }
        }
      );


      console.log("cancelled order details user side:", cancelledOrderDetailsForRefund)
      //coupon amount for each product

      const couponUsed = orderDetailsCancelledOrder.couponApplied
      const CouponTotalDicountAmount = orderDetailsCancelledOrder.dicountAmount

      console.log("couponUsed:", couponUsed)
      console.log("CouponTotalDicountAmount:", CouponTotalDicountAmount)

      const totalCartPrice = orderDetailsCancelledOrder.totalPrice;
      console.log("totalCartPrice:", totalCartPrice, "\n")

      const onePercentOfTotalAmt = (orderDetailsCancelledOrder.totalPrice + CouponTotalDicountAmount) / 100
      console.log("one percent of total amt:", onePercentOfTotalAmt, "\n")

      const productsShareInTotalAmountInPercentage = (cancelledOrderDetailsForRefund.products[0].price) / onePercentOfTotalAmt;
      console.log("productsShareInTotalAmountInPercentage:", productsShareInTotalAmountInPercentage, "\n")


      const DiscountAmtByThisProduct = (CouponTotalDicountAmount * productsShareInTotalAmountInPercentage) / 100
      console.log("DiscountAmtByThisProduct:", DiscountAmtByThisProduct, "\n")

      const amountToReturnAfterReducingCoupon = cancelledOrderDetailsForRefund.products[0].price - DiscountAmtByThisProduct;
      console.log("amountToReturnAfterReducingCoupon:", amountToReturnAfterReducingCoupon, "\n")


      const ProductAmountToReturn = amountToReturnAfterReducingCoupon



      const walletAmount_afterRefund = userDatas.wallet + ProductAmountToReturn

      const updatingWallet = await User.findByIdAndUpdate(userDatas._id, { $set: { wallet: walletAmount_afterRefund } }, { new: true });

      //should display message , amount refunded to wallet

      const updatedOrder = await Order.findOneAndUpdate(
        {
          orderid: cancelOrderId,
          'products._id': productId
        },
        {
          $set: {
            'products.$.canceledOrderStatus': 'Cancelled',
            'products.$.canceledOrderPaymentStatus': 'Refunded',
            'products.$.refundedAmount': ProductAmountToReturn,

          },
        },
        { new: true }
      );



      //quantity updation
      const ProductDetailsFromOrder = await Order.findOne(
        {
          orderid: cancelOrderId,
          'products._id': productId,
        },
        {
          'products.$': 1,
        }
      );

      // console.log("ProductDetailsFromOrder:", ProductDetailsFromOrder)

      if (ProductDetailsFromOrder && ProductDetailsFromOrder.products && ProductDetailsFromOrder.products.length > 0) {
        const quantityToUpdate = ProductDetailsFromOrder.products[0].quantity;

        const updateProductQuantitiesInDB = await Product.findOneAndUpdate(
          { _id: ProductDetailsFromOrder.products[0].productId },
          { $inc: { quantity: quantityToUpdate } },
          { new: true }
        );
      }

      paymentMethodMessage = `Payment credited to your wallet`;

    }


    const productDetails = updatedOrder.products.find(product => product._id == productId);
    if (productDetails) {
      await Product.findByIdAndUpdate(productId, {
        $inc: { quantity: productDetails.quantity },
      });
    }

    const updatedOrder2 = await Order.findOneAndUpdate(
      {
        orderid: cancelOrderId,
      },
      {
        $set: {
          orderStatus: 'Multiple Statuses'
        },
      },
      { new: true }
    );

    const userDataToSent = await User.findById(userId)
    const categoriesData = await Category.find({});
    const productsData = await Product.find({});
    const ordersData = await Order.find({ userId: userDataToSent._id });

    res.render('./users/account', {
      message: `Order cancelled successfully. ${paymentMethodMessage}`,
      userData: userDataToSent,
      categoriesData,
      productsData,
      ordersData,
      username
    });
    // res.redirect('/accountPage');
  } catch (error) {
    console.error('Error in orderController - cancelOrderProcess:', error.message);
  }
};

// return order
const returnOrder = async (req, res) => {
  try {
    const userData = req.session.userData
    const username = userData.username
    const returnOrderId = req.query.orderId;
    const productId = req.query.productId
    res.render('./users/returnOrder', { returnOrderId: returnOrderId, productId: productId, userData, username });
  } catch (error) {
    console.error('Error in orderController - returnOrder:', error.message);
  }
};

const returnOrderProcess = async (req, res) => {
  try {
    const userDatas = req.session.userData
    const userId = userDatas._id
    const username = userDatas.username
    const reason = req.body.reason;
    const productId = req.body.productId;
    const returnOrderId = req.body.returnOrderId;
    const updatedOrder = await Order.findOneAndUpdate(
      {
        orderid: returnOrderId,
        'products._id': productId //using positional opertr
      },
      {
        $set: {
          'products.$.cancelReason': reason,
          'products.$.cancelDate': new Date(),
          'products.$.canceledOrderStatus': 'Returned',
          'products.$.canceledOrderPaymentStatus': 'Refunded',
        },
      },
      { new: true }
    );


    const orderDetailsReturnedOrder = await Order.findOne({ orderid: returnOrderId });
    // console.log("details of cancelled order user side:", orderDetailsCancelledOrder , "\n");



    //return refund amount

    const returnedOrdersData = await Order.find({
      "products._id": productId
    });


    console.log("returnedOrdersData: ", returnedOrdersData)


    let paymentMethodMessage = '';

    if ((returnedOrdersData[0]?.paymentMethod === 'RazorPay' || returnedOrdersData[0]?.paymentMethod === 'Wallet' || returnedOrdersData[0]?.paymentMethod === 'Pay On Delivery') &&  returnedOrdersData[0]?.paymentStatus === 'Completed') {
      const returnedOrderDetailsForRefund = await Order.findOne(
        {
          orderid: returnOrderId,
          'products._id': productId
        },
        {
          'products': {
            $elemMatch: { _id: productId }
          }
        }
      );


      console.log("refunded order details user side:", returnedOrderDetailsForRefund)
      //coupon amount for each product

      const couponUsed = orderDetailsReturnedOrder.couponApplied
      const CouponTotalDicountAmount = orderDetailsReturnedOrder.dicountAmount

      console.log("couponUsed:", couponUsed)
      console.log("CouponTotalDicountAmount:", CouponTotalDicountAmount)

      const totalCartPrice = orderDetailsReturnedOrder.totalPrice;
      console.log("totalCartPrice:", totalCartPrice, "\n")

      const onePercentOfTotalAmt = (orderDetailsReturnedOrder.totalPrice + CouponTotalDicountAmount) / 100
      console.log("one percent of total amt:", onePercentOfTotalAmt, "\n")

      const productsShareInTotalAmountInPercentage = (returnedOrderDetailsForRefund.products[0].price) / onePercentOfTotalAmt;
      console.log("productsShareInTotalAmountInPercentage:", productsShareInTotalAmountInPercentage, "\n")


      const DiscountAmtByThisProduct = (CouponTotalDicountAmount * productsShareInTotalAmountInPercentage) / 100
      console.log("DiscountAmtByThisProduct:", DiscountAmtByThisProduct, "\n")

      const amountToReturnAfterReducingCoupon = returnedOrderDetailsForRefund.products[0].price - DiscountAmtByThisProduct;
      console.log("amountToReturnAfterReducingCoupon:", amountToReturnAfterReducingCoupon, "\n")


      const ProductAmountToReturn = amountToReturnAfterReducingCoupon



      // const userData = req.session.userData
      const walletAmount_afterRefund = userDatas.wallet + ProductAmountToReturn
      console.log("walletAmount_afterRefund: ", walletAmount_afterRefund)

      const updatingWallet = await User.findByIdAndUpdate(userDatas._id, { $set: { wallet: walletAmount_afterRefund } }, { new: true });

      //should display message , amount refunded to wallet

      const updatedOrder = await Order.findOneAndUpdate(
        {
          orderid: returnOrderId,
          'products._id': productId //using positional opertr
        },
        {
          $set: {
            'products.$.canceledOrderStatus': 'Returned',
            'products.$.canceledOrderPaymentStatus': 'Refunded',
            'products.$.refundedAmount': ProductAmountToReturn,

          },
        },
        { new: true }
      );



      //quantity updation
      const ProductDetailsFromOrder = await Order.findOne(
        {
          orderid: returnOrderId,
          'products._id': productId,
        },
        {
          'products.$': 1,
        }
      );

      // console.log("ProductDetailsFromOrder:", ProductDetailsFromOrder)

      if (ProductDetailsFromOrder && ProductDetailsFromOrder.products && ProductDetailsFromOrder.products.length > 0) {
        const quantityToUpdate = ProductDetailsFromOrder.products[0].quantity;

        const updateProductQuantitiesInDB = await Product.findOneAndUpdate(
          { _id: ProductDetailsFromOrder.products[0].productId },
          { $inc: { quantity: quantityToUpdate } },
          { new: true }
        );
      }

      paymentMethodMessage = `Payment credited to your wallet`;

    }


    const productDetails = updatedOrder.products.find(product => product._id == productId);
    if (productDetails) {
      await Product.findByIdAndUpdate(productId, {
        $inc: { quantity: productDetails.quantity },
      });
    }

    const updatedOrder2 = await Order.findOneAndUpdate(
      {
        orderid: returnOrderId,
      },
      {
        $set: {
          orderStatus: 'Multiple Statuses'
        },
      },
      { new: true }
    );

    const userDataToSent = await User.findById(userId)
    const categoriesData = await Category.find({});
    const productsData = await Product.find({});
    const ordersData = await Order.find({ userId: userDatas._id });

    res.render('./users/account', {
      message: `Order returned successfully. ${paymentMethodMessage}`,
      userData: userDataToSent,
      categoriesData,
      productsData,
      ordersData,
      username
    });

  } catch (error) {
    console.error('Error in orderController - returnOrderProcess:', error.message);
  }
};


const loadAddRating = async (req, res) => {
  try {
    userData = req.session.userData
    res.render('./users/addRating', { userData: userData, productId: req.query.productId, orderId: req.query.orderId });
  } catch (error) {
    console.error('Error in orderController - loadAddRating:', error.message);
    res.status(500).send('Internal Server Error');
  }
};
const addRating = async (req, res) => {
  try {
    const { productId, orderId, rating, review } = req.body;
    const userId = req.session.userData._id;

    const product = await Product.findById(productId);
    const name = await User.findById(userId);

    // Save the rating and review to the database
    const newRating = new Rating({
      userId: userId,
      username: name.username,
      orderId: orderId,
      product: {
        productId: productId,
        productName: product.productName,
        rating: rating,
        review: review
      }
    });

    await newRating.save();

    res.redirect('/accountPage');
  } catch (error) {
    console.error('Error in addRating controller:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

//payment controls

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY
});

const createOrder = async (req, res) => {
  try {
    const amount = req.body.allSubtotal * 100
    const options = {
      amount: amount,
      currency: 'INR',
      receipt: process.env.GMAIL_USER
    }

    razorpayInstance.orders.create(options,
      (err, order) => {
        if (!err) {
          res.status(200).send({
            success: true,
            msg: 'Order Created',
            order_id: order.id,
            amount: amount,
            key_id: process.env.RAZORPAY_ID_KEY,
            product_name: req.body.productName,
            // description:req.body.productId,

            contact: req.body.phoneRazorPay, // user details
            name: req.body.usernameRazorPay,
            email: req.body.deliveryemailRazorPay,



          });
        }
        else {
          res.status(400).send({ success: false, msg: 'Something went wrong!' });
        }
      }
    );

  } catch (error) {
    console.log(error.message);
  }
}



// ---------------------------------------------------------------------------------------------
// Admin side
// ---------------------------------------------------------------------------------------------


const adminOrdersList = async (req, res) => {
  try {
    const ordersListSearch = req.query.ordersListSearch || '';
    const ordersListSelect = req.query.orderStatus === 'Search status' ? '' : req.query.orderStatus || '';
    const ordersListPage = parseInt(req.query.ordersListPage, 10) || 1;
    const ordersListPageLimit = 5;

    const ordersResultData = {
      $and: [{ "products.canceledOrderStatus": { $regex: '.*' + ordersListSelect + '.*', $options: 'i' } }],
      $or: [
        { orderid: { $regex: '.*' + ordersListSearch + '.*', $options: 'i' } },
        { "address.firstName": { $regex: '.*' + ordersListSearch + '.*', $options: 'i' } },
        { "address.lastName": { $regex: '.*' + ordersListSearch + '.*', $options: 'i' } },
        { "address.deliveryemail": { $regex: '.*' + ordersListSearch + '.*', $options: 'i' } },
        { "products.productName": { $regex: '.*' + ordersListSearch + '.*', $options: 'i' } },
      ]
    };

    const ordersData = await Order.find(ordersResultData)
      .limit(ordersListPageLimit)
      .skip((ordersListPage - 1) * ordersListPageLimit)
      .sort({ $natural: -1 })
      .exec();


    // console.log("ordersData:" ,ordersData)

    const ordersListPageCount = await Order.find(ordersResultData).countDocuments();

    const orderStatus = await Order.find()

    res.render('./admin/orderList', {
      allOrders: ordersData,
      orderStatus: orderStatus,
      ordersListTotalPages: Math.ceil(ordersListPageCount / ordersListPageLimit),
      ordersListCurrentPage: ordersListPage,
      ordersListSearch
    });

  } catch (error) {
    console.error('Error in orderController - adminOrdersList:', error.message);
    res.status(500).send('Internal Server Error');
  }
};



const changeOrderStatus = async (req, res) => {
  try {
    const newStatus = req.query.canceledOrderStatus;
    const orderId = req.query.orderId;
    const productId = req.query.productId;

    // console.log(" changeOrderStatusnewStatus : ", newStatus);
    // console.log(" changeOrderStatus orderId", orderId);
    // console.log(" changeOrderStatus productId", productId);

    const orderData = await Order.findOneAndUpdate(
      { _id: orderId, 'products._id': productId },
      { $set: { 'products.$.canceledOrderStatus': newStatus } },
      { new: true }
    );

    if (newStatus == "Delivered") {
      const orderData2 = await Order.findOneAndUpdate(
          { _id: orderId, 'products._id': productId },
          { 
              $set: { 
                paymentStatus: 'Completed',
                  'products.$.canceledOrderPaymentStatus': "Completed"
              }
          },
          { new: true }
      );
  }
  


    // console.log("Updated orderData: ", orderData);
    // Redirect to the appropriate page or handle the response as needed
    res.redirect('/admin/orderListAdmin');
  } catch (error) {
    console.error('Error in changeOrderStatus:', error.message);
    res.status(500).send('Internal Server Error');
  }
};


const individualOrdersPage = async (req, res) => {
  try {
    const ordersIndividualId = req.query.ordersIndividualId
    const ordersData = await Order.findById(ordersIndividualId)
    const productDetails = await Product.find({})

    // console.log("ordersdata: ", ordersData)

    res.render('./admin/ordersIndividual', { ordersData: ordersData, productDetails: productDetails })
  } catch (error) {
    console.error('Error in individualOrdersPage:', error.message);
    res.status(500).send('Internal Server Error');
  }
}

const loadCancelOrderProcessAdmin = async (req, res) => {
  try {
    const cancelOrderId = req.query.orderId;
    const productId = req.query.productId


    const orderDetails = await Order.findOne({ orderid: cancelOrderId });

    res.render('./admin/cancelOrderAdmin', { cancelOrderId: cancelOrderId, productId: productId });
  } catch (error) {
    console.error('Error in orderController - cancelOrder:', error.message);
  }
};


const cancelOrderProcessAdmin = async (req, res) => {
  try {


    const reason = req.body.reason;
    const productId = req.body.productId;

    const cancelOrderId = req.body.cancelOrderId;

    // console.log("cancelOrderId: ", cancelOrderId)
    // console.log("reason:" , reason)
    // console.log("productId: ",productId)
    // const orderDetails = await Order.findOne({ orderid: cancelOrderId });
    const updatedOrder = await Order.findOneAndUpdate(
      {
        orderid: cancelOrderId,
        'products._id': productId //using positional opertr
      },
      {
        $set: {
          'products.$.cancelReason': reason,
          'products.$.cancelDate': new Date(),
          'products.$.canceledOrderStatus': 'Cancelled',
          'products.$.canceledOrderPaymentStatus': 'Cancelled',
        },
      },
      { new: true }
    );



    //return refund amount

    const cancelledOrdersData = await Order.find({
      "products._id": productId
    });

    // console.log("admin - cancelledOrdersData:",cancelledOrdersData)

    if (cancelledOrdersData[0]?.paymentMethod === 'RazorPay' || cancelledOrdersData[0]?.paymentMethod === 'Wallet') {

      const cancelledOrderDetailsForRefund = await Order.findOne(
        {
          orderid: cancelOrderId,
          'products._id': productId
        },
        {
          'products': {
            $elemMatch: { _id: productId }
          }
        }


      );
      // console.log("admin - cancelledOrderDetailsForRefund:",cancelledOrderDetailsForRefund)

      const ProductAmountToReturn = cancelledOrderDetailsForRefund.products[0].price


      const userId = await Order.findOne({ orderid: cancelOrderId }, { userId: 1 });
      // console.log("userId: ", userId)

      const userData = await User.findById(userId.userId);
      // console.log("userData: " , userData)  

      const walletAmount_afterRefund = userData.wallet + ProductAmountToReturn


      const updatingWallet = await User.findByIdAndUpdate(userData._id, { $set: { wallet: walletAmount_afterRefund } }, { new: true });

      //should display message , amount refunded to wallet

      const updatedOrder = await Order.findOneAndUpdate(
        {
          orderid: cancelOrderId,
          'products._id': productId //using positional opertr
        },
        {
          $set: {
            'products.$.canceledOrderStatus': 'Cancelled',
            'products.$.canceledOrderPaymentStatus': 'Refunded',
          },
        },
        { new: true }
      );


      //quantity updation
      const ProductDetailsFromOrder = await Order.findOne(
        {
          orderid: cancelOrderId,
          'products._id': productId,
        },
        {
          'products.$': 1,
        }
      );

      // console.log(":", ProductDetailsFromOrder)



      if (ProductDetailsFromOrder && ProductDetailsFromOrder.products && ProductDetailsFromOrder.products.length > 0) {
        const quantityToUpdate = ProductDetailsFromOrder.products[0].quantity;

        const updateProductQuantitiesInDB = await Product.findOneAndUpdate(
          { _id: ProductDetailsFromOrder.products[0].productId },
          { $inc: { quantity: quantityToUpdate } },
          { new: true }
        );
      }
      // console.log("updated order 1", updatedOrder )
    }
    const updatedOrder2 = await Order.findOneAndUpdate(
      {
        orderid: cancelOrderId,
      },
      {
        $set: {
          orderStatus: 'Multiple Statuses'
        },
      },
      { new: true }
    );
    // console.log("updated order 2", updatedOrder2 )

    res.redirect('/admin/orderListAdmin');
  } catch (error) {
    console.error('Error in orderController - cancelOrderProcessAdmin:', error.message);
    res.status(500).send('Internal Server Error');
  }
};




module.exports = {
  //users
  orderPlaced,
  displayOrderDetails,
  cancelOrder,
  cancelOrderProcess,
  returnOrder,
  returnOrderProcess,
  loadAddRating,
  addRating,
  createOrder,//payment controls on razorpay
  //admin
  adminOrdersList,
  changeOrderStatus,
  individualOrdersPage,
  loadCancelOrderProcessAdmin,
  cancelOrderProcessAdmin
};


