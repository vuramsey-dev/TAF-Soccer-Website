const API_PRODUCT = "/api/products";
const API_CART = "/api/cart";

const productGrid = document.getElementById("allProductsGrid");
const noProducts = document.getElementById("noProducts");
const searchInput = document.getElementById("searchInput");
const brandCheckboxes = document.querySelectorAll(".brand-checkbox");
const sizeCheckboxes = document.querySelectorAll(".size-checkbox");
const allProductCount = document.getElementById("allProductCount");
const availableOnly = document.getElementById("availableOnly");
const sortProducts = document.getElementById("sortProducts");
const totalProductStat = document.getElementById("totalProductStat");
const totalBrandStat = document.getElementById("totalBrandStat");
const availableProductStat = document.getElementById("availableProductStat");

let allProducts = [];

function getProductSizeStock(product) {
  return product && Array.isArray(product.sizeStock) ? product.sizeStock : [];
}

function getProductTotalQuantity(product) {
  const sizeStock = getProductSizeStock(product);
  const totalBySize = sizeStock.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);

  return sizeStock.length > 0 ? totalBySize : Number(product.quantity || 0);
}

function getAvailableSizes(product) {
  return getProductSizeStock(product).filter(
    (item) => Number(item.quantity) > 0,
  );
}

function getBrandName(product) {
  return product.brand || "TAF Soccer";
}

