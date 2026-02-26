// app.js
const wrapper = document.getElementById("menu-wrapper");
const swiper = new Swiper(".testimonial__swiper", {
  loop: false,
  slidesPerView: "auto",
  centeredSlides: true,
  spaceBetween: 24,
  grabCursor: true,
  pagination: { el: ".swiper-pagination", clickable: true },
});

async function loadMenu(category) {
  try {
    const res = await fetch(`/menu/${category}`);
    const data = await res.json();
    wrapper.innerHTML = "";
    data.forEach((item) => {
      wrapper.innerHTML += `
        <div class="swiper-slide testimonial__card">
          <img src="${item.image_url}" class="testimonial__img"/>
          <div class="testimonial__overlay">
            <h3>${item.name}</h3>
            <p>${item.ingredients || ""}</p>
            <div class="testimonial__extra">
              <div class="testimonial__price-icons">
                <span class="testimonial__price">${Number(item.price)}₮</span>
                <span class="testimonial__icons">${item.icons || ""}</span>
              </div>
              <span class="testimonial__kcal">
  ${item.kcal ? item.kcal + " kcal" : ""}
</span>
            </div>
          </div>
        </div>
      `;
    });
    swiper.update();
  } catch (err) {
    console.error(err);
  }
}
