const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  brand: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  sizeStock: [
    {
      size: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 0,
      },
    },
  ],

  quantity: {
    type: Number,
    default: 0,
  },

  image: {
    type: String,
  },

  description: {
    type: String,
  },
});

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
