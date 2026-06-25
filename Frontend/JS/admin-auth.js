const adminUser = JSON.parse(localStorage.getItem("user"));

if (!adminUser) {
  alert("Vui lòng đăng nhập tài khoản quản trị");
  window.location.href = "/Frontend/user/login.html";
} else if (adminUser.role !== "admin") {
  alert("Bạn không có quyền truy cập giao diện quản trị");

  if (adminUser.role === "staff") {
    window.location.href = "/Frontend/staff/staff-dashboard.html";
  } else {
    window.location.href = "/Frontend/user/homepage.html";
  }
}
