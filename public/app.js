const wrapper = document.getElementById("menu-wrapper");
const cartDiv = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

let swiper;
let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  swiper = new Swiper(".testimonial__swiper", {
    loop: false,
    slidesPerView: "auto",
    centeredSlides: true,
    spaceBetween: 24,
    grabCursor: true,
    pagination: { el: ".swiper-pagination", clickable: true },
  });
});

async function loadMenu(category) {
  const res = await fetch("/menu/" + category);
  const data = await res.json();
  wrapper.innerHTML = "";

  data.forEach((item) => {
    wrapper.innerHTML += `
      <div class="swiper-slide testimonial__card">
        <img src="${item.image_url}" class="testimonial__img"/>
        <div class="testimonial__overlay">
          <h3>${item.name}</h3>
          <p>${item.ingredients || ""}</p>
          <span>${item.price}₮</span>
          <button onclick='addToCart(${JSON.stringify(item)})'>Order</button>
        </div>
      </div>
    `;
  });
  if (swiper) swiper.update();
}

function addToCart(item) {
  const exist = cart.find((i) => i.id === item.id);
  if (exist) {
    exist.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  updateCart();
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  updateCart();
}

function updateCart() {
  cartDiv.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;
    cartDiv.innerHTML += `
      <div class="cart-item">
        <span>${item.name} x ${item.qty}</span>
        <div>
          <button onclick="changeQty(${item.id},1)">+</button>
          <button onclick="changeQty(${item.id},-1)">-</button>
          <button onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      </div>
    `;
  });

  cartTotal.textContent = "Total: " + total + "₮";
}

async function submitOrder() {
  if (!cart.length) return alert("Cart empty");
  const table = document.getElementById("tableNumber").value;
  if (!table) return alert("Enter table number");

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const res = await fetch("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table_number: table,
      items: cart,
      total_price: total,
    }),
  });

  const result = await res.json();
  if (result.success) {
    alert("Order sent!");
    cart = [];
    updateCart();
  }
}
