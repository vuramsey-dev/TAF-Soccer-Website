const API_CART = "http://localhost:3000/api/cart";
const API_ORDER = "http://localhost:3000/api/orders";
const API_ADDRESS = "http://localhost:3000/api/addresses";
const API_PRODUCT_ALL = "http://localhost:3000/api/products";
const API_WORST_SELLERS = "http://localhost:3000/api/statistics/worst-products";
const API_BEST_SELLERS = "http://localhost:3000/api/statistics/best-products"; // Thêm dòng này

const cartList = document.getElementById("cartList");
const subTotalElement = document.getElementById("subTotal");
const shippingFeeElement = document.getElementById("shippingFee");
const discountElement = document.getElementById("discount");
const grandTotalElement = document.getElementById("grandTotal");
const selectedCountElement = document.getElementById("selectedCount");
const cartActionBtn = document.getElementById("cartActionBtn");
const checkoutFormSection = document.getElementById("checkoutFormSection");
const checkoutForm = document.getElementById("checkoutForm");
const receiverName = document.getElementById("receiverName");
const receiverPhone = document.getElementById("receiverPhone");
const receiverProvince = document.getElementById("receiverProvince");
const receiverWard = document.getElementById("receiverWard");
const receiverDetailAddress = document.getElementById("receiverDetailAddress");
const saveReceiverInfo = document.getElementById("saveReceiverInfo");
const savedReceiverBox = document.getElementById("savedReceiverBox");
const savedReceiverList = document.getElementById("savedReceiverList");

const user = JSON.parse(localStorage.getItem("user"));
const SHIPPING_FEE = 30000;

let cartProducts = [];
let selectedCheckoutProducts = [];
let saleProductNames = [];
let featuredProductsMap = {};

const wardData = {
  "Hà Nội": [
    "Phường Hoàn Kiếm",
    "Phường Ba Đình",
    "Phường Đống Đa",
    "Phường Cầu Giấy",
    "Phường Hà Đông",
    "Xã Quốc Oai",
    "Xã Đông Anh",
    "Xã Gia Lâm",
  ],
  "TP Hồ Chí Minh": [
    "Phường Bến Nghé",
    "Phường Sài Gòn",
    "Phường Tân Định",
    "Phường Bình Thạnh",
    "Phường Thủ Đức",
  ],
  "Đà Nẵng": [
    "Phường Hải Châu",
    "Phường Thanh Khê",
    "Phường Sơn Trà",
    "Phường Ngũ Hành Sơn",
  ],
  "Hải Phòng": [
    "Phường Hồng Bàng",
    "Phường Ngô Quyền",
    "Phường Lê Chân",
    "Phường Kiến An",
  ],
  "Cần Thơ": [
    "Phường Ninh Kiều",
    "Phường Cái Răng",
    "Phường Bình Thủy",
    "Phường Ô Môn",
  ],
  "Thái Nguyên": [
    "Phường Trưng Vương",
    "Phường Quang Trung",
    "Phường Tân Thịnh",
    "Phường Gia Sàng",
    "Xã Tân Cương",
  ],
  "Bắc Ninh": [
    "Phường Suối Hoa",
    "Phường Võ Cường",
    "Phường Kinh Bắc",
    "Xã Tiên Du",
  ],
  "Hưng Yên": [
    "Phường Hiến Nam",
    "Phường An Tảo",
    "Xã Văn Giang",
    "Xã Khoái Châu",
  ],
  "Nam Định": [
    "Phường Vị Xuyên",
    "Phường Trường Thi",
    "Phường Lộc Hạ",
    "Xã Hải Hậu",
  ],
  "Thanh Hóa": [
    "Phường Đông Vệ",
    "Phường Lam Sơn",
    "Phường Ba Đình",
    "Xã Sầm Sơn",
  ],
  "Nghệ An": [
    "Phường Vinh",
    "Phường Trường Thi",
    "Phường Hưng Bình",
    "Xã Cửa Lò",
  ],
  "Quảng Ninh": [
    "Phường Hạ Long",
    "Phường Bãi Cháy",
    "Phường Cẩm Phả",
    "Phường Uông Bí",
  ],
};

function renderReceiverWardOptions(province, selectedWard = "") {
  if (!receiverWard) return;
  receiverWard.innerHTML = `<option value="">-- Chọn xã / phường --</option>`;
  if (!province || !wardData[province]) return;
  wardData[province].forEach(function (ward) {
    const option = document.createElement("option");
    option.value = ward;
    option.innerText = ward;
    if (ward === selectedWard) option.selected = true;
    receiverWard.appendChild(option);
  });
}

