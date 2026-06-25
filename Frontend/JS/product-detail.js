const API_PRODUCT = "https://taf-soccer-website-1.onrender.com/api/products";
const API_CART = "https://taf-soccer-website-1.onrender.com/api/cart";
const API_WORST_SELLERS =
  "https://taf-soccer-website-1.onrender.com/api/statistics/worst-products";
const API_BEST_SELLERS =
  "https://taf-soccer-website-1.onrender.com/api/statistics/best-products"; // Thêm API hàng bán chạy

const productDetail = document.getElementById("productDetail");
const productDescriptionSection = document.getElementById(
  "productDescriptionSection",
);
const relatedProductsSection = document.getElementById(
  "relatedProductsSection",
);

let currentProduct = null;
let selectedSize = null;
let saleProductNames = [];
let featuredProductsMap = {}; // Lưu trữ Top 10 và Rank của chúng

function getSelectedProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || localStorage.getItem("selectedProductId");
}

function getProductSizeStock(product) {
  return product && Array.isArray(product.sizeStock) ? product.sizeStock : [];
}

function getProductTotalQuantity(product) {
  const totalBySize = getProductSizeStock(product).reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);
  return totalBySize > 0 ? totalBySize : Number(product.quantity || 0);
}

function getSelectedSizeInfo() {
  return getProductSizeStock(currentProduct).find(
    (item) => Number(item.size) === Number(selectedSize),
  );
}

