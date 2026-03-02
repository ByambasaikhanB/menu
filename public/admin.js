const form = document.getElementById("menuForm");
const imageInput = form.querySelector('input[name="image"]');
const imagePreview = document.getElementById("imagePreview");

// ================= IMAGE PREVIEW =================
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) {
    imagePreview.style.display = "none";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

// ================= ADD MENU =================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  try {
    const res = await fetch("/add-menu", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("SERVER ERROR:", text);
      alert("Server error гарлаа. Console шалга.");
      return;
    }

    const result = await res.json();

    if (result.success) {
      alert("Амжилттай нэмэгдлээ!");
      form.reset();
      imagePreview.style.display = "none";
      loadMenu();
    } else {
      alert(result.error || "Алдаа гарлаа");
    }
  } catch (err) {
    console.error("FETCH ERROR:", err);
    alert("Network error гарлаа");
  }
});

// ================= LOAD MENU =================
async function loadMenu() {
  const tbody = document.querySelector("#menuTable tbody");
  tbody.innerHTML = "";

  try {
    const res = await fetch("/menu");

    if (!res.ok) {
      const text = await res.text();
      console.error("LOAD ERROR:", text);
      alert("Menu ачааллах үед алдаа гарлаа");
      return;
    }

    let data = await res.json();

    // ==========================
    // Гараар дараалал удирдах
    // id их → эхэнд
    data.sort((a, b) => b.id - a.id);
    // ==========================

    data.forEach((item) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item.id}</td>
        <td contenteditable="true">${item.sort_order || 0}</td>
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

      // IMAGE PREVIEW (ROW)
      const imageInputRow = row.querySelector(".imageInput");
      const previewImg = row.querySelector(".previewImg");

      imageInputRow.addEventListener("change", () => {
        const file = imageInputRow.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          previewImg.style.display = "block";
        };
        reader.readAsDataURL(file);
      });

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("LOAD FETCH ERROR:", err);
    alert("Network error гарлаа");
  }
}

loadMenu();

// ================= UPDATE =================
async function updateItem(id, btn) {
  const row = btn.closest("tr");
  const imageInput = row.querySelector(".imageInput");

  const formData = new FormData();

  formData.append("sort_order", row.children[1].innerText.trim());
  formData.append("name", row.children[3].innerText.trim());
  formData.append("ingredients", row.children[4].innerText.trim());
  formData.append("price", row.children[5].innerText.trim());
  formData.append("kcal", row.children[6].innerText.trim());
  formData.append("icons", row.children[7].innerText.trim());
  formData.append("category", row.children[8].innerText.trim());

  if (imageInput.files[0]) {
    formData.append("image", imageInput.files[0]);
  }

  try {
    const res = await fetch(`/menu/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("UPDATE ERROR:", text);
      alert("Update хийх үед алдаа гарлаа");
      return;
    }

    alert("Амжилттай хадгалагдлаа");
    loadMenu();
  } catch (err) {
    console.error("UPDATE FETCH ERROR:", err);
    alert("Network error");
  }
}

// ================= DELETE =================
async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;

  try {
    const res = await fetch(`/menu/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("DELETE ERROR:", text);
      alert("Delete үед алдаа гарлаа");
      return;
    }

    loadMenu();
  } catch (err) {
    console.error("DELETE FETCH ERROR:", err);
    alert("Network error");
  }
}
