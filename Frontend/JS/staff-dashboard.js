const DASHBOARD_ORDER_API =
  "https://taf-soccer-website-1.onrender.com/api/orders";

const dashboardTotalOrders = document.getElementById("dashboardTotalOrders");
const dashboardPendingOrders = document.getElementById(
  "dashboardPendingOrders",
);
const dashboardPaymentOrders = document.getElementById(
  "dashboardPaymentOrders",
);
const dashboardTodayRevenue = document.getElementById("dashboardTodayRevenue");
const latestOrderList = document.getElementById("latestOrderList");

async function loadDashboardOrders() {
  try {
    const res = await fetch(DASHBOARD_ORDER_API);

    if (!res.ok) {
      throw new Error("Không thể tải dữ liệu đơn hàng");
    }

    const orders = await res.json();
    const safeOrders = Array.isArray(orders) ? orders : [];

    renderDashboardStats(safeOrders);
    renderLatestOrders(safeOrders);
  } catch (error) {
    renderDashboardStats([]);

    latestOrderList.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:red;">
          Không thể tải dữ liệu đơn hàng. Hãy kiểm tra backend đã chạy chưa.
        </td>
      </tr>
    `;
  }
}

function renderDashboardStats(orders) {
  const pendingOrders = orders.filter((order) => {
    return order.status === "Chờ xác nhận";
  });

  const paymentOrders = orders.filter((order) => {
    return order.status === "Đã giao" && !isOrderPaid(order);
  });

  const todayRevenue = orders.reduce((total, order) => {
    if (!isOrderPaid(order)) return total;

    const revenueDate = order.paidAt || order.createdAt;

    if (!isToday(revenueDate)) return total;

    return total + Number(order.totalPrice || 0);
  }, 0);

  dashboardTotalOrders.innerText = orders.length;
  dashboardPendingOrders.innerText = pendingOrders.length;
  dashboardPaymentOrders.innerText = paymentOrders.length;
  dashboardTodayRevenue.innerText = formatMoney(todayRevenue);
}

function renderLatestOrders(orders) {
  latestOrderList.innerHTML = "";

  if (orders.length === 0) {
    latestOrderList.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;">
          Chưa có đơn hàng nào.
        </td>
      </tr>
    `;
    return;
  }

  const latestOrders = [...orders]
    .sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 8);

  latestOrders.forEach((order) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${shortId(order._id)}</td>
      <td>${escapeHTML(order.customerName || "")}</td>
      <td>${escapeHTML(order.phone || "")}</td>
      <td>${formatMoney(order.totalPrice)}</td>
      <td>
        <span class="status ${getStatusClass(order.status)}">
          ${escapeHTML(order.status || "Chưa xác định")}
        </span>
      </td>
      <td>${getPaymentStatusHTML(order)}</td>
      <td>${formatDate(order.createdAt)}</td>
    `;

    latestOrderList.appendChild(tr);
  });
}

function isOrderPaid(order) {
  return (
    order.paymentStatus === "Đã thanh toán" || order.status === "Hoàn thành"
  );
}

function getPaymentStatusHTML(order) {
  if (isOrderPaid(order)) {
    return `<span class="payment-status paid">Đã thanh toán</span>`;
  }

  return `<span class="payment-status unpaid">Chưa thanh toán</span>`;
}

function shortId(id) {
  if (!id) return "";
  return "DH" + id.slice(-6).toUpperCase();
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString()}đ`;
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

function isToday(dateString) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
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

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

loadDashboardOrders();
