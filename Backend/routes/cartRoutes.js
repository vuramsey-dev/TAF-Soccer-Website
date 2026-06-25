const express = require("express");
const router = express.Router();

const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Lấy giỏ hàng của user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        products: [],
      });

      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy giỏ hàng",
    });
  }
});

// Thêm sản phẩm vào giỏ hàng
router.post("/add", async (req, res) => {
  try {
    const { userId, productId, size, quantity } = req.body;

    if (!userId || !productId || !size) {
      return res.status(400).json({
        message: "Thiếu thông tin giỏ hàng",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        products: [],
      });
    }

    const existingProduct = cart.products.find(
      (item) =>
        item.productId === productId && Number(item.size) === Number(size),
    );

    if (existingProduct) {
      existingProduct.quantity += Number(quantity) || 1;
    } else {
      cart.products.push({
        productId,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        size: Number(size),
        quantity: Number(quantity) || 1,
      });
    }

    await cart.save();

    res.json({
      message: "Đã thêm sản phẩm vào giỏ hàng",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi thêm vào giỏ hàng",
    });
  }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put("/update", async (req, res) => {
  try {
    const { userId, productId, size, quantity } = req.body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        message: "Không tìm thấy giỏ hàng",
      });
    }

    const productInCart = cart.products.find(
      (item) =>
        item.productId === productId && Number(item.size) === Number(size),
    );

    if (!productInCart) {
      return res.status(404).json({
        message: "Sản phẩm không có trong giỏ hàng",
      });
    }

    productInCart.quantity = Number(quantity);

    if (productInCart.quantity <= 0) {
      cart.products = cart.products.filter(
        (item) =>
          !(item.productId === productId && Number(item.size) === Number(size)),
      );
    }

    await cart.save();

    res.json({
      message: "Cập nhật giỏ hàng thành công",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật giỏ hàng",
    });
  }
});

// Xóa một sản phẩm khỏi giỏ hàng
router.delete("/remove", async (req, res) => {
  try {
    const { userId, productId, size } = req.body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        message: "Không tìm thấy giỏ hàng",
      });
    }

    cart.products = cart.products.filter(
      (item) =>
        !(item.productId === productId && Number(item.size) === Number(size)),
    );

    await cart.save();

    res.json({
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng",
    });
  }
});

// Xóa toàn bộ giỏ hàng
router.delete("/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        message: "Không tìm thấy giỏ hàng",
      });
    }

    cart.products = [];

    await cart.save();

    res.json({
      message: "Đã làm trống giỏ hàng",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi làm trống giỏ hàng",
    });
  }
});

module.exports = router;
