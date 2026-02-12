const swiperTestimonial = new Swiper(".testimonial__swiper", {
  loop: true,
  slidesPerView: "auto",
  centeredSlides: true,
  spaceBetween: 16,
  grabCursor: true,
  speed: 600,
  effect: "coverflow",

  coverflowEffect: {
    rotate: 0,
    depth: 500,
    modifier: 1,
    slideShadows: true,
  },

  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  autoplay: {
    delay: 99999,
    disableOnInteraction: false,
  },
});
// JSON өгөгдөл
const menuItems = [
  {
    name: "Төмс",
    image: "/images/4824ae5f-06ca-42b2-8b80-138bebcfa997.jfif",
    rating: 5,
    description: "aklhsdh alskda lksjdlak sjdalskdj alksjdlkashbdkljashd",
    price: 10000,
  },
  {
    name: "Пицца",
    image: "/images/6920f044-a051-40ca-939a-825ef9289ca6.jfif",
    rating: 5,
    description: "aklhsdhalskdajlksjdlak sjdalskdjalksjdlkashbdkljashd",
    price: 15000,
  },
  {
    name: "Spaghetti",
    image: "/images/c65d9c0c-050a-4b7b-9da9-b3d85b08e6e1.jfif",
    rating: 5,
    description: "aklhsdhalskdajlksjdlak sjdalskdjalksjdlkashbdkljashd",
    price: 12000,
  },
  {
    name: "Burger",
    image: "/images/d6a482dc-9aa5-4caf-865a-48946bccd148.jfif",
    rating: 5,
    description: "aklhsdhalskdajlksjdla ksjdalskdjalksjdlkashbdkljashd",
    price: 9000,
  },
];

// Card үүсгэх
const wrapper = document.getElementById("menu-wrapper");

menuItems.forEach((item) => {
  const card = document.createElement("article");
  card.classList.add("testimonial__card", "swiper-slide");

  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}" class="testimonial__img" />
    <h3 class="testimonial__name">${item.name}</h3>
    <div class="testimonial__rating">
      <div class="testimonial__stars">
        ${'<i class="ri-star-fill"></i>'.repeat(item.rating)}
      </div>
      <h3 class="testimonial__number">${item.rating.toFixed(1)}</h3>
    </div>
    <p class="testimonial__description">${item.description}</p>
    <h1>Price ${item.price}₮</h1>
  `;

  wrapper.appendChild(card);
});

// Swiper init
const swiper = new Swiper(".swiper", {
  slidesPerView: 1,
  spaceBetween: 20,
  loop: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  breakpoints: {
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
});
