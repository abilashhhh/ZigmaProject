const mongoose = require("mongoose");
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const nocache = require("nocache");
const multer = require("multer");
const path = require('path');
const adminRoute = require('./routes/adminRoute');
const userRoute = require('./routes/userRoute');
const upload = require('./multerConfig');

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(error => {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the application if MongoDB connection fails
  });

// Express middleware
app.use(nocache());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Setting up the session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use('/productImages', express.static(path.join(__dirname, 'productImages')));
app.use('/categoryImages', express.static('categoryImages'));
app.use('/bannerImages', express.static('bannerImages')); 
app.use('/profileImages', express.static('profileImages')); 
 
app.set('view engine', 'ejs');
app.set('views', './views');
 
app.use('/admin', adminRoute);
app.use('/', userRoute);

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error caught by errorHandler:", err.message);
  res.status(500).render('users/404', { message: "Internal Server Error. Sorry for the inconvenience." });
};

app.use(errorHandler);

// Server listening
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log(`http://localhost:${port}`);
});
