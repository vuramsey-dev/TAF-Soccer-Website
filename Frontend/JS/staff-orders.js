const API_ORDER = "https://taf-soccer-website-1.onrender.com/api/orders";

const orderList = document.getElementById("orderList");
const searchOrder = document.getElementById("searchOrder");
const statusFilter = document.getElementById("statusFilter");

const totalOrders = document.getElementById("totalOrders");
const pendingOrders = document.getElementById("pendingOrders");
const shippingOrders = document.getElementById("shippingOrders");
const completedOrders = document.getElementById("completedOrders");

const orderDetailBox = document.getElementById("orderDetailBox");
const orderDetailForm = document.getElementById("orderDetailForm");
const orderDetailContent = document.getElementById("orderDetailContent");

let ordersData = [];
let currentDetailOrderId = "";

const ORDER_STATUS_FLOW = {
  "Chờ xác nhận": "Đã xác nhận",
  "Đã xác nhận": "Đang giao",
  "Đang giao": "Đã giao",
  "Đã giao": "Hoàn thành",
};

if (orderDetailForm) {
  orderDetailForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const nextStatus = orderDetailForm.dataset.nextStatus;

    if (!currentDetailOrderId || !nextStatus) return;

    updateOrderStatus(currentDetailOrderId, nextStatus);
  });
}

if (orderDetailBox) {
  orderDetailBox.addEventListener("click", function (e) {
    if (e.target === orderDetailBox) {
      closeOrderDetail();
    }
  });
}

async function loadOrders() {
  try {
    const res = await fetch(API_ORDER);
    const orders = await res.json();

    ordersData = orders;

    if (searchOrder) searchOrder.value = "";
    if (statusFilter) statusFilter.value = "all";

    renderOrders(ordersData);
    renderOrderStats(ordersData);
  } catch (error) {
    orderList.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; color:red;">
          Không thể tải đơn hàng. Hãy kiểm tra backend đã chạy chưa.
        </td>
      </tr>
    `;
  }
}

function renderOrders(orders) {
  orderList.innerHTML = "";

  if (!orders || orders.length === 0) {
    orderList.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;">
          Chưa có đơn hàng nào.
        </td>
      </tr>
    `;
    return;
  }

  orders.forEach((order) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${shortId(order._id)}</td>
      <td>${order.customerName}</td>
      <td>${order.phone}</td>
      <td>${order.address}</td>
      <td>${Number(order.totalPrice).toLocaleString()}đ</td>
      <td>${formatDate(order.createdAt)}</td>
      <td>
        <span class="status ${getStatusClass(order.status)}">
          ${order.status}
        </span>
      </td>
      <td>${getPaymentActionHTML(order)}</td>
      <td>
        <button class="btn btn-dark" onclick="showOrderDetail('${order._id}')">
          Xem
        </button>
      </td>
    `;

    orderList.appendChild(tr);
  });
}

function renderOrderStats(orders) {
  const total = orders.length;

  const pending = orders.filter(
    (order) => order.status === "Chờ xác nhận",
  ).length;

  const shipping = orders.filter(
    (order) => order.status === "Đang giao",
  ).length;

  const completed = orders.filter(
    (order) => order.status === "Hoàn thành",
  ).length;

  totalOrders.innerText = total;
  pendingOrders.innerText = pending;
  shippingOrders.innerText = shipping;
  completedOrders.innerText = completed;
}

function getNextStatus(order) {
  const nextStatus = ORDER_STATUS_FLOW[order.status];

  if (nextStatus === "Hoàn thành" && !isOrderPaid(order)) {
    return "";
  }

  return nextStatus || "";
}

function isOrderPaid(order) {
  return (
    order.paymentStatus === "Đã thanh toán" || order.status === "Hoàn thành"
  );
}

function getPaymentActionHTML(order) {
  if (isOrderPaid(order)) {
    return `<span class="payment-status paid">Đã thanh toán</span>`;
  }

  if (order.status === "Đã giao") {
    return `
      <button class="btn btn-green" onclick="markOrderPaid('${order._id}')">
        Đánh dấu thanh toán
      </button>
    `;
  }

  return `<span class="payment-status unpaid">Chưa thanh toán</span>`;
}

async function updateOrderStatus(orderId, newStatus) {
  const confirmUpdate = confirm(
    `Bạn có chắc muốn cập nhật đơn hàng sang trạng thái "${newStatus}" không?`,
  );

  if (!confirmUpdate) return;

  try {
    const res = await fetch(`${API_ORDER}/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
      closeOrderDetail();
      loadOrders();
    }
  } catch (error) {
    alert("Lỗi khi cập nhật trạng thái đơn hàng");
  }
}

