const API_ADMIN_BRANDS =
  "https://taf-soccer-website-1.onrender.com/api/admin/brands";

const adminBrandFormOverlay = document.getElementById("adminBrandFormOverlay");
const brandForm = document.getElementById("brandForm");
const brandIdInput = document.getElementById("brandId");
const brandNameInput = document.getElementById("brandName");
const brandDescriptionInput = document.getElementById("brandDescription");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const brandTableBody = document.getElementById("brandTableBody");
const searchInput = document.getElementById("searchInput");

const totalBrands = document.getElementById("totalBrands");
const usedBrands = document.getElementById("usedBrands");
const emptyBrands = document.getElementById("emptyBrands");
const totalBrandProducts = document.getElementById("totalBrandProducts");
const adminName = document.getElementById("adminName");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

const currentAdmin = JSON.parse(localStorage.getItem("user"));

let brands = [];

if (currentAdmin && adminName) {
  adminName.innerText = currentAdmin.name || "Admin";
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", function (e) {
    e.preventDefault();

    localStorage.removeItem("user");
    alert("Đăng xuất thành công");
    window.location.href = "/Frontend/user/login.html";
  });
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("vi-VN");
}

async function loadBrands() {
  try {
    const res = await fetch(API_ADMIN_BRANDS);
    brands = await res.json();

    renderBrands(brands);
    renderBrandStats(brands);
  } catch (error) {
    brandTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="error-text">
          Không thể tải danh sách thương hiệu. Hãy kiểm tra backend.
        </td>
      </tr>
    `;
  }
}

function renderBrandStats(brandList) {
  const usedBrandList = brandList.filter(
    (brand) => Number(brand.productCount || 0) > 0,
  );
  const emptyBrandList = brandList.filter(
    (brand) => Number(brand.productCount || 0) === 0,
  );
  const productTotal = brandList.reduce((total, brand) => {
    return total + Number(brand.productCount || 0);
  }, 0);

  totalBrands.innerText = brandList.length;
  usedBrands.innerText = usedBrandList.length;
  emptyBrands.innerText = emptyBrandList.length;
  totalBrandProducts.innerText = productTotal;
}

function renderBrands(brandList) {
  brandTableBody.innerHTML = "";

  if (!brandList || brandList.length === 0) {
    brandTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-text">
          Không có thương hiệu nào
        </td>
      </tr>
    `;
    return;
  }

  brandList.forEach((brand, index) => {
    const tr = document.createElement("tr");
    const productCount = Number(brand.productCount || 0);
    const brandName = brand.name || "";

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <div class="brand-table-name">
          <span class="brand-initial">${escapeHTML(brandName.charAt(0).toUpperCase())}</span>
          <strong>${escapeHTML(brandName)}</strong>
        </div>
      </td>
      <td class="brand-description">
        ${escapeHTML(brand.description || "Chưa có mô tả")}
      </td>
      <td>
        <span class="count-badge ${productCount > 0 ? "has-products" : "no-products"}">
          ${productCount} sản phẩm
        </span>
      </td>
      <td>${formatDate(brand.createdAt)}</td>
      <td>
        <button class="edit-btn" onclick="editBrand('${brand._id}')">
          Sửa
        </button>

        <button class="delete-btn" onclick="deleteBrand('${brand._id}')">
          Xóa
        </button>
      </td>
    `;

    brandTableBody.appendChild(tr);
  });
}

if (brandForm) {
  brandForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = brandIdInput.value.trim();
    const name = brandNameInput.value.trim();
    const description = brandDescriptionInput.value.trim();

    if (!name) {
      alert("Vui lòng nhập tên thương hiệu");
      brandNameInput.focus();
      return;
    }

    const brandData = {
      name,
      description,
    };

    try {
      const res = await fetch(
        id ? `${API_ADMIN_BRANDS}/${id}` : API_ADMIN_BRANDS,
        {
          method: id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(brandData),
        },
      );
      const data = await res.json();

      alert(data.message);

      if (res.ok) {
        closeBrandForm();
        loadBrands();
      }
    } catch (error) {
      alert("Không thể kết nối đến server");
    }
  });
}

function editBrand(id) {
  const selectedBrand = brands.find((brand) => brand._id === id);

  if (!selectedBrand) return;

  brandIdInput.value = selectedBrand._id;
  brandNameInput.value = selectedBrand.name || "";
  brandDescriptionInput.value = selectedBrand.description || "";

  formTitle.innerText = "Cập nhật thương hiệu";
  submitBtn.innerText = "Cập nhật";

  openBrandForm();
}

async function deleteBrand(id) {
  const selectedBrand = brands.find((brand) => brand._id === id);

  if (!selectedBrand) return;

  if (Number(selectedBrand.productCount || 0) > 0) {
    alert(
      "Không thể xóa thương hiệu đang có sản phẩm. Hãy đổi thương hiệu của sản phẩm trước.",
    );
    return;
  }

  const confirmDelete = confirm(
    `Bạn có chắc muốn xóa thương hiệu "${selectedBrand.name}" không?`,
  );

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_ADMIN_BRANDS}/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    alert(data.message);

    if (res.ok) {
      loadBrands();
    }
  } catch (error) {
    alert("Không thể kết nối đến server");
  }
}

function searchBrands() {
  const keyword = searchInput.value.trim().toLowerCase();

  if (!keyword) {
    renderBrands(brands);
    return;
  }

  const filteredBrands = brands.filter((brand) => {
    return (
      (brand.name && brand.name.toLowerCase().includes(keyword)) ||
      (brand.description && brand.description.toLowerCase().includes(keyword))
    );
  });

  renderBrands(filteredBrands);
}

function showAllBrands() {
  searchInput.value = "";
  renderBrands(brands);
}

function openAddBrandForm() {
  resetBrandForm();
  openBrandForm();
}

function openBrandForm() {
  if (adminBrandFormOverlay) {
    adminBrandFormOverlay.classList.add("show");
  }

  brandNameInput.focus();
}

function closeBrandForm() {
  if (adminBrandFormOverlay) {
    adminBrandFormOverlay.classList.remove("show");
  }

  resetBrandForm();
}

function resetBrandForm() {
  brandIdInput.value = "";
  brandNameInput.value = "";
  brandDescriptionInput.value = "";

  formTitle.innerText = "Thêm thương hiệu";
  submitBtn.innerText = "Thêm thương hiệu";
}

if (searchInput) {
  searchInput.addEventListener("input", searchBrands);
}

if (adminBrandFormOverlay) {
  adminBrandFormOverlay.addEventListener("click", function (e) {
    if (e.target === adminBrandFormOverlay) {
      closeBrandForm();
    }
  });
}

document.addEventListener("keydown", function (e) {
  if (
    e.key === "Escape" &&
    adminBrandFormOverlay &&
    adminBrandFormOverlay.classList.contains("show")
  ) {
    closeBrandForm();
  }
});

loadBrands();
