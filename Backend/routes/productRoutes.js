const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

function normalizeSizeStock(sizeStock) {
  if (!Array.isArray(sizeStock)) {
    return [];
  }

  return sizeStock
    .map((item) => ({
      size: Number(item.size),
      quantity: Number(item.quantity),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.size) &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0,
    );
}

function getTotalQuantity(sizeStock) {
  return sizeStock.reduce((total, item) => total + item.quantity, 0);
}

// Lấy tất cả sản phẩm
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm",
    });
  }
});

// Thêm sản phẩm
router.post("/", async (req, res) => {
  try {
    const { name, brand, price, sizeStock, image, description } = req.body;
    const normalizedSizeStock = normalizeSizeStock(sizeStock);

    const newProduct = new Product({
      name,
      brand,
      price,
      sizeStock: normalizedSizeStock,
      quantity: getTotalQuantity(normalizedSizeStock),
      image,
      description,
    });

    await newProduct.save();

    res.json({
      message: "Thêm sản phẩm thành công",
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi thêm sản phẩm",
    });
  }
});

// Sửa sản phẩm
router.put("/:id", async (req, res) => {
  try {
    const productData = {
      ...req.body,
    };

    if (Array.isArray(req.body.sizeStock)) {
      productData.sizeStock = normalizeSizeStock(req.body.sizeStock);
      productData.quantity = getTotalQuantity(productData.sizeStock);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true },
    );

    res.json({
      message: "Cập nhật sản phẩm thành công",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật sản phẩm",
    });
  }
});

// Xóa sản phẩm
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa sản phẩm",
    });
  }
});

// Tìm kiếm sản phẩm theo tên hoặc thương hiệu
router.get("/search/:keyword", async (req, res) => {
  try {
    const keyword = req.params.keyword;

    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
      ],
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi tìm kiếm sản phẩm",
    });
  }
});
// Lấy chi tiết một sản phẩm theo id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy chi tiết sản phẩm",
    });
  }
});
module.exports = router;
