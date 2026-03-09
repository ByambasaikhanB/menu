// App.js
// ================= GLOBAL VARIABLES =================
let cart = [];
const cartItems = document.getElementById("cart-items");
const cartTotal = document.querySelector(".cart-total");
const tableInput = document.getElementById("tableNumber");

// ================= LOAD MENU =================
async function loadMenu(category = "food", wrapperId = "menu-wrapper") {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  try {
    const res = await fetch(`/menu/${category}`);
    if (!res.ok) throw new Error("Cannot load menu");
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
      </div>`;
    });
  } catch (err) {
    console.error(err);
  }
}

// ================= CART FUNCTIONS =================
function addToCart(item) {
  cart.push(item);
  renderCart();
  alert(item.name + " added");
}

function renderCart() {
  if (!cartItems || !cartTotal) return;
  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach((item, i) => {
    total += Number(item.price);
    cartItems.innerHTML += `
      <div class="cart-item">
        <span>${item.name} (${item.price}₮)</span>
        <span class="cart-remove" onclick="removeCart(${i})">x</span>
      </div>`;
  });
  cartTotal.innerText = "Total: " + total + "₮";
}

function removeCart(index) {
  cart.splice(index, 1);
  renderCart();
}

// ================= SUBMIT ORDER =================
async function submitOrder() {
  if (!cart.length) return alert("Cart empty");
  if (!tableInput || !tableInput.value) return alert("Enter table number");
  const total = cart.reduce((sum, i) => sum + Number(i.price), 0);

  try {
    const res = await fetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_number: tableInput.value,
        items: cart,
        total_price: total,
      }),
    });
    const result = await res.json();
    if (result.success) {
      alert("Order sent!");
      cart = [];
      renderCart();
    } else {
      alert("Error: " + (result.error || "unknown"));
    }
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
}

// ================= ADMIN FUNCTIONS =================
async function updateItem(id, row) {
  const formData = new FormData();
  formData.append("name", row.children[3].innerText.trim());
  formData.append("ingredients", row.children[4].innerText.trim());
  formData.append("price", row.children[5].innerText.trim());
  formData.append("category", row.children[8].innerText.trim());

  const imgInput = row.querySelector(".imageInput");
  if (imgInput && imgInput.files[0])
    formData.append("image", imgInput.files[0]);

  try {
    const res = await fetch(`/menu/${id}`, { method: "PUT", body: formData });
    if (!res.ok) throw new Error(await res.text());
    alert("Updated successfully");
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
}

async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;
  try {
    const res = await fetch(`/menu/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
}
