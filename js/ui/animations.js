const HubixAnimations = {
  init() {
    this.revealCards();
    this.animatePageChange();
  },

  revealCards() {
    const elements = document.querySelectorAll(
      ".feature-card, .strip-item, .shop-card, .preview-card, .world-server, .settings-card, .auth-card, .auth-side"
    );

    elements.forEach((el, index) => {
      el.style.animationDelay = `${index * 38}ms`;
      el.classList.add("reveal");
    });
  },

  animatePageChange() {
    document.querySelectorAll("[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        setTimeout(() => this.revealCards(), 40);
      });
    });
  }
};
