const API_PRODUCT = "https://taf-soccer-website-1.onrender.com/api/products";
const API_WORST_SELLERS =
  "https://taf-soccer-website-1.onrender.com/api/statistics/worst-products";

const saleProductsGrid = document.getElementById("saleProductsGrid");
const noSaleProducts = document.getElementById("noSaleProducts");
const searchInput = document.getElementById("searchInput");
const brandCheckboxes = document.querySelectorAll(".brand-checkbox");
const sizeCheckboxes = document.querySelectorAll(".size-checkbox");
const saleProductCount = document.getElementById("saleProductCount");
const availableOnly = document.getElementById("availableOnly");
const sortProducts = document.getElementById("sortProducts");

let allSaleProducts = []; // Lưu trữ 10 sản phẩm ế để làm nguồn gốc lọc

async function loadSaleProducts() {
  try {
    const prodRes = await fetch(API_PRODUCT);
    if (!prodRes.ok) throw new Error("Không tải được sản phẩm");
    const allProducts = await prodRes.json();

    const statRes = await fetch(API_WORST_SELLERS);
    const worstSellers = statRes.ok ? await statRes.json() : [];

    // Tìm 10 sản phẩm ế nhất
    const productsWithSales = allProducts.map((product) => {
      const statData = worstSellers.find((item) => item.name === product.name);
      return {
        ...product,
        soldQuantity: statData ? statData.quantity : 0,
      };
    });

    productsWithSales.sort((a, b) => a.soldQuantity - b.soldQuantity);
    const top10 = productsWithSales.slice(0, 10);

    // Tính toán trước giá Sale 30% để bộ lọc Sắp xếp giá hoạt động chuẩn
    allSaleProducts = top10.map((product) => {
      const oldPrice = Number(product.price || 0);
      return {
        ...product,
        oldPrice: oldPrice,
        price: oldPrice - (oldPrice * 30) / 100, // Ghi đè giá thành giá mới giảm 30%
      };
    });

    // Sau khi tải xong dữ liệu thì gọi hàm lọc để hiển thị
    filterSaleProducts();
  } catch (error) {
    console.error("Lỗi:", error);
    if (saleProductsGrid) {
      saleProductsGrid.innerHTML = `<p style="color: red; text-align: center; width: 100%;">Lỗi tải dữ liệu Khuyến mãi.</p>`;
    }
  }
}

// Hàm hỗ trợ đọc số lượng tồn kho theo size
function getProductSizeStock(product) {
  return product && Array.isArray(product.sizeStock) ? product.sizeStock : [];
}

function getProductTotalQuantity(product) {
  const sizeStock = getProductSizeStock(product);
  const totalBySize = sizeStock.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );
  return sizeStock.length > 0 ? totalBySize : Number(product.quantity || 0);
}

// BỘ LỌC SẢN PHẨM KHUYẾN MÃI
function filterSaleProducts() {
  let filtered = [...allSaleProducts];

  // 1. Lọc theo từ khóa tìm kiếm
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (keyword) {
    filtered = filtered.filter((product) =>
      (product.name || "").toLowerCase().includes(keyword),
    );
  }

  // 2. Lọc theo thương hiệu
  const selectedBrands = Array.from(brandCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value.toLowerCase());

  if (selectedBrands.length > 0) {
    filtered = filtered.filter((product) =>
      selectedBrands.includes((product.brand || "TAF Soccer").toLowerCase()),
    );
  }

  // 3. Lọc theo size
  const selectedSizes = Array.from(sizeCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => Number(cb.value));

  if (selectedSizes.length > 0) {
    filtered = filtered.filter((product) => {
      const sizeStock = getProductSizeStock(product);
      return selectedSizes.some((size) =>
        sizeStock.some(
          (stockItem) =>
            Number(stockItem.size) === size && Number(stockItem.quantity) > 0,
        ),
      );
    });
  }

  // 4. Lọc chỉ hiện sản phẩm còn hàng
  if (availableOnly && availableOnly.checked) {
    filtered = filtered.filter(
      (product) => getProductTotalQuantity(product) > 0,
    );
  }

  // 5. Sắp xếp giá trị
  const sortValue = sortProducts ? sortProducts.value : "default";
  if (sortValue === "price-asc") {
    filtered.sort((a, b) => a.price - b.price); // Sắp xếp theo giá Sale mới
  } else if (sortValue === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  renderSaleProducts(filtered);
}

// RENDER GIAO DIỆN SẢN PHẨM
function renderSaleProducts(products) {
  if (!saleProductsGrid) return;
  saleProductsGrid.innerHTML = "";

  // Cập nhật số lượng đếm
  if (saleProductCount) saleProductCount.innerText = products.length;

  if (!products || products.length === 0) {
    if (noSaleProducts) noSaleProducts.style.display = "block";
    return;
  }

  if (noSaleProducts) noSaleProducts.style.display = "none";

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card all-product-card";

    const productName = product.name || "Sản phẩm TAF Soccer";
    const oldPrice = product.oldPrice; // Giá chưa giảm
    const newPrice = product.price; // Giá đã giảm 30%

    card.innerHTML = `
      <div class="all-product-image">
        <span class="product-brand-badge" style="background: #e60012; color: #fff; box-shadow: 0 4px 10px rgba(230,0,18,0.3);">
          SALE -30%
        </span>
        <img
          src="${product.image || "/Frontend/img/logo.jpg"}"
          alt="${productName}"
          onerror="this.src='/Frontend/img/logo.jpg'"
        />
      </div>

      <div class="product-info">
        <h3 class="product-title">${productName}</h3>
        
        <div style="margin-top: auto; margin-bottom: 20px;">
          <span style="text-decoration: line-through; color: #888; font-size: 15px; margin-right: 12px;">
            ${oldPrice.toLocaleString()}đ
          </span>
          <span class="price" style="color: #e60012; font-size: 22px; font-weight: 900;">
            ${newPrice.toLocaleString()}đ
          </span>
        </div>
        
        <div class="product-buttons">
          <button onclick="viewProductDetail('${product._id}')">Săn Ưu Đãi Ngay</button>
        </div>
      </div>
    `;

    saleProductsGrid.appendChild(card);
  });
}

function resetAllProductFilters() {
  if (searchInput) searchInput.value = "";
  brandCheckboxes.forEach((cb) => (cb.checked = false));
  sizeCheckboxes.forEach((cb) => (cb.checked = false));
  if (availableOnly) availableOnly.checked = false;
  if (sortProducts) sortProducts.value = "default";
  filterSaleProducts();
}

function viewProductDetail(id) {
  localStorage.setItem("selectedProductId", id);
  window.location.href = "/Frontend/user/product-detail.html";
}

// Bắt sự kiện Lọc khi người dùng thao tác
if (searchInput) searchInput.addEventListener("input", filterSaleProducts);
brandCheckboxes.forEach((cb) =>
  cb.addEventListener("change", filterSaleProducts),
);
sizeCheckboxes.forEach((cb) =>
  cb.addEventListener("change", filterSaleProducts),
);
if (availableOnly) availableOnly.addEventListener("change", filterSaleProducts);
if (sortProducts) sortProducts.addEventListener("change", filterSaleProducts);

if (saleProductsGrid) {
  loadSaleProducts();
}
