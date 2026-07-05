const Messages = {
  current: null,
  sub: null,

  init() {
    DOM.el("sendFriendMessage")?.addEventListener("click", () => this.send());

    DOM.el("friendMessageInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter") this.send();
    });

    DOM.el("friendEmojiBtn")?.addEventListener("click", () => {
      const input = DOM.el("friendMessageInput");
      if (input) input.value += "😊";
    });

    this.renderConversations();
  },

  async renderConversations() {
    const box = DOM.el("conversationList");
    if (!box) return;

    if (!API.ready || !Auth.user) {
      box.innerHTML = "<p class='muted'>Connecte-toi.</p>";
      return;
    }

    const conversations = await API.listFriendConversations(Auth.user.id);

    box.innerHTML = conversations.length
      ? conversations.map(conversation => `
        <button class="conversation-btn" onclick="Messages.open('${conversation.id}')">
          ${conversation.other?.avatar_url ? `<img src="${conversation.other.avatar_url}" class="avatar-img">` : "👤"}
          <span>${conversation.other?.pseudo || "Utilisateur"}</span>
        </button>
      `).join("")
      : "<p class='muted'>Aucune conversation.</p>";
  },

  async open(conversationId) {
    if (this.sub) {
      this.sub.unsubscribe?.();
      this.sub = null;
    }

    const conversations = await API.listFriendConversations(Auth.user.id);
    this.current = conversations.find(c => c.id === conversationId) || { id: conversationId };

    DOM.text("friendChatTitle", this.current.other ? "Conversation avec " + this.current.other.pseudo : "Conversation");
    await this.renderMessages();

    this.sub = API.subFriendMessages(conversationId, async () => {
      await this.renderMessages();
    });
  },

  async renderMessages() {
    if (!this.current?.id) return;

    const messages = await API.listFriendMessages(this.current.id);
    DOM.html("friendMessages", messages.map(message => this.messageHTML(message)).join(""));

    const box = DOM.el("friendMessages");
    if (box) box.scrollTop = box.scrollHeight;
  },

  messageHTML(message) {
    const isMe = message.sender_id === Auth.user.id;
    const pseudo = isMe ? "Moi" : (message.profiles?.pseudo || "Utilisateur");
    return `<div class="bubble ${isMe ? "me" : ""}"><b>${pseudo}</b>${message.body || ""}</div>`;
  },

  async send() {
    const input = DOM.el("friendMessageInput");
    const text = input?.value.trim();

    if (!text || !this.current?.id) return;

    await API.sendFriendMessage(this.current.id, Auth.user.id, text);
    input.value = "";
  }
};
