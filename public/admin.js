const form = document.getElementById("menuForm");
const imageInput = form.querySelector('input[name="image"]');
const imagePreview = document.getElementById("imagePreview");

// ================= IMAGE PREVIEW =================
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block"; // preview харагдана
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src = "";
    imagePreview.style.display = "none";
  }
});

// ================= FORM SUBMIT =================
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
    } else {
      alert("Алдаа гарлаа");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});
