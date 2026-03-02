const form = document.getElementById("menuForm");
const imageInput = form.querySelector('input[name="image"]');
const imagePreview = document.getElementById("imagePreview");

// ================= IMAGE PREVIEW =================
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

// ================= ADD MENU =================
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

// ================= LOAD MENU =================
async function loadMenu() {
  const tbody = document.querySelector("#menuTable tbody");
  tbody.innerHTML = "";

  const res = await fetch("/menu");
  const data = await res.json();

  data.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.id}</td>
      <td>
        ${item.image_url ? `<img src="${item.image_url}" width="60"><br>` : "-"}
        <input type="file" class="imageInput" accept="image/*">
        <img class="previewImg" style="display:none;width:60px;margin-top:5px;">
      </td>
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

    // LIVE PREVIEW
    const imageInputRow = row.querySelector(".imageInput");
    const previewImg = row.querySelector(".previewImg");

    imageInputRow.addEventListener("change", () => {
      const file = imageInputRow.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          previewImg.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });

    tbody.appendChild(row);
  });
}

loadMenu();

// ================= UPDATE =================
async function updateItem(id, btn) {
  const row = btn.parentElement.parentElement;
  const imageInput = row.querySelector(".imageInput");

  const formData = new FormData();

  formData.append("name", row.children[2].innerText);
  formData.append("ingredients", row.children[3].innerText);
  formData.append("price", row.children[4].innerText);
  formData.append("kcal", row.children[5].innerText);
  formData.append("icons", row.children[6].innerText);
  formData.append("category", row.children[7].innerText);

  if (imageInput.files[0]) {
    formData.append("image", imageInput.files[0]);
  }

  await fetch(`/menu/${id}`, {
    method: "PUT",
    body: formData,
  });

  loadMenu();
}

// ================= DELETE =================
async function deleteItem(id) {
  if (confirm("Delete this item?")) {
    await fetch(`/menu/${id}`, { method: "DELETE" });
    loadMenu();
  }
}
