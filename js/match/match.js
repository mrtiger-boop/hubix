const Match = {
  current: null,

  init() {
    this.bindChoices("genderChoices", false);
    this.bindChoices("ageChoices", false);

    DOM.el("startMatchBtn")?.addEventListener("click", () => this.search());
    DOM.el("nextMatchBtn")?.addEventListener("click", () => this.search());
    DOM.el("addFriendFromMatch")?.addEventListener("click", () => this.addFriend());
    DOM.el("favoriteMatch")?.addEventListener("click", () => this.favorite());
    DOM.el("blockMatch")?.addEventListener("click", () => this.block());
    DOM.el("reportMatch")?.addEventListener("click", () => this.report());
    DOM.el("sendPrivateMessage")?.addEventListener("click", () => this.sendMessage());
    DOM.el("privateInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter") this.sendMessage();
    });
    DOM.el("emojiBtn")?.addEventListener("click", () => DOM.el("emojiPanel")?.classList.toggle("hidden"));
    DOM.el("privateImageInput")?.addEventListener("change", event => this.sendImage(event));

    this.buildEmojis();
    this.updateStats();
  },

  bindChoices(id, multi) {
    document.querySelectorAll(`#${id} button`).forEach(button => {
      button.addEventListener("click", () => {
        if (!multi) document.querySelectorAll(`#${id} button`).forEach(b => b.classList.remove("active"));
        button.classList.toggle("active");
      });
    });
  },

  active(id) {
    return [...document.querySelectorAll(`#${id} button.active`)].map(button => button.dataset.value || button.textContent.trim());
  },

  prefs() {
    return {
      gender: this.active("genderChoices")[0] || "Peu importe",
      age: this.active("ageChoices")[0] || "Peu importe",
      country: DOM.el("countryFilter").value,
      lang: DOM.el("languageFilter").value
    };
  },

  localPool() {
    return HubixLocal.get("hubix_users", [])
      .filter(user => user.pseudo !== Auth.user?.pseudo)
      .filter(user => !Friends.names("blocked").includes(user.pseudo))
      .map(user => ({ ...user, name: user.pseudo, interests: ["💬 Discuter"] }));
  },

  search() {
    DOM.hide("matchIdle");
    DOM.hide("matchResult");
    DOM.show("searchScreen");

    const steps = ["Recherche...", "Analyse des préférences...", "Recherche d'une personne...", "Connexion...", "Match trouvé ✨"];
    let index = 0;
    DOM.text("searchStep", steps[0]);

    const timer = setInterval(() => {
      index++;
      DOM.text("searchStep", steps[index] || steps[steps.length - 1]);

      if (index >= steps.length - 1) {
        clearInterval(timer);
        setTimeout(() => this.showMatch(), 450);
      }
    }, 600);
  },

  async showMatch() {
    const prefs = this.prefs();

    try {
      if (HubixOnline.ready && Auth.user) {
        const onlineMatch = await HubixOnline.findMatch(Auth.user, prefs, Friends.names("blocked"));
        if (!onlineMatch) return this.noMatch("Aucun utilisateur en ligne trouvé.");
        this.current = { ...onlineMatch, name: onlineMatch.pseudo, interests: ["💬 Discuter"] };
      } else {
        const pool = this.localPool().filter(person => {
          return (prefs.gender === "Peu importe" || person.gender === prefs.gender) &&
                 (prefs.country === "Monde entier" || person.country === prefs.country) &&
                 HubixOnline.ageOk(person.age || 18, prefs.age);
        });

        if (!pool.length) return this.noMatch("Aucun vrai utilisateur local trouvé.");
        this.current = pool[Math.floor(Math.random() * pool.length)];
      }

      this.renderMatch();
      DOM.hide("searchScreen");
      DOM.show("matchResult");
      this.recordMatch();
    } catch (error) {
      this.noMatch(error.message || "Erreur pendant la recherche.");
    }
  },

  noMatch(text) {
    DOM.hide("searchScreen");
    DOM.show("matchIdle");
    DOM.html("matchIdle", `
      <img src="assets/illustrations/match-robot.svg"/>
      <h1>${text}</h1>
      <p>Crée un autre compte local ou attends qu’un utilisateur soit connecté sur Supabase.</p>
      <button class="primary huge" id="restartSearchBtn">Relancer</button>
    `);
    DOM.el("restartSearchBtn")?.addEventListener("click", () => this.search());
  },

  renderMatch() {
    const person = this.current;
    const avatar = person.avatar || person.avatar_url;
    const initial = (person.name || person.pseudo || "?")[0].toUpperCase();

    DOM.html("matchedInitial", avatar ? `<img class="profile-avatar-large" src="${avatar}">` : initial);
    DOM.text("matchedName", person.name || person.pseudo);
    DOM.text("matchedMeta", `${person.age || "?"} ans • ${person.country || "France"} • ${person.lang || "Français"} • ${person.status || "En ligne"}`);
    DOM.text("matchedBio", person.bio || "Membre Hubix.");
    DOM.text("compatibilityBadge", "Compatibilité 85%");
    DOM.html("matchedInterests", (person.interests || ["💬 Discuter"]).map(i => `<span>${i}</span>`).join(""));
    DOM.text("privateChatTitle", "Conversation avec " + (person.name || person.pseudo));
    DOM.html("privateMessages", `<div class="bubble"><b>${person.name || person.pseudo}</b>Connexion avec un vrai profil Hubix.</div>`);

    const frame = Shop.getRandomFrame();
    DOM.el("matchFrame")?.style.setProperty("--frame-url", `url("../${frame.file}")`);
  },

  buildEmojis() {
    const box = DOM.el("emojiPanel");
    if (!box) return;
    box.innerHTML = ["😀","😂","😍","❤️","🔥","💎","👋","😎","🥳","👍","🎮","🎵"].map(emoji => {
      return `<button onclick="Match.addEmoji('${emoji}')">${emoji}</button>`;
    }).join("");
  },

  addEmoji(emoji) {
    const input = DOM.el("privateInput");
    input.value += emoji;
    input.focus();
  },

  async sendImage(event) {
    const file = event.target.files?.[0];
    if (!file || !this.current) return;

    const url = await DOM.fileToDataUrl(file);
    DOM.el("privateMessages").innerHTML += `<div class="bubble me"><b>Moi</b><br><img class="chat-image" src="${url}"></div>`;
  },

  sendMessage() {
    const input = DOM.el("privateInput");
    const text = input.value.trim();
    if (!text || !this.current) return;

    DOM.el("privateMessages").innerHTML += `<div class="bubble me"><b>Moi</b>${text}</div>`;
    input.value = "";
    Auth.addXP(5);
    this.updateStats();
  },

  addFriend() {
    if (!this.current) return;
    Friends.add("friends", this.current);
    alert("Ajouté en ami.");
  },

  favorite() {
    if (!this.current) return;
    Friends.add("favorites", this.current);
    alert("Ajouté en favori.");
  },

  block() {
    if (!this.current || !confirm("Bloquer cette personne ?")) return;
    Friends.add("blocked", this.current);
    this.search();
  },

  report() {
    alert("Signalement envoyé.");
  },

  recordMatch() {
    const stats = HubixLocal.get("hubix_stats", { matches: 0 });
    stats.matches++;
    HubixLocal.set("hubix_stats", stats);
    Auth.addXP(10);
    this.updateStats();
  },

  async updateStats() {
    const stats = HubixLocal.get("hubix_stats", { matches: 0 });
    const friends = Friends.get ? Friends.get("friends") : [];
    const wallet = Shop.wallet ? Shop.wallet() : { ownedFrames: [] };

    let online = HubixLocal.get("hubix_users", []).filter(user => user.status !== "Invisible").length;

    if (HubixOnline.ready) {
      try { online = await HubixOnline.onlineCount(); } catch {}
    }

    DOM.text("globalOnlineCount", online);
    DOM.text("homeOnline", online);
    DOM.text("homeMatches", stats.matches || 0);
    DOM.text("homeFriends", friends.length);
    DOM.text("homeFrames", wallet.ownedFrames.length);
    DOM.text("profileMatches", stats.matches || 0);
    DOM.text("profileFriends", friends.length);
    DOM.text("profileXP", Auth.user?.xp || 0);
    DOM.text("profileLevel", Auth.user?.level || 1);
  }
};
