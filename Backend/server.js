const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const statisticRoutes = require("./routes/statisticRoutes");
const adminRoutes = require("./routes/adminRoutes");
const addressRoutes = require("./routes/addressRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/Frontend", express.static(path.join(__dirname, "../Frontend")));
mongoose
  .connect("mongodb://127.0.0.1:27017/taf_soccer")
  .then(() => console.log("Kết nối MongoDB thành công"))
  .catch((err) => console.log("Lỗi kết nối MongoDB:", err));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/statistics", statisticRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressRoutes);

app.get("/", (req, res) => {
  res.redirect("/Frontend/user/login.html");
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
