const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  customerName: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  products: [
    {
      productId: String,
      name: String,
      brand: String,
      price: Number,
      image: String,
      size: Number,
      quantity: Number,
    },
  ],

  totalPrice: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["Chờ xác nhận", "Đã xác nhận", "Đang giao", "Đã giao", "Hoàn thành"],
    default: "Chờ xác nhận",
  },

  paymentStatus: {
    type: String,
    enum: ["Chưa thanh toán", "Đã thanh toán"],
    default: "Chưa thanh toán",
  },

  paidAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