if (receiverProvince && receiverWard) {
  receiverProvince.addEventListener("change", function () {
    renderReceiverWardOptions(receiverProvince.value);
  });
}

if (!user) {
  alert("Vui lòng đăng nhập để xem giỏ hàng");
  window.location.href = "/Frontend/user/login.html";
} else if (user.role === "staff") {
  alert("Tài khoản nhân viên bán hàng không được sử dụng giỏ hàng");
  window.location.href = "/Frontend/staff/staff-dashboard.html";
} else if (user.role === "admin") {
  alert("Tài khoản quản trị không được sử dụng giỏ hàng");
  window.location.href = "/Frontend/admin/admin-users.html";
}

async function loadSaleData() {
  try {
    const prodRes = await fetch(API_PRODUCT_ALL);
    if (!prodRes.ok) return;
    const allProducts = await prodRes.json();
    const productsArray = Array.isArray(allProducts)
      ? allProducts
      : allProducts.data || [];

    // 1. Quét SALE 30%
    const statRes = await fetch(API_WORST_SELLERS);
    const worstSellers = statRes.ok ? await statRes.json() : [];
    const worstArray = Array.isArray(worstSellers)
      ? worstSellers
      : worstSellers.data || [];
    const productsWithSales = productsArray.map((product) => {
      const productName = product.name || "";
      const statData = worstArray.find((item) => item.name === productName);
      return { ...product, soldQuantity: statData ? statData.quantity : 0 };
    });
    productsWithSales.sort((a, b) => a.soldQuantity - b.soldQuantity);
    saleProductNames = productsWithSales
      .slice(0, 10)
      .map((p) => p.name)
      .filter(Boolean);

    // 2. Quét TOP HOT 10%
    const bestRes = await fetch(API_BEST_SELLERS);
    const bestSellers = bestRes.ok ? await bestRes.json() : [];
    const bestArray = Array.isArray(bestSellers)
      ? bestSellers
      : bestSellers.data || [];
    const productsWithBest = productsArray.map((product) => {
      const productName = product.name || "";
      const statData = bestArray.find((item) => item.name === productName);
      return { ...product, soldQuantity: statData ? statData.quantity : 0 };
    });
    productsWithBest.sort((a, b) => b.soldQuantity - a.soldQuantity);

    featuredProductsMap = {};
    productsWithBest.slice(0, 10).forEach((p, index) => {
      if (p.name) featuredProductsMap[p.name] = index + 1;
    });
  } catch (error) {
    console.error("Cảnh báo: Không thể tải ưu đãi", error);
  }
}

async function loadCart() {
  try {
    await loadSaleData();
    const res = await fetch(`${API_CART}/${user.id}`);
    const cart = await res.json();
    cartProducts = cart.products || [];
    renderCart(cartProducts);
    if (window.refreshCartBadge) window.refreshCartBadge();
  } catch (error) {
    if (cartList)
      cartList.innerHTML = `<p style="text-align:center; color:red; padding: 20px;">Lỗi lấy dữ liệu từ Backend. Hãy làm mới lại trang.</p>`;
  }
}

