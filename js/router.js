const Router = {
  init() {
    document.querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", () => this.show(button.dataset.page));
    });
  },

  show(pageId) {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.remove("page-active");
    });

    const page = document.getElementById(pageId);
    if (page) page.classList.add("page-active");

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.dataset.page === pageId);
    });
  }
};
