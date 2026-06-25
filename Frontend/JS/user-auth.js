document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("user"));

  const currentPath = window.location.pathname;

  const isLoginPage = currentPath.includes("/Frontend/user/login.html");
  const isRegisterPage = currentPath.includes("/Frontend/user/register.html");

  const protectedUserPages = [
    "/Frontend/user/cart.html",
    "/Frontend/user/account.html",
    "/Frontend/user/account-info.html",
    "/Frontend/user/shipping-info.html",
    "/Frontend/user/my-orders.html",
  ];

  const isProtectedUserPage = protectedUserPages.some(function (page) {
    return currentPath.includes(page);
  });

  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const logoutLink = document.getElementById("logoutLink");

  // Ẩn / hiện nút đăng nhập, đăng ký, đăng xuất
  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "inline-block";
  } else {
    if (loginLink) loginLink.style.display = "inline-block";
    if (registerLink) registerLink.style.display = "inline-block";
    if (logoutLink) logoutLink.style.display = "none";
  }

  // Nếu đã đăng nhập mà vào lại login/register thì chuyển đúng giao diện
  if (user && (isLoginPage || isRegisterPage)) {
    if (user.role === "user") {
      window.location.href = "/Frontend/user/homepage.html";
      return;
    }

    if (user.role === "staff") {
      window.location.href = "/Frontend/staff/staff-dashboard.html";
      return;
    }

    if (user.role === "admin") {
      window.location.href = "/Frontend/admin/admin-users.html";
      return;
    }
  }

  // Nếu là staff/admin mà cố vào giao diện user thì chuyển về đúng giao diện của họ
  if (user && user.role === "staff" && !isLoginPage && !isRegisterPage) {
    alert(
      "Tài khoản nhân viên bán hàng không được truy cập giao diện khách hàng",
    );
    window.location.href = "/Frontend/staff/staff-dashboard.html";
    return;
  }

  if (user && user.role === "admin" && !isLoginPage && !isRegisterPage) {
    alert("Tài khoản quản trị không được truy cập giao diện khách hàng");
    window.location.href = "/Frontend/admin/admin-users.html";
    return;
  }

  // Những trang user cần đăng nhập: giỏ hàng, tài khoản, đơn hàng
  if (isProtectedUserPage && !user) {
    alert("Vui lòng đăng nhập để sử dụng chức năng này");
    window.location.href = "/Frontend/user/login.html";
    return;
  }

  // Đăng xuất
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("user");
      alert("Đăng xuất thành công");
      window.location.href = "/Frontend/user/homepage.html";
    });
  }
});
