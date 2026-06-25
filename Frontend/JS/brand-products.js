const API_PRODUCT = "/api/products";
const API_CART = "/api/cart";

const brandProductsGrid = document.getElementById("brandProductsGrid");
const noProducts = document.getElementById("noProducts");
const searchInput = document.getElementById("searchInput");
const sizeCheckboxes = document.querySelectorAll(".size-checkbox");
const availableOnly = document.getElementById("availableOnly");
const sortProducts = document.getElementById("sortProducts");
const brandProductCount = document.getElementById("brandProductCount");

let brandProducts = [];

function getProductSizeStock(product) {
  return product && Array.isArray(product.sizeStock) ? product.sizeStock : [];
}

function getProductTotalQuantity(product) {
  const sizeStock = getProductSizeStock(product);
  return sizeStock.length > 0
    ? sizeStock.reduce((total, item) => total + Number(item.quantity || 0), 0)
    : Number(product.quantity || 0);
}

function getAvailableSizes(product) {
  return getProductSizeStock(product).filter(
    (item) => Number(item.quantity) > 0,
  );
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

async function loadBrandProducts() {
  if (!brandProductsGrid) return;

  try {
    const brand = brandProductsGrid.dataset.brand;
    const res = await fetch(API_PRODUCT);

    if (!res.ok) throw new Error("Không thể tải sản phẩm");

    const products = await res.json();

    brandProducts = products.filter((product) => {
      return (
        product.brand &&
        product.brand.toLowerCase() === String(brand).toLowerCase()
      );
    });

    filterBrandProducts();
  } catch (error) {
    brandProductsGrid.innerHTML = `
      <div class="product-load-error" style="grid-column: 1 / -1; display: block;">
        Không thể tải sản phẩm. Hãy kiểm tra server backend.
      </div>
    `;
  }
}

function renderBrandProducts(products) {
  brandProductsGrid.innerHTML = "";

  if (brandProductCount) {
    brandProductCount.innerText = products.length;
  }

  if (!products || products.length === 0) {
    if (noProducts) noProducts.style.display = "block";
    return;
  }

  if (noProducts) noProducts.style.display = "none";

  products.forEach((product) => {
    const card = document.createElement("article");
    const productName = product.name || "Sản phẩm TAF Soccer";
    const brandName = product.brand || "TAF Soccer";
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

    brandProductsGrid.appendChild(card);
  });
}

function filterBrandProducts() {
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedSizes = getCheckedValues(sizeCheckboxes);
  const sortValue = sortProducts ? sortProducts.value : "default";

  let filteredProducts = [...brandProducts];

  if (selectedSizes.length > 0) {
    filteredProducts = filteredProducts.filter((product) =>
      hasSelectedSize(product, selectedSizes),
    );
  }

  if (keyword !== "") {
    filteredProducts = filteredProducts.filter((product) => {
      const productName = product.name || "";
      const brandName = product.brand || "";

      return (
        productName.toLowerCase().includes(keyword) ||
        brandName.toLowerCase().includes(keyword)
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

  renderBrandProducts(filteredProducts);
}

function resetBrandProductFilters() {
  if (searchInput) searchInput.value = "";

  sizeCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  if (availableOnly) availableOnly.checked = false;
  if (sortProducts) sortProducts.value = "default";

  renderBrandProducts(brandProducts);
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

  const product = brandProducts.find((item) => item._id === id);

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
  searchInput.addEventListener("input", filterBrandProducts);
}

sizeCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", filterBrandProducts);
});

if (availableOnly) {
  availableOnly.addEventListener("change", filterBrandProducts);
}

if (sortProducts) {
  sortProducts.addEventListener("change", filterBrandProducts);
}

loadBrandProducts();
