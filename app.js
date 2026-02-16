// Swiper init
const swiperTestimonial = new Swiper(".testimonial__swiper", {
  loop: false,
  slidesPerView: "auto", // visible slides
  centeredSlides: true, // center single card
  spaceBetween: 24, // карт хооронд зай
  grabCursor: true, // cursor гүйлгэхэд
  speed: 600,
  effect: "coverflow", // coverflow эффект
  coverflowEffect: {
    rotate: 0, // эргэлт
    stretch: 0, // суналт
    depth: 0, // 3D гүн
    modifier: 1, // эффектын хүч
    slideShadows: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

// Render cards
const wrapper = document.getElementById("menu-wrapper");

function renderCards() {
  wrapper.innerHTML = "";
  menuItems.forEach((item) => {
    const card = document.createElement("article");
    card.classList.add("testimonial__card", "swiper-slide");
    card.innerHTML = `<img src="${item.image}" alt="" class="testimonial__img" />`;
    wrapper.appendChild(card);
  });
  swiperTestimonial.update();
}

// Initial render
renderCards();
