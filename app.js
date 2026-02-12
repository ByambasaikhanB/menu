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

// JSON data
const menuItems = [
  {
    category: "lunch",
    name: "ГЭР АРГААР ШАРСАН ТӨМС",
    image: "/images/4824ae5f-06ca-42b2-8b80-138bebcfa997.jfif",
    rating: 5,
    description: "",
    price: 15900,
  },
  {
    category: "lunch",
    name: "ШАРСАН ТӨМС",
    image: "/images/6920f044-a051-40ca-939a-825ef9289ca6.jfif",
    rating: 5,
    description: "",
    price: 17900,
  },
  {
    category: "salad",
    name: "БЯСЛАГ,БЕКОНТОЙ ШАРСАН ТӨМС",
    image: "/images/c65d9c0c-050a-4b7b-9da9-b3d85b08e6e1.jfif",
    rating: 5,
    description: "",
    price: 29900,
  },
  {
    category: "european",
    name: "Burger",
    image: "/images/share/61e92129-a236-4f0e-b475-833ae84918ce.jfif",
    rating: 5,
    description: "",
    price: 9000,
  },
  {
    category: "mongolian",
    name: "Buuz",
    image: "/images/d6a482dc-9aa5-4caf-865a-48946bccd148.jfif",
    rating: 5,
    description: "",
    price: 18000,
  },
  {
    category: "cocktail",
    name: "Baby Blue",
    image: "/images/coctail/89e606c3-e9fe-4987-a74c-545aea95a102.jfif",
    rating: 5,
    description: "VODKA, GIN,PEACH TEA, EGG WHITE",
    price: 21000,
  },
  {
    category: "cocktail",
    name: "Whiskey Sour",
    image: "/images/coctail/32a83be1-f2d0-4e11-99ad-22a040cda17b.jfif",
    rating: 5,
    description: "WHISKEY, JUICE,LEMON SYRUP, EGG WHITE",
    price: 18000,
  },
  {
    category: "cocktail",
    name: "Lemon Margarita",
    image: "/images/coctail/26d99a81-1206-4892-891a-3f6be1bf83b9.jfif",
    rating: 5,
    description: "TEQUILA, MINT SYRUP, LEMON SYRUP",
    price: 20000,
  },
  {
    category: "cocktail",
    name: "Cosmopolitan",
    image: "/images/coctail/14bf45cc-6201-43cf-9354-f674b2c8ade8.jfif",
    rating: 5,
    description: "vodka, cherry juice,lemon syrup",
    price: 15000,
  },
];

// Generate category buttons dynamically
const categories = [
  "all",
  "lunch",
  "salad",
  "soup",
  "european",
  "mongolian",
  "cocktail",
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
