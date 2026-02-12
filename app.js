// Swiper init
const swiperTestimonial = new Swiper(".testimonial__swiper", {
  loop: true,
  slidesPerView: "auto",
  centeredSlides: true,
  spaceBetween: 16,
  grabCursor: true,
  speed: 600,
  effect: "coverflow",
  coverflowEffect: { rotate: 0, depth: 500, modifier: 1, slideShadows: true },
  pagination: { el: ".swiper-pagination", clickable: true },
  autoplay: { delay: 99999, disableOnInteraction: false },
});

// Generate category buttons dynamically
const categories = [
  "all",
  "lunch",
  "salad",
  "soup",
  "european",
  "mongolian",
  "cocktail",
  "share",
];
const catWrapper = document.querySelector(".menu__categories");

categories.forEach((cat) => {
  const btn = document.createElement("button");
  btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  btn.dataset.category = cat;
  if (cat === "all") btn.classList.add("active");
  catWrapper.appendChild(btn);
});

// Render cards function
const wrapper = document.getElementById("menu-wrapper");
function renderCards(category = "all") {
  wrapper.innerHTML = "";
  const filtered =
    category === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === category);

  filtered.forEach((item) => {
    const card = document.createElement("article");
    card.classList.add("testimonial__card", "swiper-slide");
    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="testimonial__img" />
      <h3 class="testimonial__name">${item.name}</h3>
      <div class="testimonial__rating">
        <div class="testimonial__stars">${'<i class="ri-star-fill"></i>'.repeat(item.rating)}</div>
        <h3 class="testimonial__number">${item.rating.toFixed(1)}</h3>
      </div>
      <p class="testimonial__description">${item.description}</p>
      <h1>Price ${item.price}₮</h1>
    `;
    wrapper.appendChild(card);
  });

  swiperTestimonial.update(); // refresh swiper
}

// Initial render
renderCards();

// Category filter
document.querySelectorAll(".menu__categories button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".menu__categories button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderCards(btn.dataset.category);
  });
});
