const Friends = {
  init() {
    this.render();
  },

  get(type) {
    return HubixLocal.get("hubix_" + type, []);
  },

  save(type, list) {
    HubixLocal.set("hubix_" + type, list);
    this.render();
    Match.updateStats();
  },

  names(type) {
    return this.get(type).map(person => person.pseudo || person.name);
  },

  add(type, person) {
    const list = this.get(type);
    const name = person.pseudo || person.name;

    if (!list.some(item => (item.pseudo || item.name) === name)) {
      list.push(person);
      this.save(type, list);
    }
  },

  remove(type, name) {
    const list = this.get(type).filter(person => (person.pseudo || person.name) !== name);
    this.save(type, list);
  },

  card(person, type) {
    const name = person.pseudo || person.name;
    return `
      <div class="person-card">
        <h3>${name}</h3>
        <p>${person.age || "?"} ans • ${person.country || "France"}<br>${person.bio || ""}</p>
        <button onclick="Friends.remove('${type}','${name}')">Supprimer</button>
      </div>
    `;
  },

  render() {
    const friends = DOM.el("friendList");
    const favorites = DOM.el("favoriteList");
    const blocked = DOM.el("blockedList");

    if (friends) friends.innerHTML = this.get("friends").map(p => this.card(p, "friends")).join("") || `<p class="muted">Aucun ami.</p>`;
    if (favorites) favorites.innerHTML = this.get("favorites").map(p => this.card(p, "favorites")).join("") || `<p class="muted">Aucun favori.</p>`;
    if (blocked) blocked.innerHTML = this.get("blocked").map(p => this.card(p, "blocked")).join("") || `<p class="muted">Aucun bloqué.</p>`;
  }
};
