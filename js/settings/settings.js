const Settings = {
  init() {
    const toggle = DOM.el("themeToggle");
    if (!toggle) return;

    const light = localStorage.getItem("hubix-theme") === "light";
    this.apply(light);

    toggle.addEventListener("click", () => this.apply(!document.body.classList.contains("light-theme")));
  },

  apply(light) {
    document.body.classList.toggle("light-theme", light);
    const toggle = DOM.el("themeToggle");
    if (toggle) {
      toggle.classList.toggle("on", light);
      toggle.setAttribute("aria-pressed", String(light));
    }
    localStorage.setItem("hubix-theme", light ? "light" : "dark");
  }
};
