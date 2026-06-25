const API_PRODUCT = "https://taf-soccer-website-1.onrender.com/api/products";
const API_BRAND = "https://taf-soccer-website-1.onrender.com/api/admin/brands";

const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");

const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productBrand = document.getElementById("productBrand");
const productPrice = document.getElementById("productPrice");
const productQuantity = document.getElementById("productQuantity");
const productImage = document.getElementById("productImage");
const productDescription = document.getElementById("productDescription");
const imagePreview = document.getElementById("imagePreview");
const productFormOverlay = document.getElementById("productFormOverlay");

const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");
const resetBtn = document.getElementById("resetBtn");
const formTitle = document.getElementById("formTitle");

let productsData = [];
let currentImage = "";

function ensureBrandOption(brandName) {
  if (!productBrand || !brandName) return;

  const existedOption = Array.from(productBrand.options).some(
    (option) => option.value.toLowerCase() === brandName.toLowerCase(),
  );

  if (!existedOption) {
    const option = document.createElement("option");
    option.value = brandName;
    option.textContent = brandName;
    productBrand.appendChild(option);
  }
}

function setProductBrandValue(brandName) {
  ensureBrandOption(brandName);

  if (productBrand) {
    productBrand.value = brandName || "";
  }
}

async function loadBrandOptions(selectedBrand = "") {
  if (!productBrand) return;

  try {
    const res = await fetch(API_BRAND);

    if (!res.ok) return;

    const brands = await res.json();

    if (!Array.isArray(brands) || brands.length === 0) {
      return;
    }

    const brandToSelect = selectedBrand || productBrand.value;

    productBrand.innerHTML = '<option value="">-- Chọn thương hiệu --</option>';

    brands.forEach((brand) => {
      if (!brand.name) return;

      const option = document.createElement("option");
      option.value = brand.name;
      option.textContent = brand.name;
      productBrand.appendChild(option);
    });

    setProductBrandValue(brandToSelect);
  } catch (error) {
    setProductBrandValue(selectedBrand);
  }
}

// Mở form thêm sản phẩm
function openAddProductForm() {
  resetForm();

  formTitle.innerText = "Thêm sản phẩm mới";
  addBtn.style.display = "inline-block";
  updateBtn.style.display = "none";

  productFormOverlay.classList.add("show");
}

// Đóng form
function closeProductForm() {
  productFormOverlay.classList.remove("show");
}
// Lấy số lượng theo từng size
function getSizeStockFromForm() {
  const sizeInputs = document.querySelectorAll(".size-quantity");
  const sizeStock = [];

  sizeInputs.forEach((input) => {
    const size = Number(input.dataset.size);
    const quantity = Number(input.value);

    if (quantity > 0) {
      sizeStock.push({
        size,
        quantity,
      });
    }
  });

  return sizeStock;
}

function setSizeInputActive(input, isActive) {
  const sizeItem = input.closest(".size-stock-item");

  input.readOnly = !isActive;

  if (sizeItem) {
    sizeItem.classList.toggle("active", isActive);
  }
}

function enableSizeInput(input) {
  setSizeInputActive(input, true);

  if (input.value === "") {
    input.value = 0;
  }

  input.focus();
  input.select();
}

// Tính tổng số lượng
function getTotalQuantity(sizeStock) {
  return sizeStock.reduce((total, item) => total + item.quantity, 0);
}

function updateTotalQuantityField() {
  const totalQuantity = getTotalQuantity(getSizeStockFromForm());

  if (productQuantity) {
    productQuantity.value = totalQuantity;
  }

  return totalQuantity;
}

// Gán số lượng size lên form khi sửa
function setSizeStockToForm(sizeStock) {
  document.querySelectorAll(".size-quantity").forEach((input) => {
    input.value = 0;
    setSizeInputActive(input, false);
  });

  sizeStock.forEach((item) => {
    const input = document.querySelector(
      `.size-quantity[data-size="${item.size}"]`,
    );

    if (input) {
      input.value = item.quantity;
      setSizeInputActive(input, Number(item.quantity) > 0);
    }
  });

  updateTotalQuantityField();
}

function setupSizeStockControls() {
  document.querySelectorAll(".size-stock-item").forEach((item) => {
    const input = item.querySelector(".size-quantity");

    if (!input) return;

    item.addEventListener("click", function () {
      enableSizeInput(input);
    });

    input.addEventListener("input", function () {
      if (Number(this.value) < 0) {
        this.value = 0;
      }

      updateTotalQuantityField();
    });
  });
}

// Chọn ảnh từ máy
productImage.addEventListener("change", function () {
  const file = this.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    currentImage = e.target.result;
    imagePreview.src = currentImage;
    imagePreview.style.display = "block";
  };

  reader.readAsDataURL(file);
});

// Load sản phẩm
async function loadProducts() {
  try {
    const res = await fetch(API_PRODUCT);
    const products = await res.json();

    productsData = products;
    renderProducts(products);

    document.getElementById("searchProduct").value = "";
  } catch (error) {
    alert("Không thể tải danh sách sản phẩm. Kiểm tra backend đã chạy chưa.");
  }
}

