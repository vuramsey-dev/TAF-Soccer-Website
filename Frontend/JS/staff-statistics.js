const API_STATISTICS = "/api/statistics"; // Dùng đường dẫn tương đối để không bị lỗi khi deploy

const statisticsType = document.getElementById("statisticsType");
const statisticsTitle = document.getElementById("statisticsTitle");
const statisticsCanvas = document.getElementById("statisticsCanvas");
const statisticsHead = document.getElementById("statisticsHead");
const statisticsBody = document.getElementById("statisticsBody");
let chart = null;
let statisticsData = null;

function formatCurrency(value) {
  return Number(value || 0).toLocaleString() + "đ";
}

function getApiStatisticsType(type) {
  switch (type) {
    case "best":
      return "best-products";
    case "worst":
      return "worst-products";
    default:
      return type;
  }
}

function getPastDayLabels(totalDays) {
  const labels = [];
  const now = new Date();

  for (let i = totalDays - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(now.getDate() - i);
    labels.push(`${day.getDate()}/${day.getMonth() + 1}`);
  }

  return labels;
}

function normalizeRevenueData(type, data) {
  if (type !== "30days") return data;

  const dataByLabel = new Map(
    data.map((item) => [item.label, Number(item.revenue || 0)]),
  );

  return getPastDayLabels(30).map((label) => ({
    label,
    revenue: dataByLabel.get(label) || 0,
  }));
}

async function loadStatistics() {
  try {
    const selectedType = statisticsType.value;
    const type = getApiStatisticsType(selectedType);

    const res = await fetch(`${API_STATISTICS}/${type}`);
    const data = await res.json();
    statisticsData = normalizeRevenueData(selectedType, data);
    renderStatistics();
  } catch (error) {
    console.error(error);
    alert("Không tải được dữ liệu thống kê từ MongoDB");
  }
}

function renderStatistics() {
  if (!statisticsData) return;
  const type = statisticsType.value;

  statisticsHead.innerHTML = "";
  statisticsBody.innerHTML = "";

  if (["today", "7days", "30days", "1year"].includes(type)) {
    renderRevenue(type);
  } else {
    renderProduct(type);
  }
}

function renderRevenue(type) {
  let title = "";
  if (type === "today") title = "Doanh thu hôm nay";
  if (type === "7days") title = "Doanh thu 7 ngày gần nhất";
  if (type === "30days") title = "Doanh thu 30 ngày gần nhất";
  if (type === "1year") title = "Doanh thu 1 năm gần nhất";

  statisticsTitle.innerText = title;

  const labels = statisticsData.map((item) => item.label);
  const revenues = statisticsData.map((item) => item.revenue);

  if (chart) chart.destroy();

  chart = new Chart(statisticsCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: revenues,
          backgroundColor: "#e60012", // Đổi sang màu đỏ chủ đạo của TAF Soccer
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: type === "30days" ? 60 : 0,
            minRotation: type === "30days" ? 60 : 0,
            font: {
              size: type === "30days" ? 10 : 12,
            },
          },
        },
        y: { beginAtZero: true },
      },
    },
  });

  statisticsHead.innerHTML = `<tr><th>Thời gian</th><th>Doanh thu</th></tr>`;
  statisticsBody.innerHTML = "";
  statisticsData.forEach((item) => {
    statisticsBody.innerHTML += `
      <tr>
        <td>${item.label}</td>
        <td style="color: #e60012; font-weight: bold;">${formatCurrency(item.revenue)}</td>
      </tr>
    `;
  });
}

function renderProduct(type) {
  const title =
    type === "best" ? "Sản phẩm bán chạy nhất" : "Sản phẩm bán chậm nhất";
  statisticsTitle.innerText = title;

  if (!statisticsData.length) {
    if (chart) chart.destroy();
    statisticsBody.innerHTML = `<tr><td colspan="2" class="empty-text">Chưa có dữ liệu</td></tr>`;
    return;
  }

  // --- BỔ SUNG: VẼ BIỂU ĐỒ CHO SẢN PHẨM ---
  const labels = statisticsData.map((item) => item.name);
  const quantities = statisticsData.map((item) => item.quantity);

  if (chart) chart.destroy();

  chart = new Chart(statisticsCanvas, {
    type: "bar", // Dùng biểu đồ cột ngang cho dễ đọc tên sản phẩm dài
    data: {
      labels,
      datasets: [
        {
          label: "Số lượng bán ra",
          data: quantities,
          backgroundColor: type === "best" ? "#00c896" : "#f39c12", // Xanh cho bán chạy, cam cho bán chậm
          borderRadius: 8,
        },
      ],
    },
    options: {
      indexAxis: "y", // Chuyển thành biểu đồ cột ngang
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { beginAtZero: true } },
    },
  });

  // Render Bảng
  statisticsHead.innerHTML = `<tr><th>Tên sản phẩm</th><th>Số lượng bán</th></tr>`;
  statisticsBody.innerHTML = "";
  statisticsData.forEach((item) => {
    statisticsBody.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td style="font-weight: bold;">${item.quantity}</td>
      </tr>
    `;
  });
}

async function loadSummary() {
  try {
    const res = await fetch(`${API_STATISTICS}/summary/data`);
    const data = await res.json();

    document.getElementById("totalRevenueCard").innerText = formatCurrency(
      data.totalRevenue,
    );
    document.getElementById("todayRevenueCard").innerText = formatCurrency(
      data.todayRevenue,
    );
    document.getElementById("totalOrdersCard").innerText = data.totalOrders;
    document.getElementById("totalProductsCard").innerText = data.totalProducts;
    document.getElementById("inventoryValueCard").innerText = formatCurrency(
      data.totalInventoryValue,
    );
    document.getElementById("largestOrderCard").innerText = formatCurrency(
      data.largestOrder,
    );
    document.getElementById("smallestOrderCard").innerText = formatCurrency(
      data.smallestOrder,
    );
    document.getElementById("averageOrderCard").innerText = formatCurrency(
      data.averageOrder,
    );
    document.getElementById("yearRevenueCard").innerText = formatCurrency(
      data.yearRevenue,
    );
  } catch (error) {
    console.error("Lỗi Summary:", error);
  }
}

statisticsType.addEventListener("change", loadStatistics);
document.getElementById("exportBtn").addEventListener("click", () => {
  const type = getApiStatisticsType(statisticsType.value);
  window.open(`${API_STATISTICS}/export/${type}`);
});

// Khởi chạy
loadSummary();
loadStatistics();
