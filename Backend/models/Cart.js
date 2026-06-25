const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  products: [
    {
      productId: {
        type: String,
        required: true,
      },

      name: {
        type: String,
        required: true,
      },

      brand: {
        type: String,
      },

      price: {
        type: Number,
        required: true,
      },

      image: {
        type: String,
      },

      size: {
        type: Number,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    },
  ],
});

module.exports = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
