const World = {
  lang: "Français",
  server: 1,

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
    DOM.el("worldInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter") this.send();
    });

    this.render();
  },

  key() {
    return `world_${this.lang}_${this.server}`;
  },

  updateNames() {
    ["One", "Two", "Three"].forEach((name, index) => {
      DOM.text("world" + name, `${this.lang} #${index + 1}`);
    });
  },

  async render() {
    DOM.text("worldTitle", `🌍 ${this.lang} #${this.server}`);

    if (HubixOnline.ready) {
      try {
        const messages = await HubixOnline.listWorldMessages(this.lang, this.server);
        DOM.html("worldMessages", messages.length ? messages.map(message => `
          <div class="bubble"><b>${message.profiles?.pseudo || "Utilisateur"}</b>${message.body}</div>
        `).join("") : `<p class="muted">Aucun message.</p>`);
        return;
      } catch (error) {
        console.warn(error);
      }
    }

    const messages = HubixLocal.get(this.key(), []);
    DOM.html("worldMessages", messages.length ? messages.map(message => `
      <div class="bubble"><b>${message.author}</b>${message.text}</div>
    `).join("") : `<p class="muted">Aucun message.</p>`);
  },

  async send() {
    const input = DOM.el("worldInput");
    const text = input.value.trim();
    if (!text) return;

    if (HubixOnline.ready && Auth.user) {
      try {
        await HubixOnline.sendWorldMessage(this.lang, this.server, Auth.user.id, text);
        input.value = "";
        await this.render();
        return;
      } catch (error) {
        alert(error.message || "Erreur message mondial.");
      }
    }

    const messages = HubixLocal.get(this.key(), []);
    messages.push({ author: Auth.user?.pseudo || "Moi", text });
    HubixLocal.set(this.key(), messages);
    input.value = "";
    this.render();
  }
};
