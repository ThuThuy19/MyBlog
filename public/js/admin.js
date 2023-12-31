(function () {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim();
    if (all) {
      return [...document.querySelectorAll(el)];
    } else {
      return document.querySelector(el);
    }
  };

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    if (all) {
      select(el, all).forEach((e) => e.addEventListener(type, listener));
    } else {
      select(el, all).addEventListener(type, listener);
    }
  };

  /**
   * Easy on scroll event listener
   */
  const onscroll = (el, listener) => {
    el.addEventListener("scroll", listener);
  };

  /**
   * Sidebar toggle
   */
  if (select(".toggle-sidebar-btn")) {
    on("click", ".toggle-sidebar-btn", function (e) {
      select("body").classList.toggle("toggle-sidebar");
    });
  }

  /**
   * Search bar toggle
   */
  if (select(".search-bar-toggle")) {
    on("click", ".search-bar-toggle", function (e) {
      select(".search-bar").classList.toggle("search-bar-show");
    });
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select("#navbar .scrollto", true);
  const navbarlinksActive = () => {
    let position = window.scrollY + 200;
    navbarlinks.forEach((navbarlink) => {
      if (!navbarlink.hash) return;
      let section = select(navbarlink.hash);
      if (!section) return;
      if (
        position >= section.offsetTop &&
        position <= section.offsetTop + section.offsetHeight
      ) {
        navbarlink.classList.add("active");
      } else {
        navbarlink.classList.remove("active");
      }
    });
  };
  window.addEventListener("load", navbarlinksActive);
  onscroll(document, navbarlinksActive);

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select("#header");
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add("header-scrolled");
      } else {
        selectHeader.classList.remove("header-scrolled");
      }
    };
    window.addEventListener("load", headerScrolled);
    onscroll(document, headerScrolled);
  }

  /**
   * Back to top button
   */
  let backtotop = select(".back-to-top");
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add("active");
      } else {
        backtotop.classList.remove("active");
      }
    };
    window.addEventListener("load", toggleBacktotop);
    onscroll(document, toggleBacktotop);
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const deleteButtons = document.querySelectorAll("#btn__Delete");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const postId = button.getAttribute("data-id");

      if (confirm("Bạn có chắc muốn xóa bài đăng này?")) {
        try {
          const response = await fetch(`/delete/${postId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            alert("Bài đăng đã được xóa thành công");
            location.reload();
          } else {
            alert("Lỗi xóa bài đăng");
          }
        } catch (error) {
          console.error("Lỗi xóa bài đăng:", error);
          alert("Lỗi xóa bài đăng");
        }
      }
    });
  });
});

// Upload avatar image
async function uploadImage() {
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];

  if (file.size > 25 * 1024 * 1024) {
    alert("Image size should be less than 25MB");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch("/edit-profile", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("Image URL:", data.imageUrl);
  } catch (error) {
    console.error("Error uploading image:", error);
  }
}

document
  .getElementById("imagePutIcon")
  .addEventListener("click", function (event) {
    event.preventDefault();
    // active file input when click icon
    document.getElementById("imageInput").click();
  });

document
  .getElementById("imageInput")
  .addEventListener("change", function (event) {
    // Xử lý sự kiện change của file input
    const files = event.target.files;
  });
imageInput.addEventListener("change", function (event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      imageDisplay.src = e.target.result;
      imageDisplay.style.display = "block";
    };

    reader.readAsDataURL(file);
  }
});
