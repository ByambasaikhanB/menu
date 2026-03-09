const wrapper = document.getElementById("menu-wrapper");

let swiper;
let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  swiper = new Swiper(".testimonial__swiper", {
    loop: false,

    slidesPerView: "auto",

    centeredSlides: true,

    spaceBetween: 24,

    grabCursor: true,

    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
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

<button onclick='addToCart(${JSON.stringify(item)})'>

Order

</button>

</div>

</div>

`;
  });

  if (swiper) swiper.update();
}

function addToCart(item) {
  cart.push(item);

  alert(item.name + " added");
}

async function submitOrder() {
  if (cart.length === 0) {
    alert("Cart empty");

    return;
  }

  const table = document.getElementById("tableNumber").value;

  if (!table) {
    alert("Table number");

    return;
  }

  const total = cart.reduce((sum, i) => sum + Number(i.price), 0);

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
    alert("Order sent");

    cart = [];
  }
}
