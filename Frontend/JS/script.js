// ================= API =================
const API_PRODUCT = "http://localhost:3000/api/products";
const API_BEST_SELLERS = "http://localhost:3000/api/statistics/best-products";

// ================= SLIDER BANNER (Giữ nguyên của bạn) =================
let slideIndex = 0;
const slides = document.querySelectorAll(".slides");
const dots = document.querySelectorAll(".dot");

function showSlide(index) {
  if (slides.length === 0) return;
  if (index >= slides.length) slideIndex = 0;
  if (index < 0) slideIndex = slides.length - 1;

  slides.forEach(function (slide) {
    slide.classList.remove("active");
  });

  dots.forEach(function (dot) {
    dot.classList.remove("active-dot");
  });

  slides[slideIndex].classList.add("active");
  if (dots[slideIndex]) dots[slideIndex].classList.add("active-dot");
}

function changeSlide(number) {
  slideIndex += number;
  showSlide(slideIndex);
}

function currentSlide(index) {
  slideIndex = index;
  showSlide(slideIndex);
}

// Tự động chuyển slide mỗi 4 giây
if (slides.length > 0) {
  setInterval(function () {
    slideIndex++;
    showSlide(slideIndex);
  }, 4000);
}

// ================= LOAD TOP 3 SẢN PHẨM NỔI BẬT =================
async function loadTop3Featured() {
  const container = document.getElementById("homeFeaturedProducts");
  if (!container) return;

  try {
    const prodRes = await fetch(API_PRODUCT);
    if (!prodRes.ok) throw new Error("Lỗi tải sản phẩm");
    const allProducts = await prodRes.json();
    const productsArray = Array.isArray(allProducts)
      ? allProducts
      : allProducts.data || [];

    let bestSellers = [];
    try {
      const statRes = await fetch(API_BEST_SELLERS);
      if (statRes.ok) {
        const data = await statRes.json();
        bestSellers = Array.isArray(data) ? data : data.data || [];
      }
    } catch (e) {
      console.warn("Lỗi API Best Sellers");
    }

    const productsWithSales = productsArray.map((p) => {
      const statData = bestSellers.find((item) => item.name === p.name);
      return { ...p, soldQuantity: statData ? statData.quantity : 0 };
    });

    productsWithSales.sort((a, b) => b.soldQuantity - a.soldQuantity);
    const top3 = productsWithSales.slice(0, 3);

    container.innerHTML = "";

    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "stretch";
    container.style.gap = "30px";
    container.style.flexWrap = "wrap";

    top3.forEach((product, index) => {
      const rank = index + 1;
      const oldPrice = Number(product.price || 0);
      const newPrice = oldPrice * 0.9;

      let rankBg = "#ffffff";
      let rankColor = "#111111";
      if (rank === 1) {
        rankBg = "#FFD700";
        rankColor = "#000";
      } else if (rank === 2) {
        rankBg = "#C0C0C0";
        rankColor = "#000";
      } else if (rank === 3) {
        rankBg = "#CD7F32";
        rankColor = "#fff";
      }

      container.innerHTML += `
            <div class="product-card" style="width: 280px; position: relative; border-radius: 16px; overflow: hidden; border: 1px solid #f0f0f0; box-shadow: 0 4px 15px rgba(0,0,0,0.04); transition: 0.3s; background: #fff; display: flex; flex-direction: column;"
                 onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 30px rgba(184, 134, 11, 0.15)';"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.04)';">
                
                <span style="position: absolute; top: 12px; left: 12px; background: ${rankBg}; color: ${rankColor}; padding: 5px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                    TOP ${rank}
                </span>
                <span style="position: absolute; top: 12px; right: 12px; background: #e60012; color: #fff; padding: 5px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; z-index: 2;">
                    -10%
                </span>
                
                <div style="height: 250px; width: 100%; background: #f8f9fa; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                    <img src="${product.image || "/Frontend/img/logo.jpg"}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: contain; transition: 0.4s;" onerror="this.src='/Frontend/img/logo.jpg'" />
                </div>
                
                <div style="padding: 20px; display: flex; flex-direction: column; flex: 1; box-sizing: border-box;">
                    <span style="font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase; text-align: left;">${product.brand || "TAF Soccer"}</span>
                    <h3 style="font-size: 18px; margin: 8px 0 15px; color: #222; font-weight: 700; line-height: 1.4; text-align: left;">${product.name}</h3>
                    
                    <div style="margin-top: auto;"></div>
                    
                    <div style="margin-bottom: 15px; text-align: left;">
                        <span style="text-decoration: line-through; color: #999; font-size: 14px; margin-right: 8px;">${oldPrice.toLocaleString()}đ</span>
                        <span style="color: #e60012; font-size: 20px; font-weight: 900;">${newPrice.toLocaleString()}đ</span>
                    </div>
                    
                    <div style="width: 100%; display: flex; justify-content: center; align-items: center; margin: 0; padding: 0; box-sizing: border-box;">
                        <button onclick="viewProductDetail('${product._id}')" 
                                style="width: 100%; margin: 0 !important; padding: 12px 0; background: #111; color: #fff; border: none; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer; transition: 0.3s; display: block; text-align: center; box-sizing: border-box; transform: none; position: static;" 
                                onmouseover="this.style.background='#b8860b'" onmouseout="this.style.background='#111'">
                            Xem Chi Tiết
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color: red; text-align: center; width: 100%;">Lỗi tải dữ liệu sản phẩm nổi bật.</p>`;
  }
}

// Hàm chuyển trang chi tiết
function viewProductDetail(id) {
  localStorage.setItem("selectedProductId", id);
  window.location.href = "/Frontend/user/product-detail.html";
}

// Khởi chạy khi load trang
document.addEventListener("DOMContentLoaded", () => {
  loadTop3Featured();
});
