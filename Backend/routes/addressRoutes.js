const express = require("express");
const router = express.Router();

const Address = require("../models/Address");

// Lấy tất cả địa chỉ của 1 tài khoản
router.get("/user/:userId", async (req, res) => {
  try {
    const addresses = await Address.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json(addresses);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách địa chỉ",
    });
  }
});

// Thêm địa chỉ mới
router.post("/", async (req, res) => {
  try {
    const { userId, name, phone, province, ward, detailAddress, address } =
      req.body;

    if (
      !userId ||
      !name ||
      !phone ||
      !province ||
      !ward ||
      !detailAddress ||
      !address
    ) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin địa chỉ",
      });
    }

    // Nếu địa chỉ đã tồn tại thì không thêm trùng
    const existedAddress = await Address.findOne({
      userId,
      name,
      phone,
      province,
      ward,
      detailAddress,
    });

    if (existedAddress) {
      return res.json({
        message: "Địa chỉ này đã được lưu trước đó",
        address: existedAddress,
      });
    }

    const newAddress = new Address({
      userId,
      name,
      phone,
      province,
      ward,
      detailAddress,
      address,
    });

    await newAddress.save();

    res.status(201).json({
      message: "Lưu địa chỉ nhận hàng thành công",
      address: newAddress,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lưu địa chỉ nhận hàng",
    });
  }
});

// Xóa 1 địa chỉ
router.delete("/:id", async (req, res) => {
  try {
    const deletedAddress = await Address.findByIdAndDelete(req.params.id);

    if (!deletedAddress) {
      return res.status(404).json({
        message: "Không tìm thấy địa chỉ cần xóa",
      });
    }

    res.json({
      message: "Xóa địa chỉ thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa địa chỉ",
    });
  }
});

module.exports = router;
