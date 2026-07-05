const Friends = {
  async render() {
    const friendList = DOM.el("friendList");
    const favoriteList = DOM.el("favoriteList");
    const blockedList = DOM.el("blockedList");

    if (!API.ready || !Auth.user) {
      if (friendList) friendList.innerHTML = "<p class='muted'>Connecte-toi.</p>";
      return;
    }

    const friends = await API.listSocial("friends", Auth.user.id, "friend_id");
    const favorites = await API.listSocial("favorites", Auth.user.id, "favorite_id");
    const blocked = await API.listSocial("blocks", Auth.user.id, "blocked_id");
    const requests = await API.listFriendRequests(Auth.user.id);

    if (friendList) {
      friendList.innerHTML = `
        <h3>Demandes reçues</h3>
        ${this.requests(requests)}
        <h3>Mes amis</h3>
        ${this.list(friends)}
      `;
    }

    if (favoriteList) favoriteList.innerHTML = this.list(favorites);
    if (blockedList) blockedList.innerHTML = this.list(blocked);

    DOM.text("statFriends", friends.length);
  },

  list(items) {
    return items.length
      ? items.map(person => `
        <div class="card">
          <b>${person.pseudo}</b>
          <p>${person.age} ans • ${person.country}</p>
        </div>
      `).join("")
      : "<p class='muted'>Aucun.</p>";
  },

  requests(items) {
    return items.length
      ? items.map(request => {
        const sender = API.profile(request.sender);
        return `
          <div class="card">
            <b>${sender.pseudo}</b>
            <p>veut t'ajouter en ami.</p>
            <button class="btn" onclick="Friends.accept('${request.id}')">Accepter</button>
            <button class="btn ghost" onclick="Friends.refuse('${request.id}')">Refuser</button>
          </div>
        `;
      }).join("")
      : "<p class='muted'>Aucune demande.</p>";
  },

  async accept(requestId) {
    await API.acceptFriendRequest(requestId);
    await this.render();
    alert("Demande acceptée.");
  },

  async refuse(requestId) {
    await API.refuseFriendRequest(requestId);
    await this.render();
    alert("Demande refusée.");
  }
};
