const API_PRODUCT = "http://localhost:3000/api/products";
const API_BEST_SELLERS = "http://localhost:3000/api/statistics/best-products"; // API cho hàng bán chạy

const featuredProductsGrid = document.getElementById("featuredProductsGrid");
const noFeaturedProducts = document.getElementById("noFeaturedProducts");
const searchInput = document.getElementById("searchInput");
const brandCheckboxes = document.querySelectorAll(".brand-checkbox");
const sizeCheckboxes = document.querySelectorAll(".size-checkbox");
const featuredProductCount = document.getElementById("featuredProductCount");
const availableOnly = document.getElementById("availableOnly");
const sortProducts = document.getElementById("sortProducts");

let allFeaturedProducts = [];

async function loadFeaturedProducts() {
  try {
    const prodRes = await fetch(API_PRODUCT);
    if (!prodRes.ok) throw new Error("Không tải được sản phẩm");
    const allProducts = await prodRes.json();

    // Lấy thống kê hàng Bán Chạy Nhất (nếu API này không tồn tại, nó sẽ bắt lỗi nhưng không sập web)
    let bestSellers = [];
    try {
      const statRes = await fetch(API_BEST_SELLERS);
      if (statRes.ok) bestSellers = await statRes.json();
    } catch (e) {
      console.warn("Lỗi tải API Best Sellers");
    }

    const productsWithSales = allProducts.map((product) => {
      const statData = bestSellers.find((item) => item.name === product.name);
      return {
        ...product,
        soldQuantity: statData ? statData.quantity : 0,
      };
    });

    // Sắp xếp Giảm dần (Đứa bán nhiều nhất lên đỉnh)
    productsWithSales.sort((a, b) => b.soldQuantity - a.soldQuantity);
    const top10 = productsWithSales.slice(0, 10);

    // Gắn RANK (Hạng) và giảm giá 10%
    allFeaturedProducts = top10.map((product, index) => {
      const oldPrice = Number(product.price || 0);
      return {
        ...product,
        rank: index + 1,
        oldPrice: oldPrice,
        price: oldPrice - (oldPrice * 10) / 100, // Giảm 10%
      };
    });

    filterFeaturedProducts();
  } catch (error) {
    console.error("Lỗi:", error);
    if (featuredProductsGrid) {
      featuredProductsGrid.innerHTML = `<p style="color: red; text-align: center; width: 100%;">Lỗi tải dữ liệu.</p>`;
    }
  }
}

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

function filterFeaturedProducts() {
  let filtered = [...allFeaturedProducts];

  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (keyword) {
    filtered = filtered.filter((product) =>
      (product.name || "").toLowerCase().includes(keyword),
    );
  }

  const selectedBrands = Array.from(brandCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value.toLowerCase());

  if (selectedBrands.length > 0) {
    filtered = filtered.filter((product) =>
      selectedBrands.includes((product.brand || "TAF Soccer").toLowerCase()),
    );
  }

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

  if (availableOnly && availableOnly.checked) {
    filtered = filtered.filter(
      (product) => getProductTotalQuantity(product) > 0,
    );
  }

  const sortValue = sortProducts ? sortProducts.value : "default";
  if (sortValue === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortValue === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    filtered.sort((a, b) => a.rank - b.rank); // Xếp mặc định theo Top 1 -> 10
  }

  renderFeaturedProducts(filtered);
}

function renderFeaturedProducts(products) {
  if (!featuredProductsGrid) return;
  featuredProductsGrid.innerHTML = "";

  if (featuredProductCount) featuredProductCount.innerText = products.length;

  if (!products || products.length === 0) {
    if (noFeaturedProducts) noFeaturedProducts.style.display = "block";
    return;
  }

  if (noFeaturedProducts) noFeaturedProducts.style.display = "none";

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card all-product-card";

    const productName = product.name || "Sản phẩm TAF Soccer";
    const oldPrice = product.oldPrice;
    const newPrice = product.price;

    // Thiết lập màu Tem Top 1, 2, 3
    let rankBg = "#ffffff";
    let rankColor = "#111111";
    if (product.rank === 1) {
      rankBg = "#FFD700";
      rankColor = "#000";
    } // Vàng
    else if (product.rank === 2) {
      rankBg = "#C0C0C0";
      rankColor = "#000";
    } // Bạc
    else if (product.rank === 3) {
      rankBg = "#CD7F32";
      rankColor = "#fff";
    } // Đồng

    card.innerHTML = `
      <div class="all-product-image">
        <span class="product-brand-badge" style="background: ${rankBg}; color: ${rankColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.15); z-index: 3;">
          TOP ${product.rank}
        </span>
        <span style="position: absolute; top: 12px; right: 12px; background: #e60012; color: #fff; padding: 5px 10px; font-size: 12px; font-weight: bold; border-radius: 6px; z-index: 2;">
          -10%
        </span>
        
        <img src="${product.image || "/Frontend/img/logo.jpg"}" alt="${productName}" onerror="this.src='/Frontend/img/logo.jpg'" />
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
          <button onclick="viewProductDetail('${product._id}')">Xem Chi Tiết</button>
        </div>
      </div>
    `;

    featuredProductsGrid.appendChild(card);
  });
}

function resetAllProductFilters() {
  if (searchInput) searchInput.value = "";
  brandCheckboxes.forEach((cb) => (cb.checked = false));
  sizeCheckboxes.forEach((cb) => (cb.checked = false));
  if (availableOnly) availableOnly.checked = false;
  if (sortProducts) sortProducts.value = "default";
  filterFeaturedProducts();
}

function viewProductDetail(id) {
  localStorage.setItem("selectedProductId", id);
  window.location.href = "/Frontend/user/product-detail.html";
}

if (searchInput) searchInput.addEventListener("input", filterFeaturedProducts);
brandCheckboxes.forEach((cb) =>
  cb.addEventListener("change", filterFeaturedProducts),
);
sizeCheckboxes.forEach((cb) =>
  cb.addEventListener("change", filterFeaturedProducts),
);
if (availableOnly)
  availableOnly.addEventListener("change", filterFeaturedProducts);
if (sortProducts)
  sortProducts.addEventListener("change", filterFeaturedProducts);

if (featuredProductsGrid) {
  loadFeaturedProducts();
}
