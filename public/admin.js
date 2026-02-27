const form = document.getElementById("menuForm");
const imageInput = form.querySelector('input[name="image"]');
const imagePreview = document.getElementById("imagePreview");

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.style.display = "none";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  const res = await fetch("/add-menu", {
    method: "POST",
    body: formData,
  });

  const result = await res.json();

  if (result.success) {
    alert("Амжилттай нэмэгдлээ!");
    form.reset();
    imagePreview.style.display = "none";
    loadMenu();
  } else {
    alert(result.error || "Алдаа гарлаа");
  }
});

async function loadMenu() {
  const tbody = document.querySelector("#menuTable tbody");
  tbody.innerHTML = "";

  const res = await fetch("/menu");
  const data = await res.json();

  data.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.id}</td>
      <td>${
        item.image_url ? `<img src="${item.image_url}" width="50"/>` : "-"
      }</td>
      <td contenteditable="true">${item.name}</td>
      <td contenteditable="true">${item.ingredients || ""}</td>
      <td contenteditable="true">${item.price}</td>
      <td contenteditable="true">${item.kcal || ""}</td>
      <td contenteditable="true">${item.icons || ""}</td>
      <td contenteditable="true">${item.category}</td>
      <td>
        <button onclick="updateItem(${item.id}, this)">Save</button>
        <button onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

loadMenu();

async function updateItem(id, btn) {
  const row = btn.parentElement.parentElement;

  const payload = {
    name: row.children[2].innerText,
    ingredients: row.children[3].innerText,
    price: row.children[4].innerText,
    kcal: row.children[5].innerText,
    icons: row.children[6].innerText,
    category: row.children[7].innerText,
  };

  await fetch(`/menu/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  loadMenu();
}

async function deleteItem(id) {
  if (confirm("Delete this item?")) {
    await fetch(`/menu/${id}`, { method: "DELETE" });
    loadMenu();
  }
}
