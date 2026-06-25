const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Brand = require("../models/Brand");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

function normalizeBrandName(name) {
  if (typeof name !== "string") {
    return "";
  }

  return name.trim().replace(/\s+/g, " ");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getExactBrandFilter(name) {
  return {
    brand: {
      $regex: `^${escapeRegex(name)}$`,
      $options: "i",
    },
  };
}

function getExactBrandNameFilter(name, excludeId) {
  const filter = {
    name: {
      $regex: `^${escapeRegex(name)}$`,
      $options: "i",
    },
  };

  if (excludeId) {
    filter._id = {
      $ne: excludeId,
    };
  }

  return filter;
}

async function syncBrandsFromProducts() {
  const productBrands = await Product.distinct("brand", {
    brand: {
      $exists: true,
      $ne: "",
    },
  });

  const seenBrands = new Set();
  const brandNames = [];

  productBrands.forEach((brandName) => {
    const normalizedName = normalizeBrandName(brandName);
    const brandKey = normalizedName.toLowerCase();

    if (normalizedName && !seenBrands.has(brandKey)) {
      seenBrands.add(brandKey);
      brandNames.push(normalizedName);
    }
  });

  for (const brandName of brandNames) {
    const existedBrand = await Brand.findOne(getExactBrandNameFilter(brandName));

    if (!existedBrand) {
      await Brand.create({
        name: brandName,
      });
    }
  }
}

async function countProductsByBrand(brandName) {
  return Product.countDocuments(getExactBrandFilter(brandName));
}

async function addProductCountToBrands(brands) {
  const productCounts = await Promise.all(
    brands.map((brand) => countProductsByBrand(brand.name)),
  );

  return brands.map((brand, index) => ({
    ...brand.toObject(),
    productCount: productCounts[index],
  }));
}

// Lấy danh sách tài khoản
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách tài khoản",
    });
  }
});

// Thêm tài khoản mới
router.post("/users", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ họ tên, email, mật khẩu và quyền",
      });
    }

    if (!["user", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Quyền tài khoản không hợp lệ",
      });
    }

    const existedUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existedUser) {
      return res.status(400).json({
        message: "Email này đã tồn tại",
      });
    }

    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      password: password.trim(),
      role,
    });

    await newUser.save();

    res.status(201).json({
      message: "Thêm tài khoản thành công",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi thêm tài khoản",
    });
  }
});

// Cập nhật tài khoản
router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        message: "Vui lòng nhập họ tên, email và quyền",
      });
    }

    if (!["user", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Quyền tài khoản không hợp lệ",
      });
    }

    const existedUser = await User.findOne({
      email: email.trim().toLowerCase(),
      _id: { $ne: req.params.id },
    });

    if (existedUser) {
      return res.status(400).json({
        message: "Email này đã được tài khoản khác sử dụng",
      });
    }

    const updateData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      role,
    };

    if (password && password.trim() !== "") {
      updateData.password = password.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      },
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    res.json({
      message: "Cập nhật tài khoản thành công",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi cập nhật tài khoản",
    });
  }
});

// Xóa tài khoản
router.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    res.json({
      message: "Xóa tài khoản thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi xóa tài khoản",
    });
  }
});

// Lấy danh sách thương hiệu
router.get("/brands", async (req, res) => {
  try {
    await syncBrandsFromProducts();

    const keyword = normalizeBrandName(req.query.search || "");
    const filter = keyword
      ? {
          name: {
            $regex: escapeRegex(keyword),
            $options: "i",
          },
        }
      : {};

    const brands = await Brand.find(filter).sort({
      name: 1,
    });
    const brandsWithCount = await addProductCountToBrands(brands);

    res.json(brandsWithCount);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách thương hiệu",
    });
  }
});

// Tìm kiếm thương hiệu theo tên
router.get("/brands/search/:keyword", async (req, res) => {
  try {
    await syncBrandsFromProducts();

    const keyword = normalizeBrandName(req.params.keyword);
    const brands = await Brand.find({
      name: {
        $regex: escapeRegex(keyword),
        $options: "i",
      },
    }).sort({
      name: 1,
    });
    const brandsWithCount = await addProductCountToBrands(brands);

    res.json(brandsWithCount);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi tìm kiếm thương hiệu",
    });
  }
});

// Thêm thương hiệu mới
router.post("/brands", async (req, res) => {
  try {
    const name = normalizeBrandName(req.body.name);
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    if (!name) {
      return res.status(400).json({
        message: "Vui lòng nhập tên thương hiệu",
      });
    }

    const existedBrand = await Brand.findOne(getExactBrandNameFilter(name));

    if (existedBrand) {
      return res.status(400).json({
        message: "Thương hiệu này đã tồn tại",
      });
    }

    const newBrand = new Brand({
      name,
      description,
    });

    await newBrand.save();

    res.status(201).json({
      message: "Thêm thương hiệu thành công",
      brand: {
        ...newBrand.toObject(),
        productCount: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi thêm thương hiệu",
    });
  }
});

// Cập nhật thương hiệu
router.put("/brands/:id", async (req, res) => {
  try {
    const name = normalizeBrandName(req.body.name);
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    if (!name) {
      return res.status(400).json({
        message: "Vui lòng nhập tên thương hiệu",
      });
    }

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        message: "Không tìm thấy thương hiệu",
      });
    }

    const existedBrand = await Brand.findOne(
      getExactBrandNameFilter(name, req.params.id),
    );

    if (existedBrand) {
      return res.status(400).json({
        message: "Tên thương hiệu này đã được sử dụng",
      });
    }

    const oldName = brand.name;

    brand.name = name;
    brand.description = description;

    await brand.save();

    if (oldName !== name) {
      const brandFilter = getExactBrandFilter(oldName);

      await Product.updateMany(brandFilter, {
        $set: {
          brand: name,
        },
      });

      await Cart.updateMany(
        {
          "products.brand": brandFilter.brand,
        },
        {
          $set: {
            "products.$[item].brand": name,
          },
        },
        {
          arrayFilters: [
            {
              "item.brand": brandFilter.brand,
            },
          ],
        },
      );

      await Order.updateMany(
        {
          "products.brand": brandFilter.brand,
        },
        {
          $set: {
            "products.$[item].brand": name,
          },
        },
        {
          arrayFilters: [
            {
              "item.brand": brandFilter.brand,
            },
          ],
        },
      );
    }

    const productCount = await countProductsByBrand(name);

    res.json({
      message: "Cập nhật thương hiệu thành công",
      brand: {
        ...brand.toObject(),
        productCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi cập nhật thương hiệu",
    });
  }
});

// Xóa thương hiệu
router.delete("/brands/:id", async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        message: "Không tìm thấy thương hiệu",
      });
    }

    const productCount = await countProductsByBrand(brand.name);

    if (productCount > 0) {
      return res.status(400).json({
        message:
          "Không thể xóa thương hiệu đang có sản phẩm. Hãy đổi thương hiệu của sản phẩm trước.",
      });
    }

    await Brand.findByIdAndDelete(req.params.id);

    res.json({
      message: "Xóa thương hiệu thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi xóa thương hiệu",
    });
  }
});

module.exports = router;
