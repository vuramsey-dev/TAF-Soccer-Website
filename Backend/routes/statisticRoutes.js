const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const ExcelJS = require("exceljs");

router.get("/summary/data", async (req, res) => {
  try {
    const orders = await Order.find({
      status: "Hoàn thành",
    });
    const products = await Product.find();

    const now = new Date();

    let totalRevenue = 0;
    let todayRevenue = 0;
    let yearRevenue = 0;
    let totalProducts = 0;
    let totalInventoryValue = 0;

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      totalRevenue += Number(order.totalPrice || 0);

      if (date.toDateString() === now.toDateString()) {
        todayRevenue += Number(order.totalPrice || 0);
      }

      if (date.getFullYear() === now.getFullYear()) {
        yearRevenue += Number(order.totalPrice || 0);
      }

      order.products.forEach((item) => {
        totalProducts += Number(item.quantity || 0);
      });
    });

    products.forEach((product) => {
      const sizeStock = Array.isArray(product.sizeStock)
        ? product.sizeStock
        : [];
      const stockQuantity =
        sizeStock.length > 0
          ? sizeStock.reduce(
              (total, item) => total + Number(item.quantity || 0),
              0,
            )
          : Number(product.quantity || 0);

      totalInventoryValue += stockQuantity * Number(product.price || 0);
    });

    const orderTotals = orders.map((order) => Number(order.totalPrice || 0));
    const largestOrder = orderTotals.length > 0 ? Math.max(...orderTotals) : 0;
    const smallestOrder =
      orderTotals.length > 0 ? Math.min(...orderTotals) : 0;
    const averageOrder =
      orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    res.json({
      totalRevenue,
      todayRevenue,
      totalOrders: orders.length,
      totalProducts,
      yearRevenue,
      totalInventoryValue,
      largestOrder,
      smallestOrder,
      averageOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi thống kê",
    });
  }
});
router.get("/:type", async (req, res) => {
  try {
    const type = req.params.type;

    const orders = await Order.find({
      status: "Hoàn thành",
    });

    const now = new Date();

    // ===== HÔM NAY =====
    if (type === "today") {
      const data = [];

      for (let hour = 0; hour < 24; hour++) {
        let revenue = 0;

        orders.forEach((order) => {
          const orderDate = new Date(order.createdAt);

          if (
            orderDate.toDateString() === now.toDateString() &&
            orderDate.getHours() === hour
          ) {
            revenue += order.totalPrice;
          }
        });

        data.push({
          label: `${hour}h`,
          revenue,
        });
      }

      return res.json(data);
    }

    // ===== 7 NGÀY =====
    if (type === "7days") {
      const data = [];

      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(now.getDate() - i);

        let revenue = 0;

        orders.forEach((order) => {
          const orderDate = new Date(order.createdAt);

          if (orderDate.toDateString() === day.toDateString()) {
            revenue += order.totalPrice;
          }
        });

        data.push({
          label: `${day.getDate()}/${day.getMonth() + 1}`,
          revenue,
        });
      }

      return res.json(data);
    }

    // ===== 30 NGÀY =====
    if (type === "30days") {
      const data = [];

      for (let i = 29; i >= 0; i--) {
        const day = new Date();
        day.setDate(now.getDate() - i);

        let revenue = 0;

        orders.forEach((order) => {
          const orderDate = new Date(order.createdAt);

          if (orderDate.toDateString() === day.toDateString()) {
            revenue += order.totalPrice;
          }
        });

        data.push({
          label: `${day.getDate()}/${day.getMonth() + 1}`,
          revenue,
        });
      }

      return res.json(data);
    }

    // ===== 1 NĂM =====
    if (type === "1year") {
      const data = [];

      for (let month = 0; month < 12; month++) {
        let revenue = 0;

        orders.forEach((order) => {
          const orderDate = new Date(order.createdAt);

          if (
            orderDate.getFullYear() === now.getFullYear() &&
            orderDate.getMonth() === month
          ) {
            revenue += order.totalPrice;
          }
        });

        data.push({
          label: `T${month + 1}`,
          revenue,
        });
      }

      return res.json(data);
    }

    // ===== BÁN NHIỀU NHẤT =====
    if (type === "best-products") {
      const products = {};

      orders.forEach((order) => {
        order.products.forEach((item) => {
          if (!products[item.name]) {
            products[item.name] = 0;
          }

          products[item.name] += item.quantity;
        });
      });

      const result = Object.entries(products)
        .map(([name, quantity]) => ({
          name,
          quantity,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      return res.json(result);
    }

    // ===== BÁN ÍT NHẤT =====
    if (type === "worst-products") {
      const products = {};

      orders.forEach((order) => {
        order.products.forEach((item) => {
          if (!products[item.name]) {
            products[item.name] = 0;
          }

          products[item.name] += item.quantity;
        });
      });

      const result = Object.entries(products)
        .map(([name, quantity]) => ({
          name,
          quantity,
        }))
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 10);

      return res.json(result);
    }

    res.status(400).json({
      message: "Loại thống kê không hợp lệ",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Lỗi thống kê",
    });
  }
});
router.get("/export/:type", async (req, res) => {
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("ThongKe");

  worksheet.columns = [
    {
      header: "Thời gian",
      key: "label",
      width: 20,
    },
    {
      header: "Doanh thu",
      key: "revenue",
      width: 20,
    },
  ];

  const orders = await Order.find({
    status: "Hoàn thành",
  });

  orders.forEach((order) => {
    worksheet.addRow({
      label: new Date(order.createdAt).toLocaleDateString(),

      revenue: order.totalPrice,
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader("Content-Disposition", "attachment; filename=ThongKe.xlsx");

  await workbook.xlsx.write(res);

  res.end();
});
module.exports = router;
