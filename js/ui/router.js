const Router = {
  init() {
    document.querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", () => this.show(button.dataset.page));
    });

    DOM.el("menuToggle")?.addEventListener("click", event => {
      event.stopPropagation();
      DOM.el("navPopover")?.classList.toggle("open");
    });

    document.addEventListener("click", event => {
      const popover = DOM.el("navPopover");
      if (popover && !popover.contains(event.target) && event.target.id !== "menuToggle") {
        popover.classList.remove("open");
      }
    });
  },

  show(page) {
    document.querySelectorAll(".page").forEach(element => element.classList.remove("active"));
    DOM.el(page)?.classList.add("active");

    document.querySelectorAll(".icon-nav button,.nav-popover button").forEach(button => {
      button.classList.toggle("active", button.dataset.page === page);
    });

    DOM.el("navPopover")?.classList.remove("open");
  }
};
