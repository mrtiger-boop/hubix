const Shop = {
  items: ["ruby", "robot", "heart", "crown", "galaxy", "fire", "ice", "moon"].map((id, i) => ({
    id,
    name: id,
    price: [250, 350, 420, 900, 1300, 700, 700, 650][i],
    file: `assets/frames/frame-${id}.svg`
  })),

  init() {
    this.render();
  },

  render() {
    const grid = DOM.el("shopGrid");
    if (!grid) return;
    grid.innerHTML = this.items.map(item => `
      <div class="shop-item">
        <div class="shop-preview" style="background-image:url('${item.file}')"></div>
        <h3>${item.name}</h3>
        <p>💎 ${item.price}</p>
        <button class="btn ghost" disabled>Bientôt disponible</button>
      </div>
    `).join("");
  }
};
