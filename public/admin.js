const form = document.getElementById("menuForm");
const imageInput = form.querySelector('input[name="image"]');
const imagePreview = document.getElementById("imagePreview");

// =============== IMAGE PREVIEW =================
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src = "";
    imagePreview.style.display = "none";
  }
});

// =============== ADD ITEM =================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  try {
    const response = await fetch("/add-menu", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      alert("Амжилттай нэмэгдлээ!");
      form.reset();
      imagePreview.src = "";
      imagePreview.style.display = "none";
      loadMenu();
    } else {
      alert("Алдаа гарлаа");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});

// =============== LOAD MENU =================
async function loadMenu() {
  try {
    const res = await fetch("/menu");
    const data = await res.json();
    const tbody = document.querySelector("#menuTable tbody");
    tbody.innerHTML = "";

    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.id}</td>
        <td><img src="${item.image_url}" width="50"/></td>
        <td contenteditable="true">${item.name}</td>
        <td contenteditable="true">${item.ingredients}</td>
        <td contenteditable="true">${item.price}</td>
        <td contenteditable="true">${item.kcal}</td>
        <td contenteditable="true">${item.icons}</td>
        <td contenteditable="true">${item.category}</td>
        <td>
          <button onclick="updateItem(${item.id}, this)">Save</button>
          <button onclick="deleteItem(${item.id})">Delete</button>
        </td>`;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("LOAD MENU ERROR:", err);
  }
}

// =============== UPDATE ITEM =================
async function updateItem(id, btn) {
  const row = btn.parentElement.parentElement;
  const payload = {
    name: row.children[2].innerText,
    ingredients: row.children[3].innerText,
    price: row.children[4].innerText,
    kcal: row.children[5].innerText,
    icons: row.children[6].innerText,
    category: row.children[7].innerText.toLowerCase(), // lowercase
  };

  await fetch(`/menu/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  loadMenu();
}

// =============== DELETE ITEM =================
async function deleteItem(id) {
  if (confirm("Delete this item?")) {
    await fetch(`/menu/${id}`, { method: "DELETE" });
    loadMenu();
  }
}

// =============== INITIAL LOAD =================
loadMenu();
