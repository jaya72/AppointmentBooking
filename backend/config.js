// backend/config.js
require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb+srv://brajwasime_db_user:QtS1aPDLzWgJLjTk@doctor-booking-cluster.zg1xh6t.mongodb.net/?appName=doctor-booking-cluster",
  JWT_SECRET: process.env.JWT_SECRET || "SUPER_SECRET_TOKEN_KEY_12345!@#$",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
};