function getProductDescription(product) {
  return (
    product.description ||
    "Sản phẩm giày bóng đá chất lượng, phù hợp cho thi đấu và tập luyện."
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

function hideRelatedProducts() {
  if (relatedProductsSection) {
    relatedProductsSection.innerHTML = "";
    relatedProductsSection.style.display = "none";
  }
}

function hideProductDescription() {
  if (productDescriptionSection) {
    productDescriptionSection.innerHTML = "";
    productDescriptionSection.style.display = "none";
  }
}

function renderProductDescription(product) {
  if (!productDescriptionSection) return;
  productDescriptionSection.style.display = "block";
  productDescriptionSection.innerHTML = `
    <div class="detail-description-header">
      <span>Mô tả sản phẩm</span>
      <h2>${product.name}</h2>
    </div>
    <div class="detail-description-content">
      <p>${getProductDescription(product)}</p>
    </div>
  `;
}

// Hàm mới: Quét hàng Sale 30% và Hàng Top 10 (Giảm 10%)
async function loadSaleData() {
  try {
    const prodRes = await fetch(API_PRODUCT);
    if (!prodRes.ok) return;
    const allProducts = await prodRes.json();

    // 1. Quét hàng Ế (Sale 30%)
    const worstRes = await fetch(API_WORST_SELLERS);
    const worstSellers = worstRes.ok ? await worstRes.json() : [];
    const productsWithWorst = allProducts.map((p) => {
      const statData = worstSellers.find((item) => item.name === p.name);
      return { ...p, soldQuantity: statData ? statData.quantity : 0 };
    });
    productsWithWorst.sort((a, b) => a.soldQuantity - b.soldQuantity);
    saleProductNames = productsWithWorst
      .slice(0, 10)
      .map((p) => p.name)
      .filter(Boolean);

    // 2. Quét hàng Bán Chạy (Top 10 - Giảm 10%)
    const bestRes = await fetch(API_BEST_SELLERS);
    const bestSellers = bestRes.ok ? await bestRes.json() : [];
    const productsWithBest = allProducts.map((p) => {
      const statData = bestSellers.find((item) => item.name === p.name);
      return { ...p, soldQuantity: statData ? statData.quantity : 0 };
    });
    productsWithBest.sort((a, b) => b.soldQuantity - a.soldQuantity); // Sắp xếp giảm dần
    const top10Best = productsWithBest.slice(0, 10);

    top10Best.forEach((p, index) => {
      if (p.name) featuredProductsMap[p.name] = index + 1; // Lưu Top 1, 2, 3...
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu ưu đãi:", error);
  }
}

async function loadRelatedProducts(product) {
  if (!relatedProductsSection || !product) return;
  try {
    const res = await fetch(API_PRODUCT);
    if (!res.ok) throw new Error("Không thể tải sản phẩm cùng loại");
    const products = await res.json();
    const relatedProducts = products
      .filter(
        (item) =>
          item._id !== product._id &&
          item.brand &&
          product.brand &&
          item.brand.toLowerCase() === product.brand.toLowerCase(),
      )
      .slice(0, 5);
    renderRelatedProducts(relatedProducts, product.brand);
  } catch (error) {
    hideRelatedProducts();
  }
}

function renderRelatedProducts(products, brandName) {
  if (!relatedProductsSection) return;
  if (!products || products.length === 0) {
    hideRelatedProducts();
    return;
  }

  relatedProductsSection.style.display = "block";
  relatedProductsSection.innerHTML = `
    <div class="related-products-header">
      <div>
        <span>Sản phẩm cùng loại</span>
        <h2>Gợi ý ${escapeHtml(brandName || "TAF Soccer")}</h2>
      </div>
      <p>Chọn nhanh mẫu khác cùng thương hiệu với sản phẩm bạn đang xem.</p>
    </div>

    <div class="related-products-grid">
      ${products
        .map((item) => {
          const totalQuantity = getProductTotalQuantity(item);
          const isFeatured = featuredProductsMap[item.name];
          const isSale = !isFeatured && saleProductNames.includes(item.name);
          const oldPrice = Number(item.price || 0);
          let newPrice = oldPrice;

          let priceHtml = `<p>${oldPrice.toLocaleString("vi-VN")}đ</p>`;
          let badgeHtml = `<span>${escapeHtml(item.brand || "TAF Soccer")}</span>`;

          if (isFeatured) {
            newPrice = oldPrice * 0.9;
            let rankBg = "#ffffff";
            let rankColor = "#111111";
            if (isFeatured === 1) {
              rankBg = "#FFD700";
              rankColor = "#000";
            } else if (isFeatured === 2) {
              rankBg = "#C0C0C0";
              rankColor = "#000";
            } else if (isFeatured === 3) {
              rankBg = "#CD7F32";
              rankColor = "#fff";
            }

            badgeHtml += `
              <span style="position: absolute; top: 10px; right: 10px; background: ${rankBg}; color: ${rankColor}; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">TOP ${isFeatured}</span>
              <span style="position: absolute; top: 35px; right: 10px; background: #e60012; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">-10%</span>
            `;
            priceHtml = `<div style="margin: 5px 0;"><span style="text-decoration: line-through; color: #999; font-size: 13px; margin-right: 5px;">${oldPrice.toLocaleString("vi-VN")}đ</span><span style="color: #e60012; font-size: 16px; font-weight: bold;">${newPrice.toLocaleString("vi-VN")}đ</span></div>`;
          } else if (isSale) {
            newPrice = oldPrice * 0.7;
            badgeHtml += `<span style="position: absolute; top: 10px; right: 10px; background: #e60012; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">-30%</span>`;
            priceHtml = `<div style="margin: 5px 0;"><span style="text-decoration: line-through; color: #999; font-size: 13px; margin-right: 5px;">${oldPrice.toLocaleString("vi-VN")}đ</span><span style="color: #e60012; font-size: 16px; font-weight: bold;">${newPrice.toLocaleString("vi-VN")}đ</span></div>`;
          }

          return `
            <article class="related-product-card" onclick="openRelatedProduct('${escapeHtml(item._id)}')">
              <div class="related-product-image" style="position: relative;">
                ${badgeHtml}
                <img src="${escapeHtml(item.image || "/Frontend/img/logo.jpg")}" alt="${escapeHtml(item.name || "")}" onerror="this.src='/Frontend/img/logo.jpg'" />
              </div>
              <div class="related-product-info">
                <h3>${escapeHtml(item.name || "Sản phẩm TAF Soccer")}</h3>
                ${priceHtml}
                <small>${totalQuantity > 0 ? `Còn ${totalQuantity} đôi` : "Tạm hết hàng"}</small>
                <button type="button" class="related-product-btn">Xem chi tiết</button>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function updateStockInfo(sizeInfo) {
  const stockInfo = document.getElementById("detailStockInfo");
  if (!stockInfo || !currentProduct) return;
  if (sizeInfo) {
    stockInfo.innerHTML = `<strong>Số lượng size ${sizeInfo.size} còn:</strong> ${sizeInfo.quantity}`;
    return;
  }
  stockInfo.innerHTML = `<strong>Tổng số lượng còn:</strong> ${getProductTotalQuantity(currentProduct)}`;
}

async function loadProductDetail() {
  const selectedProductId = getSelectedProductId();
  if (!selectedProductId) {
    hideProductDescription();
    hideRelatedProducts();
    productDetail.innerHTML = `<div class="detail-error"><h2>Không tìm thấy sản phẩm</h2><a href="/Frontend/user/all-products.html">Quay lại danh sách sản phẩm</a></div>`;
    return;
  }
  try {
    await loadSaleData(); // Đợi load ưu đãi
    const res = await fetch(`${API_PRODUCT}/${selectedProductId}`);
    const product = await res.json();
    if (!res.ok) {
      hideProductDescription();
      hideRelatedProducts();
      productDetail.innerHTML = `<div class="detail-error"><h2>${product.message || "Sản phẩm không tồn tại"}</h2><a href="/Frontend/user/all-products.html">Quay lại danh sách sản phẩm</a></div>`;
      return;
    }
    currentProduct = product;
    localStorage.setItem("selectedProductId", product._id);
    renderProductDetail(product);
    renderProductDescription(product);
    loadRelatedProducts(product);
  } catch (error) {
    hideProductDescription();
    hideRelatedProducts();
    productDetail.innerHTML = `<div class="detail-error"><h2>Không thể tải chi tiết sản phẩm</h2><p>Hãy kiểm tra backend đã chạy chưa.</p></div>`;
  }
}

function openRelatedProduct(id) {
  localStorage.setItem("selectedProductId", id);
  window.location.href = `/Frontend/user/product-detail.html?id=${encodeURIComponent(id)}`;
}

function renderProductDetail(product) {
  const sizeStock = getProductSizeStock(product);
  selectedSize = null;

  const isFeatured = featuredProductsMap[product.name];
  const isSale = !isFeatured && saleProductNames.includes(product.name);
  const oldPrice = Number(product.price);
  let newPrice = oldPrice;

  let priceHtml = `<p class="detail-price">${oldPrice.toLocaleString()}đ</p>`;
  let badgeHtml = ``;

  if (isFeatured) {
    newPrice = oldPrice * 0.9;
    let rankBg = "#ffffff";
    let rankColor = "#111111";
    if (isFeatured === 1) {
      rankBg = "#FFD700";
      rankColor = "#000";
    } else if (isFeatured === 2) {
      rankBg = "#C0C0C0";
      rankColor = "#000";
    } else if (isFeatured === 3) {
      rankBg = "#CD7F32";
      rankColor = "#fff";
    }

    badgeHtml = `
      <span class="product-brand-badge" style="position: absolute; top: 15px; left: 15px; background: ${rankBg}; color: ${rankColor}; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">TOP ${isFeatured}</span>
      <span class="product-brand-badge" style="position: absolute; top: 15px; right: 15px; background: #e60012; color: #fff; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; z-index: 10;">-10%</span>
    `;
    priceHtml = `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;"><span style="text-decoration: line-through; color: #999; font-size: 18px;">${oldPrice.toLocaleString()}đ</span><span class="detail-price" style="color: #e60012; font-size: 26px; font-weight: bold; margin: 0;">${newPrice.toLocaleString()}đ</span></div>`;
  } else if (isSale) {
    newPrice = oldPrice * 0.7;
    badgeHtml = `<span class="product-brand-badge" style="position: absolute; top: 15px; left: 15px; background: #e60012; color: #fff; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; z-index: 10;">SALE -30%</span>`;
    priceHtml = `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;"><span style="text-decoration: line-through; color: #999; font-size: 18px;">${oldPrice.toLocaleString()}đ</span><span class="detail-price" style="color: #e60012; font-size: 26px; font-weight: bold; margin: 0;">${newPrice.toLocaleString()}đ</span></div>`;
  }

  productDetail.innerHTML = `
    <div class="detail-image" style="position: relative;">
      ${badgeHtml}
      <img src="${product.image || "/Frontend/img/logo.jpg"}" alt="${product.name}" />
    </div>
    <div class="detail-info">
      <span class="detail-brand">${product.brand}</span>
      <h2>${product.name}</h2>
      ${priceHtml}
      <div class="detail-meta">
        <p><strong>Thương hiệu:</strong> ${product.brand}</p>
        <p id="detailStockInfo"><strong>Tổng số lượng còn:</strong> ${getProductTotalQuantity(product)}</p>
      </div>
      <div class="detail-size-box">
        <h3>Chọn size</h3>
        <div class="detail-size-list">
          ${sizeStock
            .filter((item) => item.quantity > 0)
            .map(
              (item) =>
                `<button type="button" class="detail-size-btn" onclick="chooseSize(${item.size}, this)">${item.size}</button>`,
            )
            .join("")}
        </div>
      </div>
      <div class="detail-quantity-box">
        <h3>Số lượng</h3>
        <div class="quantity-control">
          <button type="button" onclick="changeQuantity(-1)">-</button>
          <input type="number" id="buyQuantity" value="1" min="1" readonly />
          <button type="button" onclick="changeQuantity(1)">+</button>
        </div>
      </div>
      <div class="detail-actions">
        <button class="add-cart-btn" onclick="addDetailToCart()">Thêm vào giỏ hàng</button>
        <a href="/Frontend/user/all-products.html" class="back-btn">Quay lại sản phẩm</a>
      </div>
    </div>
  `;
}

function chooseSize(size, button) {
  selectedSize = size;
  document
    .querySelectorAll(".detail-size-btn")
    .forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
  updateStockInfo(getSelectedSizeInfo());
  const quantityInput = document.getElementById("buyQuantity");
  if (quantityInput) quantityInput.value = 1;
}

function changeQuantity(number) {
  const quantityInput = document.getElementById("buyQuantity");
  let quantity = Number(quantityInput.value);
  if (!selectedSize) {
    alert("Vui lòng chọn size trước");
    return;
  }
  const selectedSizeInfo = getSelectedSizeInfo();
  if (!selectedSizeInfo) {
    alert("Size này không tồn tại");
    return;
  }
  quantity += number;
  if (quantity < 1) quantity = 1;
  if (quantity > selectedSizeInfo.quantity) {
    alert(`Size ${selectedSize} chỉ còn ${selectedSizeInfo.quantity} đôi`);
    quantity = selectedSizeInfo.quantity;
  }
  quantityInput.value = quantity;
}

async function addDetailToCart() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
    window.location.href = "/Frontend/user/login.html";
    return;
  }
  if (user.role !== "user") {
    alert("Chỉ tài khoản khách hàng mới được thêm sản phẩm vào giỏ hàng");
    return;
  }
  if (!currentProduct) {
    alert("Không tìm thấy sản phẩm");
    return;
  }
  if (!selectedSize) {
    alert("Vui lòng chọn size");
    return;
  }
  const selectedSizeInfo = getSelectedSizeInfo();
  if (!selectedSizeInfo) {
    alert("Size này không tồn tại");
    return;
  }
  if (selectedSizeInfo.quantity <= 0) {
    alert("Size này đã hết hàng");
    return;
  }
  const quantity = Number(document.getElementById("buyQuantity").value);
  if (quantity > selectedSizeInfo.quantity) {
    alert(`Size ${selectedSize} chỉ còn ${selectedSizeInfo.quantity} đôi`);
    return;
  }

  const cartData = {
    userId: user.id,
    productId: currentProduct._id,
    size: selectedSize,
    quantity: quantity,
  };

  try {
    const res = await fetch(`${API_CART}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cartData),
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok && window.refreshCartBadge) window.refreshCartBadge();
  } catch (error) {
    alert("Lỗi khi thêm sản phẩm vào giỏ hàng");
  }
}

loadProductDetail();
