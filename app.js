const wrapper = document.getElementById("menu-wrapper");

// Swiper init
const swiperTestimonial = new Swiper(".testimonial__swiper", {
  loop: false,
  slidesPerView: "auto",
  centeredSlides: true,
  spaceBetween: 24,
  grabCursor: true,
  speed: 600,
  effect: "coverflow",
  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 0,
    modifier: 1,
    slideShadows: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

// Render cards overlay мэдээлэлтэй, price ард icons, kcal нэмсэн
function renderCards() {
  wrapper.innerHTML = "";
  menuItems.forEach((item) => {
    const card = document.createElement("article");
    card.classList.add("testimonial__card", "swiper-slide");

    const iconsString = item.icons.join(" ");

    card.innerHTML = `
  <img src="${item.image}" alt="${item.name}" class="testimonial__img" />
  <div class="testimonial__overlay">
    <h3 class="testimonial__name">${item.name}</h3>
    <p class="testimonial__description">
      ${item.ingredients.join(", ")}
    </p>
    <div class="testimonial__extra">
      <div class="testimonial__price-icons">
        <span class="testimonial__price">${item.price}</span>
        <span class="testimonial__icons">${item.icons.join("")}</span>
      </div>
      <span class="testimonial__kcal">${item.kcal} kcal</span>
    </div>
  </div>
`;

    wrapper.appendChild(card);
  });
  swiperTestimonial.update();
}

// Initial render
renderCards();
