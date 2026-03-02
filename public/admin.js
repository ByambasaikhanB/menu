const form = document.getElementById("menuForm");
const imageInput = form.querySelector('input[name="image"]');
const imagePreview = document.getElementById("imagePreview");

// IMAGE PREVIEW
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return (imagePreview.style.display = "none");

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

// ADD MENU
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  try {
    const res = await fetch("/add-menu", { method: "POST", body: formData });
    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      alert("Server error");
      return;
    }
    const result = await res.json();
    if (result.success) {
      alert("Амжилттай нэмэгдлээ!");
      form.reset();
      imagePreview.style.display = "none";
      loadMenu();
    } else alert(result.error || "Алдаа гарлаа");
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
});

// LOAD MENU
async function loadMenu() {
  const tbody = document.querySelector("#menuTable tbody");
  tbody.innerHTML = "";

  try {
    const res = await fetch("/menu");
    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      alert("Menu ачааллахад алдаа гарлаа");
      return;
    }
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

      // IMAGE PREVIEW FOR ROW
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
    console.error(err);
    alert("Network error");
  }
}

loadMenu();

// UPDATE
async function updateItem(id, btn) {
  const row = btn.closest("tr");
  const imageInput = row.querySelector(".imageInput");

  const formData = new FormData();
  formData.append("name", row.children[2].innerText.trim());
  formData.append("ingredients", row.children[3].innerText.trim());
  formData.append("price", row.children[4].innerText.trim());
  formData.append("kcal", row.children[5].innerText.trim());
  formData.append("icons", row.children[6].innerText.trim());
  formData.append("category", row.children[7].innerText.trim());

  if (imageInput.files[0]) formData.append("image", imageInput.files[0]);

  try {
    const res = await fetch(`/menu/${id}`, { method: "PUT", body: formData });
    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      alert("Update алдаа гарлаа");
      return;
    }
    alert("Амжилттай хадгалагдлаа");
    loadMenu();
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
}

// DELETE
async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;

  try {
    const res = await fetch(`/menu/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      alert("Delete алдаа гарлаа");
      return;
    }
    loadMenu();
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
}
