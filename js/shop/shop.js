const Shop = {
  items: [
    ["ruby", "Rubis", 250],
    ["robot", "Robot", 350],
    ["heart", "Cœur", 420],
    ["dragon", "Dragon", 900],
    ["crown", "Roi", 1200],
    ["galaxy", "Galaxy", 1300],
    ["fire", "Feu", 700],
    ["ice", "Glace", 700],
    ["angel", "Ange", 850],
    ["demon", "Démon", 850],
    ["moon", "Lune", 650],
    ["cloud", "Nuage", 600]
  ].map(([id, name, price]) => ({ id, name, price, file: `assets/frames/frame-${id}.svg` })),

  init() {
    if (!HubixLocal.get("hubix_wallet", null)) {
      HubixLocal.set("hubix_wallet", { coins: 2500, ownedFrames: [], equippedFrame: null });
    }
    this.render();
  },

  wallet() {
    return HubixLocal.get("hubix_wallet", { coins: 2500, ownedFrames: [], equippedFrame: null });
  },

  save(wallet) {
    HubixLocal.set("hubix_wallet", wallet);
    this.render();
    Match.updateStats();
  },

  render() {
    const wallet = this.wallet();
    DOM.text("coinAmount", wallet.coins.toLocaleString("fr-FR"));

    const grid = DOM.el("shopGrid");
    if (!grid) return;

    grid.innerHTML = this.items.map(item => {
      const owned = wallet.ownedFrames.includes(item.id);
      const equipped = wallet.equippedFrame === item.id;

      return `
        <article class="shop-card">
          <div class="shop-preview" style="background-image:url('${item.file}')"></div>
          <h3>${item.name}</h3>
          <p>Cadre de profil Hubix.</p>
          <div class="shop-price">💎 ${item.price} coins</div>
          <button class="${owned ? "owned" : ""}" onclick="${owned ? `Shop.equip('${item.id}')` : `Shop.buy('${item.id}')`}">
            ${equipped ? "Équipé" : owned ? "Équiper" : "Acheter"}
          </button>
        </article>
      `;
    }).join("");
  },

  buy(id) {
    const item = this.items.find(x => x.id === id);
    const wallet = this.wallet();

    if (!item) return;
    if (wallet.ownedFrames.includes(id)) return this.equip(id);
    if (wallet.coins < item.price) return alert("Pas assez de coins.");

    wallet.coins -= item.price;
    wallet.ownedFrames.push(id);
    wallet.equippedFrame = id;
    this.save(wallet);
    Profile.render();
  },

  equip(id) {
    const wallet = this.wallet();
    wallet.equippedFrame = id;
    this.save(wallet);
    Profile.render();
  },

  getEquipped() {
    const wallet = this.wallet();
    return this.items.find(x => x.id === wallet.equippedFrame);
  },

  getOwnedItems() {
    const wallet = this.wallet();
    return this.items.filter(x => wallet.ownedFrames.includes(x.id));
  },

  getRandomFrame() {
    return this.items[Math.floor(Math.random() * this.items.length)];
  }
};
