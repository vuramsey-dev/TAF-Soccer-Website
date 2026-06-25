const express = require("express");
const router = express.Router();
const User = require("../models/User");

// API đăng ký tài khoản
router.post("/register", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();
    const phone = (req.body.phone || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(400).json({
        message: "Email này đã được đăng ký",
      });
    }

    const newUser = new User({
      name,
      email,
      password,
      phone,
      role: "user",
    });

    await newUser.save();

    res.json({
      message: "Đăng ký tài khoản thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi đăng ký",
    });
  }
});

// API đăng nhập
router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(400).json({
        message: "Sai email hoặc mật khẩu",
      });
    }

    res.json({
      message: "Đăng nhập thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi đăng nhập",
    });
  }
});

// API đổi mật khẩu
router.put("/change-password", async (req, res) => {
  try {
    const userId = req.body.userId;
    const currentPassword = (req.body.currentPassword || "").trim();
    const newPassword = (req.body.newPassword || "").trim();

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin mật khẩu",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    if (user.password !== currentPassword) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi đổi mật khẩu",
    });
  }
});

module.exports = router;
