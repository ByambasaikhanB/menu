const wrapper = document.getElementById("menu-wrapper");

// Swiper тохиргоо
const swiper = new Swiper(".testimonial__swiper", {
  loop: false,
  slidesPerView: "auto",
  centeredSlides: true,
  spaceBetween: 24,
  grabCursor: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  touchStartPreventDefault: false,
  preventClicks: true,
  preventClicksPropagation: true,
});

// Сагсны өгөгдөл (Array)
let cart = JSON.parse(localStorage.getItem("restaurant_cart")) || [];

async function loadMenu(category) {
  try {
    const res = await fetch(`/menu/${category}`);
    const data = await res.json();

    wrapper.innerHTML = "";

    data.forEach((item) => {
      const name = item.name || "";
      const image = item.image_url || "";
      const ingredients = item.ingredients || "";
      const price = item.price != null ? Number(item.price) : 0;
      const icons = item.icons || "";
      const kcal = item.kcal;

      const formattedPrice = price.toLocaleString("mn-MN") + "₮";
      const safeFoodName = name.replace(/'/g, "\\'");

      wrapper.innerHTML += `
        <div class="swiper-slide testimonial__card">
          <img src="${image}" class="testimonial__img" />
          <div class="testimonial__overlay">
            <h3>${name}</h3>
            <p>${ingredients}</p>
            <div class="testimonial__extra">
              <div class="testimonial__price-icons">
                <span class="testimonial__price">${formattedPrice}</span>
                <span class="testimonial__icons">${icons}</span>
              </div>
              ${
                kcal !== null &&
                kcal !== undefined &&
                String(kcal).trim() !== ""
                  ? `<span class="testimonial__kcal">${kcal} kcal</span>`
                  : ""
              }
            </div>
            <button class="menu-order-btn" onclick="event.stopPropagation(); addToCart('${safeFoodName}', ${price})">
                Сагсанд нэмэх 🛒
            </button>
          </div>
        </div>
      `;
    });

    setTimeout(() => {
      swiper.update();
    }, 100);
  } catch (err) {
    console.error("Menu load error:", err);
  }
}

// 1. САГСАНД ХООЛ НЭМЭХ ФУНКЦ
function addToCart(foodName, foodPrice) {
  // Сагсанд өмнө нь нэмэгдсэн эсэхийг шалгах
  const existingItem = cart.find((item) => item.name === foodName);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name: foodName, price: foodPrice, quantity: 1 });
  }

  saveCart();
  updateCartBadge();

  // Хэрэглэгчид мэдэгдэл харуулах (Заавал alert биш жижиг эффект оруулж болно)
  alert(`${foodName} сагсанд нэмэгдлээ!`);
}

// 2. САГСНЫ БЭДЖ (Badge) ШИНЭЧЛЭХ
function updateCartBadge() {
  const badge = document.getElementById("cartCountBadge");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.innerText = totalItems;
}

// 3. САГСНЫ МОДАЛ НЭЭХ (Сагсан дахь хоолыг зурах)
function openCartModal() {
  const cartList = document.getElementById("cartItemsList");
  const totalAmountSpan = document.getElementById("cartTotalAmount");

  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML =
      '<p style="text-align:center; color:#999; italic">Сагс хоосон байна.</p>';
    totalAmountSpan.innerText = "0₮";
    document.getElementById("orderModal").style.display = "block";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    cartList.innerHTML += `
            <div class="cart-item-row">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">${item.price.toLocaleString("mn-MN")}₮</span>
                </div>
                <div class="cart-item-actions">
                    <button type="button" onclick="changeQty(${index}, -1)">-</button>
                    <span class="cart-item-qty">${item.quantity}</span>
                    <button type="button" onclick="changeQty(${index}, 1)">+</button>
                    <button type="button" class="cart-item-del" onclick="removeFromCart(${index})">❌</button>
                </div>
            </div>
        `;
  });

  totalAmountSpan.innerText = total.toLocaleString("mn-MN") + "₮";
  document.getElementById("orderModal").style.display = "block";
}

// 4. ТОО ШИРХЭГ ӨӨРЧЛӨХ (+/-)
function changeQty(index, change) {
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateCartBadge();
  openCartModal(); // Сагсыг дахин шинэчилж зурах
}

// 5. САГСНААС УСТГАХ
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartBadge();
  openCartModal();
}

function saveCart() {
  localStorage.setItem("restaurant_cart", JSON.stringify(cart));
}

function closeOrderModal() {
  document.getElementById("orderModal").style.display = "none";
  document.getElementById("orderForm").reset();
}

// 6. ЗАХИАЛГА БАТАЛГААЖУУЛЖ ORDERS.HTML РҮҮ ЯВУУЛАХ
function submitOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert("Сагс хоосон байна!");
    return;
  }

  const clientName = document.getElementById("clientName").value;
  const clientPhone = document.getElementById("clientPhone").value;
  const orderDate = new Date().toLocaleString("mn-MN");

  let orders = JSON.parse(localStorage.getItem("restaurant_orders")) || [];

  // Сагсанд байгаа бүх хоолыг нэг нэгээр нь захиалгын жагсаалт руу шилжүүлэх
  cart.forEach((item) => {
    orders.push({
      foodName: item.name,
      foodPrice: item.price.toLocaleString("mn-MN") + "₮",
      clientName: clientName,
      clientPhone: clientPhone,
      quantity: item.quantity,
      date: orderDate,
    });
  });

  localStorage.setItem("restaurant_orders", JSON.stringify(orders));

  // Сагсыг цэвэрлэх
  cart = [];
  saveCart();
  updateCartBadge();

  alert("Захиалга амжилттай бүртгэгдлээ!");
  closeOrderModal();
}
