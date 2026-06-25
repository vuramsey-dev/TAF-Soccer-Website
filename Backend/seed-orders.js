const mongoose = require("mongoose");

// Cấu trúc bảng Đơn hàng (Khớp với backend của bạn)
const orderSchema = new mongoose.Schema({
  status: { type: String, default: "Hoàn thành" },
  totalPrice: { type: Number, required: true },
  products: [
    {
      name: String,
      price: Number,
      quantity: Number,
      size: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

function getRandomDate(startDaysAgo, endDaysAgo) {
  const now = new Date();
  const start = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

async function seedData() {
  try {
    // Kết nối CSDL
    await mongoose.connect("mongodb://127.0.0.1:27017/taf_soccer");
    console.log("✅ Đã kết nối MongoDB...");

    // Dọn dẹp hóa đơn cũ để làm mới biểu đồ
    await Order.deleteMany({});
    console.log("🗑️ Đã xóa đơn hàng cũ...");

    // Dữ liệu sản phẩm mồi (Không cần file json)
    const dummyProducts = [
      {
        name: "Giày đá bóng cỏ nhân tạo adidas Predator League",
        price: 2150000,
        size: [39, 40, 41],
      },
      {
        name: "Giày đá bóng Nike Mercurial Vapor 15",
        price: 1890000,
        size: [40, 41, 42],
      },
      {
        name: "Giày bóng đá Mizuno Morelia Neo",
        price: 2390000,
        size: [39, 40],
      },
      {
        name: "Giày bóng đá Puma Future Ultimate",
        price: 1750000,
        size: [41, 42],
      },
      {
        name: "Giày bóng đá Nike Phantom GX",
        price: 2050000,
        size: [40, 41, 42],
      },
    ];

    const orders = [];
    for (let i = 0; i < 300; i++) {
      let orderDate;
      const r = Math.random();

      // Phân bổ thời gian: 10% hôm nay, 20% tuần này, 30% tháng này, 40% năm nay
      if (r < 0.1) orderDate = getRandomDate(0, 0);
      else if (r < 0.3) orderDate = getRandomDate(7, 1);
      else if (r < 0.6) orderDate = getRandomDate(30, 8);
      else orderDate = getRandomDate(365, 31);

      const orderProducts = [];
      let totalPrice = 0;
      const numProds = Math.floor(Math.random() * 3) + 1; // 1 khách mua 1-3 mẫu giày

      for (let j = 0; j < numProds; j++) {
        // Cố tình ép tỷ lệ mua để biểu đồ "Sản phẩm bán chạy" phân cấp rõ ràng
        let p;
        if (Math.random() < 0.5)
          p = dummyProducts[0]; // Predator bán cực chạy
        else if (Math.random() < 0.8)
          p = dummyProducts[1]; // Mercurial bán vừa
        else
          p = dummyProducts[Math.floor(Math.random() * dummyProducts.length)];

        const qty = Math.floor(Math.random() * 2) + 1;
        const sz = p.size[Math.floor(Math.random() * p.size.length)];

        orderProducts.push({
          name: p.name,
          price: p.price,
          quantity: qty,
          size: sz,
        });
        totalPrice += p.price * qty;
      }

      orders.push({
        status: "Hoàn thành",
        totalPrice: totalPrice,
        products: orderProducts,
        createdAt: orderDate,
      });
    }

    // Đẩy vào database
    await Order.insertMany(orders);
    console.log(`🎉 Thành công! Đã đổ ${orders.length} đơn hàng vào hệ thống.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Có lỗi xảy ra:", error);
    process.exit(1);
  }
}

seedData();
