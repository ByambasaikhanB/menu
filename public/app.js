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

// Сагсны өгөгдөл
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
              ${kcal ? `<span class="testimonial__kcal">${kcal} kcal</span>` : ""}
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

function addToCart(foodName, foodPrice) {
  const existingItem = cart.find((item) => item.name === foodName);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name: foodName, price: foodPrice, quantity: 1 });
  }
  saveCart();
  updateCartBadge();
  alert(`${foodName} сагсанд нэмэгдлээ!`);
}

function updateCartBadge() {
  const badge = document.getElementById("cartCountBadge");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.innerText = totalItems;
}

// САГСНЫ МОДАЛ НЭЭХ
function openCartModal() {
  const cartList = document.getElementById("cartItemsList");
  const totalAmountSpan = document.getElementById("cartTotalAmount");
  const totalWrapper = document.getElementById("cartTotalWrapper");
  const orderForm = document.getElementById("orderForm");

  cartList.innerHTML = "";
  if (cart.length === 0) {
    cartList.innerHTML =
      '<p style="text-align:center; color:#999; font-style: italic; margin: 10px 0;">Сагс хоосон байна.</p>';
    totalWrapper.style.display = "none";
    orderForm.style.display = "none";
  } else {
    totalWrapper.style.display = "flex";
    orderForm.style.display = "block";
    let total = 0;
    cart.forEach((item, index) => {
      total += item.price * item.quantity;
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
  }

  renderCustomerOrderStatus();
  document.getElementById("orderModal").style.display = "block";
}

// ҮЙЛЧЛҮҮЛЭГЧИД ӨӨРИЙНХ НЬ ТӨЛӨВИЙГ ЦАГТАЙ ХАРУУЛАХ
function renderCustomerOrderStatus() {
  const statusSection = document.getElementById("myOrdersStatusSection");
  const customerOrdersList = document.getElementById("customerOrdersList");

  const currentPhone = localStorage.getItem("last_client_phone");
  const currentTable = localStorage.getItem("last_client_table");
  const allOrders = JSON.parse(localStorage.getItem("restaurant_orders")) || [];

  if (!currentPhone || !currentTable) {
    statusSection.style.display = "none";
    return;
  }

  const myActiveOrders = allOrders.filter(
    (o) => o.clientPhone === currentPhone && o.tableNumber === currentTable,
  );

  if (myActiveOrders.length === 0) {
    statusSection.style.display = "none";
    return;
  }

  statusSection.style.display = "block";
  customerOrdersList.innerHTML = "";

  myActiveOrders.forEach((order) => {
    let statusClass = "status-pending";
    if (order.status === "Хийгдэж буй") statusClass = "status-cooking";
    if (order.status === "Бэлэн болсон") statusClass = "status-ready";

    customerOrdersList.innerHTML += `
            <div class="customer-status-row">
                <div class="customer-status-info">
                    <strong>${order.foodName}</strong> <span style="color:#666;">(${order.quantity}ш)</span>
                    <div style="font-size:0.75rem; color:#888; margin-top:2px;">🕒 Захиалсан: ${order.date}</div>
                </div>
                <span class="status-badge ${statusClass}">${order.status}</span>
            </div>
        `;
  });
}

function changeQty(index, change) {
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateCartBadge();
  openCartModal();
}

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
}

// ЗАХИАЛГА ИЛГЭЭХ (Нэрийг хассан)
function submitOrder(event) {
  event.preventDefault();
  if (cart.length === 0) return;

  const clientTable = document.getElementById("clientTable").value;
  const clientPhone = document.getElementById("clientPhone").value;

  // Огноог арай богино бөгөөд тодорхой формат руу шилжүүлэх (Жишээ нь: 14:35)
  const now = new Date();
  const orderDate = now.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let orders = JSON.parse(localStorage.getItem("restaurant_orders")) || [];

  cart.forEach((item) => {
    orders.push({
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      tableNumber: clientTable,
      foodName: item.name,
      foodPrice: item.price.toLocaleString("mn-MN") + "₮",
      clientPhone: clientPhone,
      quantity: item.quantity,
      date: orderDate,
      status: "Хүлээгдэж буй",
    });
  });

  localStorage.setItem("restaurant_orders", JSON.stringify(orders));

  localStorage.setItem("last_client_phone", clientPhone);
  localStorage.setItem("last_client_table", clientTable);

  cart = [];
  saveCart();
  updateCartBadge();

  alert(`Ширээ ${clientTable} - Захиалга амжилттай илгээгдлээ!`);
  openCartModal();
}