// Hiển thị sản phẩm
function renderProducts(products) {
  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">Không có sản phẩm nào</td>
      </tr>
    `;
    return;
  }

  products.forEach((product) => {
    const tr = document.createElement("tr");

    const totalQuantity =
      product.sizeStock && product.sizeStock.length > 0
        ? getTotalQuantity(product.sizeStock)
        : product.quantity || 0;

    tr.innerHTML = `
      <td>
        <img src="${product.image || "/Frontend/img/logo.jpg"}" class="product-img" />
      </td>

      <td>${product.name}</td>
      <td>${product.brand}</td>
      <td>${Number(product.price).toLocaleString()}đ</td>
      <td>${totalQuantity}</td>

      <td>
        <button class="btn btn-orange" onclick="fillFormEdit('${product._id}')">
          Sửa
        </button>

        <button class="btn btn-dark" onclick="deleteProduct('${product._id}')">
          Xóa
        </button>
      </td>
    `;

    productList.appendChild(tr);
  });
}

// Thêm sản phẩm
productForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const sizeStock = getSizeStockFromForm();

  if (sizeStock.length === 0) {
    alert("Vui lòng nhập số lượng cho ít nhất một size");
    return;
  }

  const productData = {
    name: productName.value.trim(),
    brand: productBrand.value,
    price: Number(productPrice.value),
    sizeStock,
    quantity: updateTotalQuantityField(),
    image: currentImage,
    description: productDescription.value.trim(),
  };

  try {
    const res = await fetch(API_PRODUCT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const data = await res.json();

    alert(data.message);

    resetForm();
    closeProductForm();
    loadProducts();
  } catch (error) {
    alert("Lỗi khi thêm sản phẩm");
  }
});

// Đưa thông tin cũ lên form
function fillFormEdit(id) {
  const product = productsData.find((p) => p._id === id);

  if (!product) {
    alert("Không tìm thấy sản phẩm");
    return;
  }
  productFormOverlay.classList.add("show");

  productId.value = product._id;
  productName.value = product.name;
  setProductBrandValue(product.brand);
  productPrice.value = product.price;
  productDescription.value = product.description || "";

  currentImage = product.image || "";

  if (currentImage) {
    imagePreview.src = currentImage;
    imagePreview.style.display = "block";
  } else {
    imagePreview.src = "";
    imagePreview.style.display = "none";
  }

  setSizeStockToForm(product.sizeStock || []);

  formTitle.innerText = "Cập nhật sản phẩm";
  addBtn.style.display = "none";
  updateBtn.style.display = "inline-block";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Cập nhật sản phẩm
updateBtn.addEventListener("click", async function () {
  const id = productId.value;

  if (!id) {
    alert("Vui lòng chọn sản phẩm cần sửa");
    return;
  }

  const sizeStock = getSizeStockFromForm();

  if (sizeStock.length === 0) {
    alert("Vui lòng nhập số lượng cho ít nhất một size");
    return;
  }

  const productData = {
    name: productName.value.trim(),
    brand: productBrand.value,
    price: Number(productPrice.value),
    sizeStock,
    quantity: updateTotalQuantityField(),
    image: currentImage,
    description: productDescription.value.trim(),
  };

  try {
    const res = await fetch(`${API_PRODUCT}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const data = await res.json();

    alert(data.message);

    resetForm();
    closeProductForm();
    loadProducts();
  } catch (error) {
    alert("Lỗi khi cập nhật sản phẩm");
  }
});

// Xóa sản phẩm
async function deleteProduct(id) {
  const confirmDelete = confirm("Bạn có chắc muốn xóa sản phẩm này không?");

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_PRODUCT}/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    alert(data.message);
    loadProducts();
  } catch (error) {
    alert("Lỗi khi xóa sản phẩm");
  }
}

// Tìm kiếm
async function searchProducts() {
  const keyword = document.getElementById("searchProduct").value.trim();

  if (!keyword) {
    loadProducts();
    return;
  }

  try {
    const res = await fetch(`${API_PRODUCT}/search/${keyword}`);
    const products = await res.json();

    productsData = products;
    renderProducts(products);
  } catch (error) {
    alert("Lỗi khi tìm kiếm sản phẩm");
  }
}

// Làm mới form
function resetForm() {
  productForm.reset();

  productId.value = "";
  currentImage = "";

  document.querySelectorAll(".size-quantity").forEach((input) => {
    input.value = 0;
    setSizeInputActive(input, false);
  });

  updateTotalQuantityField();

  imagePreview.src = "";
  imagePreview.style.display = "none";

  formTitle.innerText = "Thêm sản phẩm mới";
  addBtn.style.display = "inline-block";
  updateBtn.style.display = "none";
}

resetBtn.addEventListener("click", resetForm);

updateBtn.style.display = "none";
if (productFormOverlay) {
  productFormOverlay.addEventListener("click", function (e) {
    if (e.target === productFormOverlay) {
      closeProductForm();
    }
  });
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeProductForm();
  }
});

setupSizeStockControls();
updateTotalQuantityField();
loadBrandOptions();
loadProducts();