function renderCart(products) {
  if (!cartList) return;
  cartList.innerHTML = "";

  if (!products || products.length === 0) {
    cartList.innerHTML = `<div class="empty-cart"><h3>Giỏ hàng đang trống</h3><p>Hãy chọn thêm sản phẩm để tiếp tục mua hàng.</p></div>`;
    updateSummary();
    return;
  }

  products.forEach((product, index) => {
    if (!product) return;

    const productName = product.name || "Sản phẩm không tên";
    const isFeatured = featuredProductsMap[productName];
    const isSale = !isFeatured && saleProductNames.includes(productName); // Nếu là top thì bỏ qua ế
    const unitPrice = Number(product.price || 0);

    let displayPrice = unitPrice;
    let priceHtml = `<p class="cart-price">${unitPrice.toLocaleString()}đ</p>`;

    if (isFeatured) {
      displayPrice = unitPrice * 0.9;
      priceHtml = `
        <p class="cart-price" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 5px;">
          <span style="text-decoration: line-through; color: #999; font-size: 13px;">${unitPrice.toLocaleString()}đ</span>
          <span style="color: #e60012; font-weight: bold; font-size: 16px;">${displayPrice.toLocaleString()}đ</span>
          <span style="background: #e60012; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap;">TOP HOT -10%</span>
        </p>
      `;
    } else if (isSale) {
      displayPrice = unitPrice * 0.7;
      priceHtml = `
        <p class="cart-price" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 5px;">
          <span style="text-decoration: line-through; color: #999; font-size: 13px;">${unitPrice.toLocaleString()}đ</span>
          <span style="color: #e60012; font-weight: bold; font-size: 16px;">${displayPrice.toLocaleString()}đ</span>
          <span style="background: #e60012; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap;">SALE -30%</span>
        </p>
      `;
    }

    const itemTotal = displayPrice * (product.quantity || 1);

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <div class="cart-check">
        <input type="checkbox" class="select-cart-item" data-index="${index}" onchange="updateSummary()" />
      </div>
      <div class="cart-product">
        <img src="${product.image || "/Frontend/img/logo.jpg"}" alt="${productName}" onerror="this.src='/Frontend/img/logo.jpg'" />
        <div>
          <h3>${productName}</h3>
          <p>Thương hiệu: ${product.brand || "Khác"}</p>
          <p>Size: ${product.size || "Free Size"}</p>
          ${priceHtml}
        </div>
      </div>
      <div class="cart-quantity">
        <button onclick="updateQuantity('${product.productId}', ${product.size}, ${product.quantity - 1})">-</button>
        <input type="number" value="${product.quantity}" min="1" readonly />
        <button onclick="updateQuantity('${product.productId}', ${product.size}, ${product.quantity + 1})">+</button>
      </div>
      <p class="cart-total-item" style="${isSale || isFeatured ? "color: #e60012; font-weight: bold;" : ""}">${itemTotal.toLocaleString()}đ</p>
      <button class="remove-btn" onclick="removeFromCart('${product.productId}', ${product.size})">Xóa</button>
    `;
    cartList.appendChild(cartItem);
  });

  updateSummary();
}

function getSelectedProducts() {
  const checkedBoxes = document.querySelectorAll(".select-cart-item:checked");
  const selectedProducts = [];
  checkedBoxes.forEach((checkbox) => {
    const index = Number(checkbox.dataset.index);
    if (cartProducts[index]) selectedProducts.push(cartProducts[index]);
  });
  return selectedProducts;
}

function updateSummary() {
  const selectedProducts = getSelectedProducts();
  let subTotal = 0;
  let selectedCount = 0;
  let totalDiscount = 0;

  selectedProducts.forEach((product) => {
    if (!product) return;
    const productName = product.name || "";
    const isFeatured = featuredProductsMap[productName];
    const isSale = !isFeatured && saleProductNames.includes(productName);
    const unitPrice = Number(product.price || 0);
    const quantity = Number(product.quantity || 1);

    subTotal += unitPrice * quantity;
    selectedCount += quantity;

    if (isFeatured) {
      totalDiscount += unitPrice * 0.1 * quantity;
    } else if (isSale) {
      totalDiscount += unitPrice * 0.3 * quantity;
    }
  });

  let shippingFee = 0;
  let grandTotal = 0;

  if (subTotal > 0) {
    shippingFee = SHIPPING_FEE;
    grandTotal = subTotal + shippingFee - totalDiscount;
  }

  if (selectedCountElement) selectedCountElement.innerText = selectedCount;
  if (subTotalElement)
    subTotalElement.innerText = subTotal.toLocaleString() + "đ";
  if (shippingFeeElement)
    shippingFeeElement.innerText = shippingFee.toLocaleString() + "đ";

  if (discountElement) {
    discountElement.innerText =
      totalDiscount > 0 ? "-" + totalDiscount.toLocaleString() + "đ" : "0đ";
    discountElement.style.color = totalDiscount > 0 ? "#e60012" : "#222";
  }
  if (grandTotalElement)
    grandTotalElement.innerText = grandTotal.toLocaleString() + "đ";

  if (cartActionBtn) {
    if (selectedProducts.length > 0) {
      cartActionBtn.innerText = "Xóa sản phẩm đã chọn";
      cartActionBtn.classList.add("delete-selected-mode");
    } else {
      cartActionBtn.innerText = "Làm trống giỏ hàng";
      cartActionBtn.classList.remove("delete-selected-mode");
    }
  }
}

async function updateQuantity(productId, size, quantity) {
  try {
    const res = await fetch(`${API_CART}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, productId, size, quantity }),
    });
    const data = await res.json();
    alert(data.message);
    loadCart();
  } catch (error) {
    alert("Lỗi cập nhật số lượng");
  }
}

