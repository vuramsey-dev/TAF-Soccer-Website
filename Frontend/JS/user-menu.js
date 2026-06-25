(function () {
  const CART_API_URL = "https://taf-soccer-website-1.onrender.com/api/cart";

  function getUser() {
    return JSON.parse(localStorage.getItem("user"));
  }

  function getUserId(user) {
    return user && (user.id || user._id);
  }

  function ensureCartBadge() {
    const cartLink = document.querySelector(".cart");

    if (!cartLink) return null;

    let badge = cartLink.querySelector(".cart-badge");

    if (!badge) {
      badge = document.createElement("span");
      badge.className = "cart-badge";
      cartLink.appendChild(badge);
    }

    return badge;
  }

  function setCartBadge(count) {
    const badge = ensureCartBadge();

    if (!badge) return;

    if (count > 0) {
      badge.innerText = count > 99 ? "99+" : count;
      badge.classList.add("show", "pulse");

      setTimeout(function () {
        badge.classList.remove("pulse");
      }, 450);
    } else {
      badge.innerText = "";
      badge.classList.remove("show", "pulse");
    }
  }

  async function refreshCartBadge() {
    const user = getUser();
    const userId = getUserId(user);

    if (!userId) {
      setCartBadge(0);
      return;
    }

    try {
      const res = await fetch(`${CART_API_URL}/${userId}`);
      const cart = await res.json();
      const count = (cart.products || []).reduce(function (sum, product) {
        return sum + Number(product.quantity || 0);
      }, 0);

      setCartBadge(count);
    } catch (error) {
      setCartBadge(0);
    }
  }

  window.refreshCartBadge = refreshCartBadge;

  document.addEventListener("DOMContentLoaded", function () {
    const userMenu = document.querySelector(".user-menu");
    const userIcon = document.querySelector(".user-icon");
    const userDropdown = document.getElementById("userDropdown");
    const user = getUser();

    refreshCartBadge();

    if (!userMenu || !userIcon || !userDropdown) return;

    if (user) {
      userDropdown.innerHTML = `
        <a href="/Frontend/user/account.html?tab=info">Thông tin tài khoản</a>
        <a href="#" id="logoutBtn">Đăng xuất</a>
      `;
    } else {
      userDropdown.innerHTML = `
        <a href="/Frontend/user/login.html">Đăng nhập</a>
        <a href="/Frontend/user/register.html">Đăng ký</a>
      `;
    }

    userIcon.addEventListener("click", function (e) {
      e.preventDefault();
      userDropdown.classList.toggle("show");
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".user-menu")) {
        userDropdown.classList.remove("show");
      }
    });

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("user");
        setCartBadge(0);
        alert("Đăng xuất thành công");
        window.location.href = "/Frontend/user/homepage.html";
      });
    }
  });
})();
