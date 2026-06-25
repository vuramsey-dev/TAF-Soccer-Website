const API_ADMIN = "https://taf-soccer-website-1.onrender.com/api/admin/users";

const adminFormOverlay = document.getElementById("adminFormOverlay");
const userForm = document.getElementById("userForm");
const userIdInput = document.getElementById("userId");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const roleInput = document.getElementById("role");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const userTableBody = document.getElementById("userTableBody");
const searchInput = document.getElementById("searchInput");

const totalUsers = document.getElementById("totalUsers");
const totalCustomers = document.getElementById("totalCustomers");
const totalStaff = document.getElementById("totalStaff");
const totalAdmins = document.getElementById("totalAdmins");
const adminName = document.getElementById("adminName");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

const currentAdmin = JSON.parse(localStorage.getItem("user"));

let users = [];

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

// Load danh sách tài khoản
async function loadUsers() {
  try {
    const res = await fetch(API_ADMIN);
    users = await res.json();

    renderUsers(users);
    renderStats(users);
  } catch (error) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="error-text">
          Không thể tải danh sách tài khoản. Hãy kiểm tra backend.
        </td>
      </tr>
    `;
  }
}

// Hiển thị thống kê tài khoản
function renderStats(userList) {
  const customers = userList.filter((user) => user.role === "user");
  const staff = userList.filter((user) => user.role === "staff");
  const admins = userList.filter((user) => user.role === "admin");

  totalUsers.innerText = userList.length;
  totalCustomers.innerText = customers.length;
  totalStaff.innerText = staff.length;
  totalAdmins.innerText = admins.length;
}

// Hiển thị bảng tài khoản
function renderUsers(userList) {
  userTableBody.innerHTML = "";

  if (!userList || userList.length === 0) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-text">
          Không có tài khoản nào
        </td>
      </tr>
    `;
    return;
  }

  userList.forEach((user, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.name || ""}</td>
      <td>${user.email || ""}</td>
      <td>${user.phone || ""}</td>
      <td>
        <span class="role-badge ${user.role}">
          ${getRoleName(user.role)}
        </span>
      </td>
      <td>
        <button class="edit-btn" onclick="editUser('${user._id}')">
          Sửa
        </button>

        <button class="delete-btn" onclick="deleteUser('${user._id}')">
          Xóa
        </button>
      </td>
    `;

    userTableBody.appendChild(tr);
  });
}

// Đổi role sang tiếng Việt
function getRoleName(role) {
  if (role === "admin") return "Admin";
  if (role === "staff") return "Nhân viên";
  return "Khách hàng";
}

// Thêm hoặc cập nhật tài khoản
if (userForm) {
  userForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = userIdInput.value.trim();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value.trim();
    const role = roleInput.value;

    if (!name || !email || !role) {
      alert("Vui lòng nhập họ tên, email và quyền tài khoản");
      return;
    }

    if (!id && !password) {
      alert("Vui lòng nhập mật khẩu cho tài khoản mới");
      return;
    }

    if (password && password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    const userData = {
      name,
      email,
      phone,
      password,
      role,
    };

    try {
      let res;

      if (id) {
        res = await fetch(`${API_ADMIN}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      } else {
        res = await fetch(API_ADMIN, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      }

      const data = await res.json();

      alert(data.message);

      if (res.ok) {
        closeUserForm();
        loadUsers();
      }
    } catch (error) {
      alert("Không thể kết nối đến server");
    }
  });
}

// Đưa dữ liệu lên form để sửa
function editUser(id) {
  const selectedUser = users.find((user) => user._id === id);

  if (!selectedUser) return;

  userIdInput.value = selectedUser._id;
  nameInput.value = selectedUser.name || "";
  emailInput.value = selectedUser.email || "";
  phoneInput.value = selectedUser.phone || "";
  passwordInput.value = "";
  roleInput.value = selectedUser.role || "user";

  formTitle.innerText = "Cập nhật tài khoản";
  submitBtn.innerText = "Cập nhật";

  openEditUserForm();
}

// Xóa tài khoản
async function deleteUser(id) {
  const selectedUser = users.find((user) => user._id === id);

  if (!selectedUser) return;

  const currentAdmin = JSON.parse(localStorage.getItem("user"));

  if (currentAdmin && currentAdmin.id === id) {
    alert("Bạn không thể xóa chính tài khoản đang đăng nhập");
    return;
  }

  const confirmDelete = confirm(
    `Bạn có chắc muốn xóa tài khoản "${selectedUser.name}" không?`,
  );

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_ADMIN}/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
      loadUsers();
    }
  } catch (error) {
    alert("Không thể kết nối đến server");
  }
}

// Tìm kiếm tài khoản
function searchUsers() {
  const keyword = searchInput.value.trim().toLowerCase();

  if (!keyword) {
    renderUsers(users);
    return;
  }

  const filteredUsers = users.filter((user) => {
    return (
      (user.name && user.name.toLowerCase().includes(keyword)) ||
      (user.email && user.email.toLowerCase().includes(keyword)) ||
      (user.phone && user.phone.toLowerCase().includes(keyword)) ||
      getRoleName(user.role).toLowerCase().includes(keyword)
    );
  });

  renderUsers(filteredUsers);
}

// Hiển thị tất cả tài khoản
function showAllUsers() {
  searchInput.value = "";
  renderUsers(users);
}

// Mở form thêm tài khoản
function openAddUserForm() {
  resetForm();

  if (adminFormOverlay) {
    adminFormOverlay.classList.add("show");
  }

  nameInput.focus();
}

// Mở form cập nhật tài khoản
function openEditUserForm() {
  if (adminFormOverlay) {
    adminFormOverlay.classList.add("show");
  }

  nameInput.focus();
}

// Đóng form
function closeUserForm() {
  if (adminFormOverlay) {
    adminFormOverlay.classList.remove("show");
  }

  resetForm();
}
// Làm mới form
function resetForm() {
  userIdInput.value = "";
  nameInput.value = "";
  emailInput.value = "";
  phoneInput.value = "";
  passwordInput.value = "";
  roleInput.value = "user";

  formTitle.innerText = "Thêm tài khoản";
  submitBtn.innerText = "Thêm tài khoản";
}
// Bấm ra ngoài form thì đóng popup
if (adminFormOverlay) {
  adminFormOverlay.addEventListener("click", function (e) {
    if (e.target === adminFormOverlay) {
      closeUserForm();
    }
  });
}

// Bấm phím ESC để đóng popup
document.addEventListener("keydown", function (e) {
  if (
    e.key === "Escape" &&
    adminFormOverlay &&
    adminFormOverlay.classList.contains("show")
  ) {
    closeUserForm();
  }
});

loadUsers();