function getProductName(product) {
  return product.name || "Sản phẩm TAF Soccer";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getBrandSlug(brandName) {
  const normalizedBrand = String(brandName || "").toLowerCase();

  if (normalizedBrand.includes("nike")) return "nike";
  if (normalizedBrand.includes("adidas")) return "adidas";
  if (normalizedBrand.includes("mizuno")) return "mizuno";
  if (normalizedBrand.includes("puma")) return "puma";

  return "taf";
}

function getCheckedValues(checkboxes) {
  return Array.from(checkboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

function getSizePreview(product) {
  const sizes = getAvailableSizes(product)
    .map((item) => item.size)
    .filter(Boolean)
    .slice(0, 4);

  return sizes.length > 0 ? `Size: ${sizes.join(", ")}` : "Size đang cập nhật";
}

function hasSelectedSize(product, selectedSizes) {
  if (selectedSizes.length === 0) return true;

  const availableSizes = getAvailableSizes(product).map((item) =>
    String(item.size),
  );

  return selectedSizes.some((size) => availableSizes.includes(size));
}

function updateProductStats(products) {
  const availableProducts = products.filter(
    (product) => getProductTotalQuantity(product) > 0,
  );
  const brandCount = new Set(
    products.map((product) => getBrandName(product)).filter(Boolean),
  ).size;

  if (totalProductStat) totalProductStat.innerText = products.length;
  if (totalBrandStat) totalBrandStat.innerText = brandCount;
  if (availableProductStat) {
    availableProductStat.innerText = availableProducts.length;
  }
}

async function loadAllProducts() {
  try {
    const res = await fetch(API_PRODUCT);
    if (!res.ok) throw new Error("Không thể tải sản phẩm");

    allProducts = await res.json();
    updateProductStats(allProducts);
    filterAllProducts();
  } catch (error) {
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="product-load-error">
          Không thể tải sản phẩm. Hãy kiểm tra backend đã chạy chưa.
        </div>
      `;
    }
  }
}

function renderProducts(products) {
  if (!productGrid) return;

  productGrid.innerHTML = "";

  if (allProductCount) {
    allProductCount.innerText = products.length;
  }

  if (products.length === 0) {
    if (noProducts) noProducts.style.display = "block";
    return;
  }

  if (noProducts) noProducts.style.display = "none";

  products.forEach((product) => {
    const card = document.createElement("article");
    const productName = getProductName(product);
    const brandName = getBrandName(product);
    const brandSlug = getBrandSlug(brandName);
    const totalQuantity = getProductTotalQuantity(product);
    const isAvailable = totalQuantity > 0;
    const safeProductId = escapeHtml(product._id);

    card.className = `product-card all-product-card brand-${brandSlug}`;

    card.innerHTML = `
      <div class="all-product-image">
        <span class="product-brand-badge brand-badge-${brandSlug}">${escapeHtml(brandName)}</span>
        <span class="product-stock-pill ${isAvailable ? "in-stock" : "out-stock"}">
          ${isAvailable ? "Còn hàng" : "Hết hàng"}
        </span>
        <img
          src="${escapeHtml(product.image || "/Frontend/img/logo.jpg")}"
          alt="${escapeHtml(productName)}"
          onerror="this.src='/Frontend/img/logo.jpg'"
        />
      </div>

      <div class="product-info">
        <p class="catalog-card-brand">${escapeHtml(brandName)}</p>
        <h3 class="product-title">${escapeHtml(productName)}</h3>

        <div class="product-meta-row">
          <span>${escapeHtml(getSizePreview(product))}</span>
          <span>${isAvailable ? `${totalQuantity} đôi` : "Tạm hết"}</span>
        </div>

        <p class="price">${Number(product.price || 0).toLocaleString("vi-VN")}đ</p>

        <div class="product-buttons">
          <button
            type="button"
            class="product-detail-action"
            onclick="viewProductDetail('${safeProductId}')"
          >
            Xem chi tiết
          </button>
          <button
            type="button"
            class="product-cart-action"
            onclick="addToCart('${safeProductId}')"
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    `;

    productGrid.appendChild(card);
  });
}

function filterAllProducts() {
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedBrands = getCheckedValues(brandCheckboxes);
  const selectedSizes = getCheckedValues(sizeCheckboxes);
  const sortValue = sortProducts ? sortProducts.value : "default";

  let filteredProducts = [...allProducts];

  if (selectedBrands.length > 0) {
    filteredProducts = filteredProducts.filter((product) =>
      selectedBrands.some(
        (brand) => brand.toLowerCase() === getBrandName(product).toLowerCase(),
      ),
    );
  }

  if (selectedSizes.length > 0) {
    filteredProducts = filteredProducts.filter((product) =>
      hasSelectedSize(product, selectedSizes),
    );
  }

  if (keyword !== "") {
    filteredProducts = filteredProducts.filter((product) => {
      return (
        getProductName(product).toLowerCase().includes(keyword) ||
        getBrandName(product).toLowerCase().includes(keyword)
      );
    });
  }

  if (availableOnly && availableOnly.checked) {
    filteredProducts = filteredProducts.filter(
      (product) => getProductTotalQuantity(product) > 0,
    );
  }

  if (sortValue === "price-asc") {
    filteredProducts.sort(
      (a, b) => Number(a.price || 0) - Number(b.price || 0),
    );
  }

  if (sortValue === "price-desc") {
    filteredProducts.sort(
      (a, b) => Number(b.price || 0) - Number(a.price || 0),
    );
  }

  renderProducts(filteredProducts);
}

function resetAllProductFilters() {
  if (searchInput) searchInput.value = "";

  brandCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  sizeCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  if (availableOnly) availableOnly.checked = false;
  if (sortProducts) sortProducts.value = "default";

  renderProducts(allProducts);
}

function viewProductDetail(id) {
  localStorage.setItem("selectedProductId", id);
  window.location.href = `/Frontend/user/product-detail.html?id=${encodeURIComponent(id)}`;
}

async function addToCart(id) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
    window.location.href = "/Frontend/user/login.html";
    return;
  }

  if (user.role && user.role !== "user") {
    alert("Chỉ tài khoản khách hàng mới được thêm sản phẩm vào giỏ hàng");
    return;
  }

  const product = allProducts.find((item) => item._id === id);

  if (!product) {
    alert("Không tìm thấy sản phẩm");
    return;
  }

  const availableSizes = getAvailableSizes(product).map((item) => item.size);

  if (availableSizes.length === 0) {
    alert("Sản phẩm này đang tạm hết hàng");
    return;
  }

  const selectedSize = prompt(
    `Chọn size muốn mua: ${availableSizes.join(", ")}`,
  );

  if (!selectedSize) {
    alert("Vui lòng chọn size");
    return;
  }

  if (!availableSizes.includes(Number(selectedSize))) {
    alert("Size này không có trong sản phẩm");
    return;
  }

  const cartData = {
    userId: user.id,
    productId: product._id,
    size: Number(selectedSize),
    quantity: 1,
  };

  try {
    const res = await fetch(`${API_CART}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cartData),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok && window.refreshCartBadge) {
      window.refreshCartBadge();
    }
  } catch (error) {
    alert("Lỗi khi thêm sản phẩm vào giỏ hàng");
  }
}

if (searchInput) {
  searchInput.addEventListener("input", filterAllProducts);
}

brandCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", filterAllProducts);
});

sizeCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", filterAllProducts);
});

if (availableOnly) {
  availableOnly.addEventListener("change", filterAllProducts);
}

if (sortProducts) {
  sortProducts.addEventListener("change", filterAllProducts);
}

loadAllProducts();
