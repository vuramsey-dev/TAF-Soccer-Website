const API_ORDER = "http://localhost:3000/api/orders";
const API_AUTH = "http://localhost:3000/api/auth";

const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  alert("Vui lòng đăng nhập để xem tài khoản");
  window.location.href = "/Frontend/user/login.html";
}

// ===============================
// CHUYỂN TAB
// ===============================
const tabButtons = document.querySelectorAll(".account-tab");
const tabContents = document.querySelectorAll(".account-box-content");

function showTab(tabName) {
  tabButtons.forEach((btn) => {
    btn.classList.remove("active");

    if (btn.dataset.tab === tabName) {
      btn.classList.add("active");
    }
  });

  tabContents.forEach((content) => {
    content.classList.remove("active");
  });

  const activeContent = document.getElementById(`tab-${tabName}`);

  if (activeContent) {
    activeContent.classList.add("active");
  }

  if (tabName === "orders") {
    loadMyOrders();
  }
}

tabButtons.forEach((button) => {
  button.addEventListener("click", function () {
    showTab(this.dataset.tab);
  });
});

// Mở đúng tab theo link ?tab=info / password / orders
const urlParams = new URLSearchParams(window.location.search);
let currentTab = urlParams.get("tab") || "info";

if (currentTab === "address") {
  currentTab = "password";
}

showTab(currentTab);

// ===============================
// THÔNG TIN TÀI KHOẢN
// ===============================
document.getElementById("accountName").innerText = user.name || "Chưa có";
document.getElementById("accountEmail").innerText = user.email || "Chưa có";
document.getElementById("accountPhone").innerText = user.phone || "Chưa có";
document.getElementById("accountRole").innerText =
  user.role === "user" ? "Khách hàng" : user.role;

// ===============================
// THAY ĐỔI MẬT KHẨU
// ===============================
const passwordForm = document.getElementById("passwordForm");
const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

passwordForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const currentPassword = currentPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Vui lòng nhập đầy đủ thông tin mật khẩu");
    return;
  }

  if (newPassword.length < 6) {
    alert("Mật khẩu mới phải có ít nhất 6 ký tự");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Xác nhận mật khẩu mới không khớp");
    return;
  }

  try {
    const res = await fetch(`${API_AUTH}/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id || user._id,
        currentPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
      passwordForm.reset();
    }
  } catch (error) {
    alert("Không thể kết nối đến server");
  }
});

// ===============================
// THEO DÕI ĐƠN HÀNG
// ===============================
const myOrdersList = document.getElementById("myOrdersList");
const searchOrder = document.getElementById("searchOrder");
const statusFilter = document.getElementById("statusFilter");

let myOrders = [];

async function loadMyOrders() {
  try {
    const res = await fetch(`${API_ORDER}/user/${user.id}`);
    const orders = await res.json();

    myOrders = orders;

    if (searchOrder) searchOrder.value = "";
    if (statusFilter) statusFilter.value = "all";

    renderMyOrders(myOrders);
  } catch (error) {
    myOrdersList.innerHTML = `
      <div class="empty-orders">
        <h3>Không thể tải đơn hàng</h3>
        <p>Hãy kiểm tra backend đã chạy chưa.</p>
      </div>
    `;
  }
}

function renderMyOrders(orders) {
  myOrdersList.innerHTML = "";

  if (!orders || orders.length === 0) {
    myOrdersList.innerHTML = `
      <div class="empty-orders">
        <h3>Bạn chưa có đơn hàng nào</h3>
        <p>Hãy mua sản phẩm để theo dõi đơn hàng tại đây.</p>
        <a href="/Frontend/user/all-products.html">Mua hàng ngay</a>
      </div>
    `;
    return;
  }

  orders.forEach((order) => {
    const orderCard = document.createElement("div");
    orderCard.className = "order-card";

    const productsHTML = order.products
      .map((product) => {
        return `
          <div class="order-product">
            <img src="${product.image || "/Frontend/img/logo.jpg"}" alt="${product.name}" />

            <div>
              <h4>${product.name}</h4>
              <p>Thương hiệu: ${product.brand}</p>
              <p>Size: ${product.size}</p>
              <p>Số lượng: ${product.quantity}</p>
              <p>Giá: ${Number(product.price).toLocaleString()}đ</p>
            </div>
          </div>
        `;
      })
      .join("");

    orderCard.innerHTML = `
      <div class="order-header">
        <div>
          <h3>Mã đơn: ${shortId(order._id)}</h3>
          <p>Ngày đặt: ${formatDate(order.createdAt)}</p>
        </div>

        <span class="order-status ${getStatusClass(order.status)}">
          ${order.status}
        </span>
      </div>

      <div class="order-customer">
        <p><strong>Người nhận:</strong> ${order.customerName}</p>
        <p><strong>SĐT:</strong> ${order.phone}</p>
        <p><strong>Địa chỉ:</strong> ${order.address}</p>
      </div>

      <div class="order-products">
        ${productsHTML}
      </div>

      <div class="order-footer">
        <strong>Tổng tiền: ${Number(order.totalPrice).toLocaleString()}đ</strong>
      </div>
    `;

    myOrdersList.appendChild(orderCard);
  });
}

function filterOrders() {
  const keyword = searchOrder.value.toLowerCase().trim();
  const status = statusFilter.value;

  let filtered = myOrders;

  if (keyword) {
    filtered = filtered.filter((order) => {
      const productNames = order.products
        .map((product) => product.name.toLowerCase())
        .join(" ");

      return (
        order._id.toLowerCase().includes(keyword) ||
        shortId(order._id).toLowerCase().includes(keyword) ||
        productNames.includes(keyword)
      );
    });
  }

  if (status !== "all") {
    filtered = filtered.filter((order) => order.status === status);
  }

  renderMyOrders(filtered);
}

function shortId(id) {
  if (!id) return "";
  return "DH" + id.slice(-6).toUpperCase();
}

function formatDate(dateString) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "";

  return (
    date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN")
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Chờ xác nhận":
      return "pending";

    case "Đã xác nhận":
      return "confirmed";

    case "Đang giao":
      return "shipping";

    case "Đã giao":
      return "delivered";

    case "Hoàn thành":
      return "completed";

    default:
      return "pending";
  }
}
