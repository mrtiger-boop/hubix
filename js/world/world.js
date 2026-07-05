const World = {
  lang: "Français",
  server: 1,
  subscription: null,

  init() {
    document.querySelectorAll(".lang").forEach(button => {
      button.addEventListener("click", () => {
        this.lang = button.dataset.lang;
        document.querySelectorAll(".lang").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
        this.updateNames();
        this.render();
      });
    });
    document.querySelectorAll(".world-server").forEach(box => {
      box.addEventListener("click", () => {
        this.server = Number(box.dataset.server);
        document.querySelectorAll(".world-server").forEach(b => b.classList.remove("active"));
        box.classList.add("active");
        this.render();
      });
    });
    DOM.el("sendWorldBtn")?.addEventListener("click", () => this.send());
    DOM.el("worldInput")?.addEventListener("keydown", e => { if (e.key === "Enter") this.send(); });
    this.render();
  },

  key() { return `world_${this.lang}_${this.server}`; },

  updateNames() {
    ["One","Two","Three"].forEach((name,i) => DOM.text("world"+name, `${this.lang} #${i+1}`));
  },

  messageHTML(m) {
    const pseudo = m.profiles?.pseudo || m.author || "Utilisateur";
    const body = m.body || m.text || "";
    const image = m.image_url ? `<br><img class="chat-image" src="${m.image_url}">` : "";
    return `<div class="bubble"><b>${pseudo}</b>${body}${image}</div>`;
  },

  async render() {
    DOM.text("worldTitle", `🌍 ${this.lang} #${this.server}`);
    if (this.subscription) { this.subscription.unsubscribe?.(); this.subscription = null; }

    if (HubixOnline.ready) {
      try {
        const messages = await HubixOnline.listWorldMessages(this.lang, this.server);
        DOM.html("worldMessages", messages.length ? messages.map(m => this.messageHTML(m)).join("") : `<p class="muted">Aucun message.</p>`);
        this.subscription = HubixOnline.subscribeWorldMessages(this.lang, this.server, async () => {
          const fresh = await HubixOnline.listWorldMessages(this.lang, this.server);
          DOM.html("worldMessages", fresh.length ? fresh.map(m => this.messageHTML(m)).join("") : `<p class="muted">Aucun message.</p>`);
          const box = DOM.el("worldMessages"); if (box) box.scrollTop = box.scrollHeight;
        });
        return;
      } catch (e) { console.warn(e); }
    }

    const messages = HubixLocal.get(this.key(), []);
    DOM.html("worldMessages", messages.length ? messages.map(m => this.messageHTML(m)).join("") : `<p class="muted">Aucun message.</p>`);
  },

  async send() {
    const input = DOM.el("worldInput");
    const text = input.value.trim();
    if (!text) return;
    if (HubixOnline.ready && Auth.user) {
      try {
        await HubixOnline.sendWorldMessage(this.lang, this.server, Auth.user.id, text);
        input.value = "";
        return;
      } catch (e) { alert(e.message || "Erreur message mondial."); }
    }
    const messages = HubixLocal.get(this.key(), []);
    messages.push({ author: Auth.user?.pseudo || "Moi", text });
    HubixLocal.set(this.key(), messages);
    input.value = "";
    this.render();
  }
};
