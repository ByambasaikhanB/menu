// ===== DOM =====
const wrapper = document.getElementById("menu-wrapper");

// ===== SWIPER INIT =====
const swiperTestimonial = new Swiper(".testimonial__swiper", {
  loop: false,
  slidesPerView: "auto",
  centeredSlides: true,
  spaceBetween: 24,
  grabCursor: true,
  speed: 600,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

// ===== RENDER FUNCTION (CSS-тэй 100% таарна) =====
function renderCards(menuItems) {
  wrapper.innerHTML = "";

  menuItems.forEach((item) => {
    const card = document.createElement("article");
    card.classList.add("testimonial__card", "swiper-slide");

    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="testimonial__img" />

      <div class="testimonial__overlay">
        <h3 class="testimonial__name">
          ${item.name}
        </h3>

        <p class="testimonial__description">
          ${item.ingredients.join(", ")}
        </p>

        <div class="testimonial__extra">
          <div class="testimonial__price-icons">
            <span class="testimonial__price">
              ${item.price}
            </span>

            <span class="testimonial__icons">
              ${item.icons.join("")}
            </span>
          </div>

          <span class="testimonial__kcal">
            ${item.kcal} kcal
          </span>
        </div>
      </div>
    `;

    wrapper.appendChild(card);
  });

  swiperTestimonial.update();
}

// ===== GOOGLE SHEET CONFIG =====
const SHEET_ID = "1rqjCfmiDGdfvs3XKn0PaVx6wWy3RTd2Qh8DvDWmBRAI";

// ===== LOAD FUNCTION =====
async function loadMenu(sheetName) {
  try {
    const response = await fetch(
      `https://opensheet.elk.sh/${SHEET_ID}/${sheetName}`,
    );

    const data = await response.json();

    const menuItems = data.map((item) => ({
      image: item.image || "",
      name: item.name || "",
      ingredients: item.ingredients
        ? item.ingredients.split(",").map((i) => i.trim())
        : [],
      price: item.price ? item.price + "₮" : "",
      kcal: item.kcal ? Number(item.kcal) : 0,
      icons: item.icons ? item.icons.split(",").map((i) => i.trim()) : [],
    }));

    renderCards(menuItems);
  } catch (error) {
    console.error("ALDAA:", error);
  }
}
