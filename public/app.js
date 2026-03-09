const wrapper = document.getElementById("menu-wrapper");

const swiper = new Swiper(".testimonial__swiper", {
  slidesPerView: "auto",
  spaceBetween: 20,
});

let cart = [];

async function loadMenu(category) {
  const res = await fetch("/menu/" + category);

  const data = await res.json();

  wrapper.innerHTML = "";

  data.forEach((item) => {
    wrapper.innerHTML += `

<div class="swiper-slide">

<img src="${item.image_url}" width="200">

<h3>${item.name}</h3>

<p>${item.ingredients || ""}</p>

<p>${item.price}₮</p>

<button onclick='addToCart(${JSON.stringify(item)})'>

Order

</button>

</div>

`;
  });

  swiper.update();
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