async function markOrderPaid(orderId) {
  const confirmPayment = confirm(
    "Bạn có chắc muốn đánh dấu đơn hàng này đã thanh toán không?",
  );

  if (!confirmPayment) return;

  try {
    const res = await fetch(`${API_ORDER}/${orderId}/payment`, {
      method: "PUT",
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
      loadOrders();
    }
  } catch (error) {
    alert("Lỗi khi đánh dấu thanh toán");
  }
}

function showOrderDetail(orderId) {
  const order = ordersData.find((item) => item._id === orderId);

  if (!order) {
    alert("Không tìm thấy đơn hàng");
    return;
  }

  currentDetailOrderId = order._id;
  const nextStatus = getNextStatus(order);
  orderDetailForm.dataset.nextStatus = nextStatus;

  const productsHTML = order.products
    .map((product) => {
      return `
        <div class="order-product-item">
          <img src="${product.image || "/Frontend/img/logo.jpg"}" alt="${product.name}" />

          <div>
            <h4>${product.name}</h4>
            <p>Thương hiệu: ${product.brand}</p>
            <p>Size: ${product.size}</p>
            <p>Số lượng: ${product.quantity}</p>
            <p>Giá: ${Number(product.price).toLocaleString()}đ</p>
            <p>Thành tiền: ${(product.price * product.quantity).toLocaleString()}đ</p>
          </div>
        </div>
      `;
    })
    .join("");

  orderDetailContent.innerHTML = `
    <div class="order-detail-grid">
      <div class="order-info-box">
        <h3>Thông tin đơn hàng</h3>

        <div class="order-form-field">
          <label>Mã đơn</label>
          <input type="text" value="${order._id}" readonly />
        </div>

        <div class="order-form-field">
          <label>Khách hàng</label>
          <input type="text" value="${order.customerName}" readonly />
        </div>

        <div class="order-form-field">
          <label>Số điện thoại</label>
          <input type="text" value="${order.phone}" readonly />
        </div>

        <div class="order-form-field">
          <label>Địa chỉ</label>
          <textarea readonly>${order.address}</textarea>
        </div>

        <div class="order-form-field">
          <label>Ngày đặt</label>
          <input type="text" value="${formatDate(order.createdAt)}" readonly />
        </div>

        <div class="order-form-field">
          <label>Trạng thái hiện tại</label>
          <span class="status ${getStatusClass(order.status)}">
            ${order.status}
          </span>
        </div>

        <div class="order-form-field">
          <label>Thanh toán</label>
          ${
            isOrderPaid(order)
              ? `<span class="payment-status paid">Đã thanh toán</span>`
              : `<span class="payment-status unpaid">Chưa thanh toán</span>`
          }
        </div>

        <div class="order-form-field">
          <label>Bước tiếp theo</label>
          ${getNextStatusHTML(order, nextStatus)}
        </div>

        <div class="order-total-row">
          Tổng tiền: ${Number(order.totalPrice).toLocaleString()}đ
        </div>
      </div>

      <div class="order-products-box">
        <h3>Sản phẩm trong đơn</h3>
        ${productsHTML}
      </div>
    </div>

    <div class="order-detail-actions">
      ${getDetailSubmitHTML(nextStatus)}
      <button type="button" class="btn btn-dark" onclick="closeOrderDetail()">
        Đóng
      </button>
    </div>
  `;

  orderDetailBox.classList.add("show");
}

function closeOrderDetail() {
  orderDetailBox.classList.remove("show");
  currentDetailOrderId = "";
  delete orderDetailForm.dataset.nextStatus;
  orderDetailContent.innerHTML = "";
}

function getNextStatusHTML(order, nextStatus) {
  if (nextStatus) {
    return `<span class="next-status-pill">${nextStatus}</span>`;
  }

  if (order.status === "Đã giao" && !isOrderPaid(order)) {
    return `
      <p class="order-step-note">
        Cần đánh dấu thanh toán ở bảng danh sách trước khi cập nhật sang Hoàn thành.
      </p>
    `;
  }

  return `<p class="order-step-note">Không còn bước cập nhật tiếp theo.</p>`;
}

function getDetailSubmitHTML(nextStatus) {
  if (!nextStatus) return "";

  return `
    <button type="submit" class="btn btn-red">
      Cập nhật sang ${nextStatus}
    </button>
  `;
}

function filterOrders() {
  const keyword = searchOrder.value.toLowerCase().trim();
  const status = statusFilter.value;

  let filteredOrders = ordersData;

  if (keyword) {
    filteredOrders = filteredOrders.filter((order) => {
      return (
        order.customerName.toLowerCase().includes(keyword) ||
        order.phone.toLowerCase().includes(keyword) ||
        order.address.toLowerCase().includes(keyword) ||
        order._id.toLowerCase().includes(keyword)
      );
    });
  }

  if (status !== "all") {
    filteredOrders = filteredOrders.filter((order) => order.status === status);
  }

  renderOrders(filteredOrders);
}

function shortId(id) {
  if (!id) return "";
  return "DH" + id.slice(-6).toUpperCase();
}

function formatDate(dateString) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "";
  }

  return (
    date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN")
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Chờ xác nhận":
      return "pending";

    case "Đã xác nhận":
      return "success";

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

loadOrders();
