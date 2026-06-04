const wrapper = document.getElementById("menu-wrapper");

let cart = [];

const swiper = new Swiper(".testimonial__swiper", {
  loop: false,
  slidesPerView: "auto",
  centeredSlides: true,
  spaceBetween: 24,
});

// ================= MENU LOAD =================
async function loadMenu(category) {
  const res = await fetch(`/menu/${category}`);
  const data = await res.json();

  wrapper.innerHTML = "";

  data.forEach((item) => {
    wrapper.innerHTML += `
      <div class="swiper-slide testimonial__card">

        <img src="${item.image_url}" class="testimonial__img" />

        <div class="testimonial__overlay">
          <h3>${item.name}</h3>
          <p>${item.ingredients || ""}</p>

          <div class="testimonial__extra">
            <span class="testimonial__price">${item.price}₮</span>
            <span>${item.kcal || ""}</span>
          </div>

          <button onclick='addToCart(${JSON.stringify(item)})'>
            Add to Cart
          </button>

        </div>
      </div>
    `;
  });

  swiper.update();
}

// ================= CART =================
function addToCart(item) {
  cart.push(item);
  updateCartUI();
}

function updateCartUI() {
  let total = 0;

  cart.forEach((i) => {
    total += Number(i.price);
  });

  let box = document.getElementById("cart-box");

  if (!box) {
    box = document.createElement("div");
    box.id = "cart-box";
    document.body.appendChild(box);
  }

  box.innerHTML = `
    <h3>Cart (${cart.length})</h3>
    ${cart.map((i) => `<div>${i.name} - ${i.price}₮</div>`).join("")}
    <hr/>
    <b>Total: ${total}₮</b>
    <br/>
    <input id="name" placeholder="Name"/>
    <input id="phone" placeholder="Phone"/>
    <button onclick="sendOrder()">ORDER</button>
  `;
}

// ================= SEND ORDER =================
async function sendOrder() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;

  let total = 0;
  cart.forEach((i) => (total += Number(i.price)));

  const res = await fetch("/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: name,
      phone,
      items: cart,
      total_price: total,
    }),
  });

  const data = await res.json();

  if (data.success) {
    alert("Order sent!");
    cart = [];
    document.getElementById("cart-box").remove();
  }
}
