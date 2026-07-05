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
        <div class="card">
          <h2>Demandes reçues</h2>
          ${this.requests(requests)}
        </div>
        <h2>Mes amis</h2>
        <div class="grid">${this.friendsList(friends)}</div>
      `;
    }

    if (favoriteList) favoriteList.innerHTML = this.simpleList(favorites);
    if (blockedList) blockedList.innerHTML = this.simpleList(blocked);

    DOM.text("statFriends", friends.length);
  },

  simpleList(items) {
    return items.length
      ? items.map(person => `
        <div class="card">
          <b>${person.pseudo}</b>
          <p>${person.age} ans • ${person.country}</p>
        </div>
      `).join("")
      : "<p class='muted'>Aucun.</p>";
  },

  friendsList(items) {
    return items.length
      ? items.map(person => `
        <div class="card">
          <b>${person.pseudo}</b>
          <p>${person.age} ans • ${person.country}</p>
          <button class="btn" onclick="Friends.openChat('${person.id}')">💬 Message privé</button>
          <button class="btn ghost" onclick="Friends.comingSoon('Appel audio')">📞 Audio</button>
          <button class="btn ghost" onclick="Friends.comingSoon('Appel vidéo')">🎥 Vidéo</button>
          <button class="btn ghost" onclick="Friends.comingSoon('Photo')">📷 Photo</button>
          <button class="btn ghost" onclick="Friends.comingSoon('Cadeau')">🎁 Cadeau</button>
        </div>
      `).join("")
      : "<p class='muted'>Aucun ami.</p>";
  },

  requests(items) {
    return items.length
      ? items.map(request => {
        const sender = API.profile(request.sender);
        return `
          <div class="card">
            <b>${sender.pseudo}</b>
            <p>veut t'ajouter en ami.</p>
            <button class="btn" onclick="Friends.accept('${request.id}')">✅ Accepter</button>
            <button class="btn ghost" onclick="Friends.refuse('${request.id}')">❌ Refuser</button>
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
  },

  async openChat(friendId) {
    try {
      const person = await API.openFriendChat(friendId);
      await Match.open(person);
    } catch (error) {
      alert(error.message || "Impossible d'ouvrir la conversation.");
    }
  },

  comingSoon(name) {
    alert(name + " arrive dans une prochaine mise à jour.");
  }
};
