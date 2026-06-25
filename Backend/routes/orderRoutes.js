const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Cart = require("../models/Cart");

const ORDER_STATUS_FLOW = {
  "Chờ xác nhận": "Đã xác nhận",
  "Đã xác nhận": "Đang giao",
  "Đang giao": "Đã giao",
  "Đã giao": "Hoàn thành",
};

function isOrderPaid(order) {
  return order.paymentStatus === "Đã thanh toán";
}

// Tạo đơn hàng từ user
router.post("/", async (req, res) => {
  try {
    const { userId, customerName, phone, address, products, totalPrice } =
      req.body;

    if (
      !userId ||
      !customerName ||
      !phone ||
      !address ||
      !products ||
      products.length === 0
    ) {
      return res.status(400).json({
        message: "Thiếu thông tin đặt hàng",
      });
    }

    const newOrder = new Order({
      userId,
      customerName,
      phone,
      address,
      products,
      totalPrice,
      status: "Chờ xác nhận",
      paymentStatus: "Chưa thanh toán",
    });

    await newOrder.save();

    // Xóa sản phẩm đã đặt khỏi giỏ hàng
    const cart = await Cart.findOne({ userId });

    if (cart) {
      products.forEach((orderedProduct) => {
        cart.products = cart.products.filter(
          (item) =>
            !(
              item.productId === orderedProduct.productId &&
              Number(item.size) === Number(orderedProduct.size)
            ),
        );
      });

      await cart.save();
    }

    res.json({
      message: "Đặt hàng thành công. Đơn hàng đang chờ xác nhận.",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi tạo đơn hàng",
    });
  }
});

// User xem đơn hàng của mình
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy đơn hàng của khách hàng",
    });
  }
});

// NVBH lấy tất cả đơn hàng
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách đơn hàng",
    });
  }
});

// NVBH xem chi tiết 1 đơn hàng
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy chi tiết đơn hàng",
    });
  }
});

// NVBH cập nhật trạng thái đơn hàng
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng",
      });
    }

    const nextStatus = ORDER_STATUS_FLOW[order.status];

    if (!nextStatus) {
      return res.status(400).json({
        message: "Đơn hàng đã ở trạng thái cuối, không thể cập nhật thêm",
      });
    }

    if (status !== nextStatus) {
      return res.status(400).json({
        message: `Chỉ có thể cập nhật bước tiếp theo là "${nextStatus}"`,
      });
    }

    if (status === "Hoàn thành" && !isOrderPaid(order)) {
      return res.status(400).json({
        message: "Vui lòng đánh dấu thanh toán trước khi hoàn thành đơn hàng",
      });
    }

    order.status = status;
    await order.save();

    res.json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật trạng thái đơn hàng",
    });
  }
});

// NVBH đánh dấu đơn hàng đã thanh toán
router.put("/:id/payment", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng",
      });
    }

    if (order.status !== "Đã giao") {
      return res.status(400).json({
        message: "Chỉ có thể đánh dấu thanh toán sau khi đơn hàng đã giao",
      });
    }

    if (isOrderPaid(order)) {
      return res.status(400).json({
        message: "Đơn hàng này đã được đánh dấu thanh toán",
      });
    }

    order.paymentStatus = "Đã thanh toán";
    order.paidAt = new Date();
    await order.save();

    res.json({
      message: "Đánh dấu thanh toán thành công",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi đánh dấu thanh toán",
    });
  }
});

module.exports = router;
