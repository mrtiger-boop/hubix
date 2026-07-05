const Match = {
  current: null,
  sub: null,

  init() {
    this.choice("genderChoices");
    this.choice("ageChoices");

    DOM.el("startMatchBtn")?.addEventListener("click", () => this.search());
    DOM.el("nextMatchBtn")?.addEventListener("click", () => this.search());
    DOM.el("addFriendFromMatch")?.addEventListener("click", () => this.friend());
    DOM.el("favoriteMatch")?.addEventListener("click", () => this.favorite());
    DOM.el("blockMatch")?.addEventListener("click", () => this.block());
    DOM.el("sendPrivateMessage")?.addEventListener("click", () => this.send());
    DOM.el("privateInput")?.addEventListener("keydown", e => {
      if (e.key === "Enter") this.send();
    });

    this.emojis();
  },

  choice(id) {
    document.querySelectorAll(`#${id} button`).forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll(`#${id} button`).forEach(x => x.classList.remove("active"));
        button.classList.add("active");
      });
    });
  },

  active(id) {
    return document.querySelector(`#${id} .active`)?.dataset.value || "Peu importe";
  },

  prefs() {
    return {
      gender: this.active("genderChoices"),
      age: this.active("ageChoices"),
      country: DOM.el("countryFilter").value,
      lang: DOM.el("languageFilter").value
    };
  },

  async search() {
    if (!Auth.user) return alert("Connecte-toi d'abord.");

    DOM.hide("matchIdle");
    DOM.hide("matchResult");
    DOM.show("searchScreen");

    const steps = ["Analyse...", "Recherche...", "Compatibilité...", "Connexion..."];
    let index = 0;

    const timer = setInterval(() => {
      DOM.text("searchStep", steps[index++] || "Match trouvé ✨");

      if (index > steps.length) {
        clearInterval(timer);
        this.find();
      }
    }, 550);
  },

  async find() {
    try {
      this.current = await API.findMatch(Auth.user, this.prefs());

      if (!this.current) {
        DOM.hide("searchScreen");
        DOM.show("matchIdle");
        DOM.html("matchIdle", "<h1>Aucun utilisateur en ligne trouvé</h1>");
        return;
      }

      this.render();
      DOM.hide("searchScreen");
      DOM.show("matchResult");
      await this.privateStart();
    } catch (error) {
      alert(error.message || "Erreur Match.");
    }
  },

  render() {
    const person = this.current;
    const avatar = person.avatar_url;

    DOM.html("matchedInitial", avatar ? `<img src="${avatar}">` : (person.pseudo[0] || "?"));
    DOM.text("matchedName", person.pseudo);
    DOM.text("matchedMeta", `${person.age} ans • ${person.country} • ${person.lang}`);
    DOM.text("matchedBio", person.bio);
    DOM.text("compatibilityBadge", `Compatibilité ${person.compatibility || 85}%`);
    DOM.html("matchedInterests", (person.interests?.length ? person.interests : ["💬 Discuter"]).map(x => `<span>${x}</span>`).join(""));
    DOM.text("privateChatTitle", "Conversation avec " + person.pseudo);
    DOM.html("privateMessages", "");
  },

  async privateStart() {
    if (!this.current?.match_id) return;

    if (this.sub) {
      this.sub.unsubscribe?.();
      this.sub = null;
    }

    const messages = await API.privateList(this.current.match_id);
    DOM.html("privateMessages", messages.map(message => this.msg(message)).join(""));

    const box = DOM.el("privateMessages");
    if (box) box.scrollTop = box.scrollHeight;

    this.sub = API.subPrivate(this.current.match_id, async () => {
      const fresh = await API.privateList(this.current.match_id);
      DOM.html("privateMessages", fresh.map(message => this.msg(message)).join(""));
      const box = DOM.el("privateMessages");
      if (box) box.scrollTop = box.scrollHeight;
    });
  },

  msg(message) {
    const isMe = message.sender_id === Auth.user.id;
    const pseudo = isMe ? "Moi" : (message.profiles?.pseudo || "Utilisateur");
    return `<div class="bubble ${isMe ? "me" : ""}"><b>${pseudo}</b>${message.body || ""}</div>`;
  },

  async send() {
    const input = DOM.el("privateInput");
    const text = input.value.trim();

    if (!text || !this.current?.match_id) return;

    await API.privateSend(this.current.match_id, Auth.user.id, text);
    input.value = "";
  },

  emojis() {
    const panel = DOM.el("emojiPanel");
    if (!panel) return;

    panel.innerHTML = ["😀", "😂", "😍", "❤️", "🔥", "💎", "👋", "👍"]
      .map(emoji => `<button onclick="document.getElementById('privateInput').value+='${emoji}'">${emoji}</button>`)
      .join("");

    DOM.el("emojiBtn")?.addEventListener("click", () => panel.classList.toggle("hidden"));
  },

  async friend() {
    if (!this.current) return;

    try {
      await API.sendFriendRequest(Auth.user.id, this.current.id);
      alert("Demande d'ami envoyée.");
    } catch (error) {
      alert(error.message || "Impossible d'envoyer la demande.");
    }
  },

  async favorite() {
    if (!this.current) return;
    await API.add("favorites", Auth.user.id, this.current.id, "favorite_id");
    Friends.render();
    alert("Favori ajouté.");
  },

  async block() {
    if (!this.current || !confirm("Bloquer cette personne ?")) return;
    await API.add("blocks", Auth.user.id, this.current.id, "blocked_id");
    Friends.render();
    this.search();
  }
};
