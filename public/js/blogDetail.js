let menu = document.querySelector(".menu__desktop");
function loadHeader() {
  if (menu) {
    if (window.scrollY > 50) {
      menu.style.position = "fixed";
      menu.style.top = "0";
      menu.style.margin = "0 auto";
      menu.style.width = "1077px";
      menu.style.padding = "0";
      menu.style.borderRadius = "0";
    } else {
      menu.style.position = "static";
      menu.style.marginTop = "100px";
      menu.style.borderRadius = "10px 10px 0 0";
      menu.style.width = "100%";
    }
  }
}
window.addEventListener("scroll", loadHeader);