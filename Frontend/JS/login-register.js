const API_URL = "https://taf-soccer-website-1.onrender.com/api/auth";

// Xử lý đăng ký
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document
      .getElementById("registerEmail")
      .value.trim()
      .toLowerCase();
    const phone = document.getElementById("registerPhone").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!name || !email || !password) {
      alert("Vui lòng nhập đầy đủ họ tên, email và mật khẩu");
      return;
    }

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    const userData = {
      name,
      email,
      phone,
      password,
    };

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      alert(data.message);

      if (res.ok) {
        window.location.href = "/Frontend/user/login.html";
      }
    } catch (error) {
      alert("Không thể kết nối đến server");
    }
  });
}

// Xử lý đăng nhập
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      alert("Vui lòng nhập email và mật khẩu");
      return;
    }

    const loginData = {
      email,
      password,
    };

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      alert(data.message);

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "user") {
          window.location.href = "/Frontend/user/homepage.html";
          return;
        }

        if (data.user.role === "staff") {
          window.location.href = "/Frontend/staff/staff-dashboard.html";
          return;
        }

        if (data.user.role === "admin") {
          window.location.href = "/Frontend/admin/admin-users.html";
          return;
        }

        alert("Tài khoản chưa được phân quyền");
        localStorage.removeItem("user");
      }
    } catch (error) {
      alert("Không thể kết nối đến server");
    }
  });
}
