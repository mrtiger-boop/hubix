const Friends = {
  async render() {
    const friendList = DOM.el("friendList");
    const favoriteList = DOM.el("favoriteList");
    const blockedList = DOM.el("blockedList");

    if (!API.ready || !Auth.user) {
      if (friendList) friendList.innerHTML = "<div class='card empty-state'><span class='icon'>🔒</span>Connecte-toi pour voir tes amis.</div>";
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
        <div class="card">${this.friendsList(friends)}</div>
      `;
    }

    if (favoriteList) favoriteList.innerHTML = this.simpleList(favorites);
    if (blockedList) blockedList.innerHTML = this.simpleList(blocked);

    DOM.text("statFriends", friends.length);
  },

  avatarHTML(person) {
    return person.avatar_url
      ? `<img src="${person.avatar_url}" alt="">`
      : (person.pseudo?.[0]?.toUpperCase() || "?");
  },

  simpleList(items) {
    return items.length
      ? items.map(person => `
        <div class="card entity-card">
          <div class="avatar-sm">${this.avatarHTML(person)}</div>
          <div class="entity-info">
            <b>${person.pseudo}</b>
            <p>${person.age} ans • ${person.country}</p>
          </div>
        </div>
      `).join("")
      : "<div class='empty-state'><span class='icon'>🫥</span>Aucun profil ici pour l'instant.</div>";
  },

  friendsList(items) {
    return items.length
      ? items.map(person => `
        <div class="entity-card">
          <div class="avatar-sm">${this.avatarHTML(person)}</div>
          <div class="entity-info">
            <b>${person.pseudo}</b>
            <p>${person.age} ans • ${person.country}</p>
          </div>
          <div class="entity-actions">
            <button class="btn" onclick="Friends.openMessages('${person.id}')">💬 Message</button>
            <button class="btn ghost" onclick="Friends.comingSoon('Appel audio')">📞 Audio</button>
            <button class="btn ghost" onclick="Friends.comingSoon('Appel vidéo')">🎥 Vidéo</button>
            <button class="btn ghost" onclick="Friends.comingSoon('Photo')">📷 Photo</button>
            <button class="btn ghost" onclick="Friends.comingSoon('Cadeau')">🎁 Cadeau</button>
          </div>
        </div>
      `).join("")
      : "<div class='empty-state'><span class='icon'>👥</span>Aucun ami pour l'instant. Lance un Match pour en trouver !</div>";
  },

  requests(items) {
    return items.length
      ? items.map(request => {
        const sender = API.profile(request.sender);
        return `
          <div class="entity-card">
            <div class="avatar-sm">${this.avatarHTML(sender)}</div>
            <div class="entity-info">
              <b>${sender.pseudo}</b>
              <p>veut t'ajouter en ami</p>
            </div>
            <div class="entity-actions">
              <button class="btn" onclick="Friends.accept('${request.id}')">✅ Accepter</button>
              <button class="btn ghost" onclick="Friends.refuse('${request.id}')">❌ Refuser</button>
            </div>
          </div>
        `;
      }).join("")
      : "<p class='muted'>Aucune demande en attente.</p>";
  },

  async accept(requestId) {
    await API.acceptFriendRequest(requestId);
    await this.render();
    await Messages.renderConversations();
    alert("Demande acceptée.");
  },

  async refuse(requestId) {
    await API.refuseFriendRequest(requestId);
    await this.render();
    alert("Demande refusée.");
  },

  async openMessages(friendId) {
    try {
      Router.show("messages");
      const conversation = await API.getOrCreateFriendConversation(Auth.user.id, friendId);
      await Messages.open(conversation.id);
    } catch (error) {
      alert(error.message || "Impossible d'ouvrir la conversation.");
    }
  },

  comingSoon(name) {
    alert(name + " arrive dans une prochaine mise à jour.");
  }
};
