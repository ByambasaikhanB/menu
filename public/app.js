const wrapper = document.getElementById("menu-wrapper");

const swiper = new Swiper(".testimonial__swiper", {
  loop: false,
  slidesPerView: "auto",
  centeredSlides: true,
  spaceBetween: 24,
  grabCursor: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

async function loadMenu(category) {
  try {
    const res = await fetch(`/menu/${category}`);
    const data = await res.json();

    wrapper.innerHTML = "";

    data.forEach((item) => {
      const name = item.name || "";
      const image = item.image_url || "";
      const ingredients = item.ingredients || "";
      const price = item.price != null ? Number(item.price) : 0;
      const icons = item.icons || "";
      const kcal = item.kcal;

      wrapper.innerHTML += `
        <div class="swiper-slide testimonial__card">
          
          <img src="${image}" class="testimonial__img" />

          <div class="testimonial__overlay">
            <h3>${name}</h3>
            <p>${ingredients}</p>

            <div class="testimonial__extra">

              <div class="testimonial__price-icons">
                <span class="testimonial__price">${price}₮</span>
                <span class="testimonial__icons">${icons}</span>
              </div>

              ${
                kcal !== null &&
                kcal !== undefined &&
                String(kcal).trim() !== ""
                  ? `<span class="testimonial__kcal">${kcal} kcal</span>`
                  : ""
              }

            </div>
          </div>

        </div>
      `;
    });

    swiper.update();
  } catch (err) {
    console.error("Menu load error:", err);
  }
}
