const swiper = new Swiper(".swiper", {
  direction: "horizontal",
  loop: true,
  slidesPerGroup: 1,
  autoplay: {
    delay: 2000,
  },

  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },

  navigation: {
    nextEl: null,
    prevEl: null,
  },
});

const menu = document.querySelector(".menu__desktop");
function loadHeader() {
  if (menu) {
    if (window.scrollY > 350) {
      menu.style.position = "fixed";
      menu.style.top = "0";
      menu.style.width = "1077px";
      menu.style.padding = "0";
      menu.style.borderRadius = "0";
    } else {
      menu.style.position = "static";
      menu.style.marginTop = null;
      menu.style.borderRadius = null;
      menu.style.width = null;
    }
  }
}
window.addEventListener("scroll", loadHeader);


