const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  province: {
    type: String,
    required: true,
  },

  ward: {
    type: String,
    required: true,
  },

  detailAddress: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports =
  mongoose.models.Address || mongoose.model("Address", addressSchema);
