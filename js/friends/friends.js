const FriendsPage = {
  users: ["Lina", "Max", "Noa", "Sarah", "Yanis", "AssoHope"],
  friends: [],

  init() {
    this.friends = HubixStorage.get("hubix_v01_friends", []);
    document.getElementById("searchFriendBtn").addEventListener("click", () => this.search());
    this.renderFriends();
  },

  search() {
    const query = document.getElementById("friendSearch").value.toLowerCase();
    const results = this.users.filter(user => user.toLowerCase().includes(query));

    document.getElementById("friendResults").innerHTML = results.map(name => `
      <article class="feature-card">
        <div class="icon">${name[0]}</div>
        <h3>${name}</h3>
        <p>Utilisateur Hubix</p>
        <button class="btn btn-primary" onclick="FriendsPage.add('${name}')">Ajouter</button>
      </article>
    `).join("") || `<article class="feature-card"><h3>Aucun résultat</h3><p>Essaie Lina, Max ou Noa.</p></article>`;
  },

  add(name) {
    if (!this.friends.includes(name)) this.friends.push(name);
    HubixStorage.set("hubix_v01_friends", this.friends);
    this.renderFriends();
  },

  remove(name) {
    this.friends = this.friends.filter(friend => friend !== name);
    HubixStorage.set("hubix_v01_friends", this.friends);
    this.renderFriends();
  },

  renderFriends() {
    document.getElementById("friendList").innerHTML = this.friends.map(name => `
      <article class="feature-card">
        <div class="icon">${name[0]}</div>
        <h3>${name}</h3>
        <p>Dans tes amis</p>
        <button class="btn btn-light" onclick="FriendsPage.remove('${name}')">Supprimer</button>
      </article>
    `).join("") || `<article class="feature-card"><h3>Aucun ami</h3><p>Recherche un pseudo pour ajouter quelqu’un.</p></article>`;
  }
};