async function removeFromCart(productId, size) {
  const confirmDelete = confirm("Bạn có chắc muốn xóa sản phẩm này?");
  if (!confirmDelete) return;
  try {
    const res = await fetch(`${API_CART}/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, productId, size }),
    });
    const data = await res.json();
    alert(data.message);
    loadCart();
  } catch (error) {
    alert("Lỗi khi xóa");
  }
}

async function clearCart() {
  const confirmClear = confirm("Bạn có chắc muốn làm trống giỏ hàng?");
  if (!confirmClear) return;
  try {
    const res = await fetch(`${API_CART}/clear/${user.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    alert(data.message);
    loadCart();
  } catch (error) {
    alert("Lỗi");
  }
}

async function handleCartAction() {
  const selectedProducts = getSelectedProducts();
  if (selectedProducts.length > 0) {
    await removeSelectedProducts();
  } else {
    await clearCart();
  }
}

async function removeSelectedProducts() {
  const selectedProducts = getSelectedProducts();
  if (selectedProducts.length === 0) {
    alert("Chọn sản phẩm cần xóa");
    return;
  }
  const confirmDelete = confirm(
    `Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm?`,
  );
  if (!confirmDelete) return;

  try {
    for (const product of selectedProducts) {
      if (!product) continue;
      await fetch(`${API_CART}/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product.productId,
          size: product.size,
        }),
      });
    }
    alert("Đã xóa sản phẩm thành công");
    loadCart();
  } catch (error) {
    alert("Lỗi khi xóa");
  }
}

async function checkoutCart() {
  const selectedProducts = getSelectedProducts();
  if (selectedProducts.length === 0) {
    alert("Chọn sản phẩm để đặt hàng");
    return;
  }
  selectedCheckoutProducts = selectedProducts;
  resetReceiverForm();
  await renderSavedReceiverInfoList();
  if (checkoutFormSection) {
    checkoutFormSection.classList.add("show");
    if (receiverName) receiverName.focus();
  }
}

function hideCheckoutForm() {
  if (checkoutFormSection) checkoutFormSection.classList.remove("show");
}

function showOrderSuccess(message) {
  const oldSuccess = document.querySelector(".order-success-overlay");
  if (oldSuccess) oldSuccess.remove();
  const successOverlay = document.createElement("div");
  successOverlay.className = "order-success-overlay";
  successOverlay.innerHTML = `
    <div class="order-success-box">
      <div class="success-confetti" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <div class="success-check">✓</div>
      <h2>Đặt hàng thành công</h2><p>${message || "Đơn hàng của bạn đang chờ xác nhận."}</p>
      <a href="/Frontend/user/account.html?tab=orders" class="success-orders-link">Xem đơn hàng</a>
    </div>
  `;
  document.body.appendChild(successOverlay);
  setTimeout(() => successOverlay.classList.add("show"), 20);
  setTimeout(() => {
    successOverlay.classList.remove("show");
    setTimeout(() => successOverlay.remove(), 300);
  }, 3600);
}

if (checkoutFormSection) {
  checkoutFormSection.addEventListener("click", function (e) {
    if (e.target === checkoutFormSection) hideCheckoutForm();
  });
}

document.addEventListener("keydown", function (e) {
  if (
    e.key === "Escape" &&
    checkoutFormSection &&
    checkoutFormSection.classList.contains("show")
  )
    hideCheckoutForm();
});

function resetReceiverForm() {
  if (receiverName) receiverName.value = "";
  if (receiverPhone) receiverPhone.value = "";
  if (receiverProvince) receiverProvince.value = "";
  if (receiverWard)
    receiverWard.innerHTML = `<option value="">-- Chọn xã / phường --</option>`;
  if (receiverDetailAddress) receiverDetailAddress.value = "";
  if (saveReceiverInfo) saveReceiverInfo.checked = true;
}

function getReceiverInfoKey() {
  return user ? `receiverInfo_${user.id}` : "receiverInfo_guest";
}

async function getSavedReceiverInfoList() {
  try {
    const res = await fetch(`${API_ADDRESS}/user/${user.id}`);
    const addresses = await res.json();
    return addresses || [];
  } catch (error) {
    return [];
  }
}

async function renderSavedReceiverInfoList() {
  if (!savedReceiverBox || !savedReceiverList) return;
  const savedList = await getSavedReceiverInfoList();
  savedReceiverList.innerHTML = "";
  if (savedList.length === 0) {
    savedReceiverBox.style.display = "none";
    return;
  }
  savedReceiverBox.style.display = "block";
  savedList.forEach((info, index) => {
    const item = document.createElement("div");
    item.className = "saved-receiver-item";
    item.innerHTML = `
      <div><strong>${info.name}</strong><p>${info.phone}</p><p>${info.address}</p></div>
      <div class="saved-receiver-actions">
        <button type="button" onclick="chooseSavedReceiverInfo(${index})">Chọn</button>
        <button type="button" class="delete-saved-receiver" onclick="deleteSavedReceiverInfo('${info._id}')">Xóa</button>
      </div>
    `;
    savedReceiverList.appendChild(item);
  });
  window.savedReceiverInfoList = savedList;
}

function chooseSavedReceiverInfo(index) {
  const savedList = window.savedReceiverInfoList || [];
  const selectedInfo = savedList[index];
  if (!selectedInfo) return;
  if (receiverName) receiverName.value = selectedInfo.name || "";
  if (receiverPhone) receiverPhone.value = selectedInfo.phone || "";
  if (receiverProvince) receiverProvince.value = selectedInfo.province || "";
  renderReceiverWardOptions(selectedInfo.province, selectedInfo.ward);
  if (receiverDetailAddress)
    receiverDetailAddress.value = selectedInfo.detailAddress || "";
}

async function deleteSavedReceiverInfo(addressId) {
  const confirmDelete = confirm("Bạn có chắc muốn xóa địa chỉ này không?");
  if (!confirmDelete) return;
  try {
    const res = await fetch(`${API_ADDRESS}/${addressId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    alert(data.message);
    renderSavedReceiverInfoList();
  } catch (error) {
    alert("Lỗi khi xóa");
  }
}

async function saveReceiverInfoToList(newInfo) {
  try {
    const res = await fetch(API_ADDRESS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInfo),
    });
    const data = await res.json();
    if (!res.ok) alert(data.message || "Lỗi khi lưu");
    return data.address;
  } catch (error) {
    return null;
  }
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (selectedCheckoutProducts.length === 0) {
      alert("Không có sản phẩm");
      return;
    }

    const customerName = receiverName.value.trim();
    const phone = receiverPhone.value.trim();
    const province = receiverProvince.value.trim();
    const ward = receiverWard.value.trim();
    const detailAddress = receiverDetailAddress.value.trim();

    if (!customerName || !phone || !province || !ward || !detailAddress) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const fullAddress = `${detailAddress}, ${ward}, ${province}`;

    if (saveReceiverInfo && saveReceiverInfo.checked) {
      await saveReceiverInfoToList({
        userId: user.id,
        name: customerName,
        phone: phone,
        province: province,
        ward: ward,
        detailAddress: detailAddress,
        address: fullAddress,
      });
    }

    // Tự động đẩy giá cuối (sau khi trừ 10% hoặc 30%) lên đơn hàng cho Admin quản lý
    const finalProducts = selectedCheckoutProducts.map((p) => {
      const productName = p.name || "";
      const isFeatured = featuredProductsMap[productName];
      const isSale = !isFeatured && saleProductNames.includes(productName);

      let newPrice = p.price;
      if (isFeatured) newPrice = p.price * 0.9;
      else if (isSale) newPrice = p.price * 0.7;

      return { ...p, price: newPrice };
    });

    const productTotal = finalProducts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0,
    );
    const orderData = {
      userId: user.id,
      customerName: customerName,
      phone: phone,
      address: fullAddress,
      products: finalProducts,
      totalPrice: productTotal + SHIPPING_FEE,
    };

    try {
      const res = await fetch(API_ORDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (res.ok) {
        hideCheckoutForm();
        checkoutForm.reset();
        selectedCheckoutProducts = [];
        showOrderSuccess(data.message);
        loadCart();
      } else {
        alert(data.message || "Lỗi khi đặt");
      }
    } catch (error) {
      alert("Lỗi khi đặt hàng");
    }
  });
}

if (user && user.role === "user") {
  loadCart();
}
