const Match = {
  current: null,
  privateSubscription: null,

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
    DOM.el("privateInput")?.addEventListener("keydown", e => { if (e.key === "Enter") this.sendMessage(); });
    DOM.el("emojiBtn")?.addEventListener("click", () => DOM.el("emojiPanel")?.classList.toggle("hidden"));
    DOM.el("privateImageInput")?.addEventListener("change", e => this.sendImage(e));
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

  active(id) { return [...document.querySelectorAll(`#${id} button.active`)].map(b => b.dataset.value || b.textContent.trim()); },

  prefs() {
    return {
      gender: this.active("genderChoices")[0] || "Peu importe",
      age: this.active("ageChoices")[0] || "Peu importe",
      country: DOM.el("countryFilter").value,
      lang: DOM.el("languageFilter").value
    };
  },

  localPool() {
    return HubixLocal.get("hubix_users", []).filter(u => u && u.pseudo && u.pseudo !== Auth.user?.pseudo)
      .filter(u => !Friends.names("blocked").includes(u.pseudo))
      .map(u => ({ ...u, name: u.pseudo, interests:["💬 Discuter"] }));
  },

  search() {
    DOM.hide("matchIdle"); DOM.hide("matchResult"); DOM.show("searchScreen");
    const steps = ["Recherche...", "Analyse des préférences...", "Compatibilité...", "Connexion...", "Match trouvé ✨"];
    let i = 0; DOM.text("searchStep", steps[0]);
    const timer = setInterval(() => {
      i++; DOM.text("searchStep", steps[i] || steps.at(-1));
      if (i >= steps.length - 1) { clearInterval(timer); setTimeout(() => this.showMatch(), 450); }
    }, 600);
  },

  async showMatch() {
    const prefs = this.prefs();
    try {
      if (HubixOnline.ready && Auth.user) {
        const onlineMatch = await HubixOnline.findMatch(Auth.user, prefs, Friends.names("blocked"));
        if (!onlineMatch) return this.noMatch("Aucun utilisateur en ligne trouvé.");
        this.current = { ...onlineMatch, name: onlineMatch.pseudo, interests: onlineMatch.interests?.length ? onlineMatch.interests : ["💬 Discuter"] };
      } else {
        const pool = this.localPool().filter(p => (prefs.gender === "Peu importe" || p.gender === prefs.gender) && (prefs.country === "Monde entier" || p.country === prefs.country) && HubixOnline.ageOk(p.age || 18, prefs.age));
        if (!pool.length) return this.noMatch("Aucun vrai utilisateur local trouvé.");
        this.current = pool[Math.floor(Math.random() * pool.length)];
        this.current.compatibility = 85;
      }
      this.renderMatch(); DOM.hide("searchScreen"); DOM.show("matchResult"); this.recordMatch(); this.startPrivateRealtime();
    } catch (e) { this.noMatch(e.message || "Erreur pendant la recherche."); }
  },

  noMatch(text) {
    DOM.hide("searchScreen"); DOM.show("matchIdle");
    DOM.html("matchIdle", `<img src="assets/illustrations/match-robot.svg"/><h1>${text}</h1><p>Attends qu’un utilisateur soit connecté ou élargis tes filtres.</p><button class="primary huge" id="restartSearchBtn">Relancer</button>`);
    DOM.el("restartSearchBtn")?.addEventListener("click", () => this.search());
  },

  renderMatch() {
    const p = this.current;
    const avatar = p.avatar || p.avatar_url;
    const initial = (p.name || p.pseudo || "?")[0].toUpperCase();
    DOM.html("matchedInitial", avatar ? `<img class="profile-avatar-large" src="${avatar}">` : initial);
    DOM.text("matchedName", p.name || p.pseudo);
    DOM.text("matchedMeta", `${p.age || "?"} ans • ${p.country || "France"} • ${p.lang || "Français"} • ${p.status || "En ligne"}`);
    DOM.text("matchedBio", p.bio || "Membre Hubix.");
    DOM.text("compatibilityBadge", `Compatibilité ${p.compatibility || 85}%`);
    DOM.html("matchedInterests", (p.interests || ["💬 Discuter"]).map(i => `<span>${i}</span>`).join(""));
    DOM.text("privateChatTitle", "Conversation avec " + (p.name || p.pseudo));
    DOM.html("privateMessages", `<div class="bubble"><b>${p.name || p.pseudo}</b>Connexion avec un vrai profil Hubix.</div>`);
    const frame = Shop.getRandomFrame(); DOM.el("matchFrame")?.style.setProperty("--frame-url", `url("../${frame.file}")`);
  },

  async startPrivateRealtime() {
    if (!HubixOnline.ready || !this.current?.match_id) return;
    if (this.privateSubscription) { this.privateSubscription.unsubscribe?.(); this.privateSubscription = null; }
    try {
      const messages = await HubixOnline.listPrivateMessages(this.current.match_id);
      if (messages.length) DOM.html("privateMessages", messages.map(m => this.privateMessageHTML(m)).join(""));
      this.privateSubscription = HubixOnline.subscribePrivateMessages(this.current.match_id, async () => {
        const fresh = await HubixOnline.listPrivateMessages(this.current.match_id);
        DOM.html("privateMessages", fresh.map(m => this.privateMessageHTML(m)).join(""));
        const box = DOM.el("privateMessages"); if (box) box.scrollTop = box.scrollHeight;
      });
    } catch(e) { console.warn(e); }
  },

  privateMessageHTML(m) {
    const isMe = m.sender_id === Auth.user?.id;
    const pseudo = isMe ? "Moi" : (m.profiles?.pseudo || this.current?.name || "Utilisateur");
    const image = m.image_url ? `<br><img class="chat-image" src="${m.image_url}">` : "";
    return `<div class="bubble ${isMe ? "me" : ""}"><b>${pseudo}</b>${m.body || ""}${image}</div>`;
  },

  buildEmojis() {
    const box = DOM.el("emojiPanel"); if (!box) return;
    box.innerHTML = ["😀","😂","😍","❤️","🔥","💎","👋","😎","🥳","👍","🎮","🎵"].map(e => `<button onclick="Match.addEmoji('${e}')">${e}</button>`).join("");
  },

  addEmoji(e) { const input = DOM.el("privateInput"); input.value += e; input.focus(); },

  async sendImage(event) {
    const file = event.target.files?.[0]; if (!file || !this.current) return;
    const url = await DOM.fileToDataUrl(file);
    if (HubixOnline.ready && this.current.match_id && Auth.user) { await HubixOnline.sendPrivateMessage(this.current.match_id, Auth.user.id, "", url); return; }
    DOM.el("privateMessages").innerHTML += `<div class="bubble me"><b>Moi</b><br><img class="chat-image" src="${url}"></div>`;
  },

  async sendMessage() {
    const input = DOM.el("privateInput"); const text = input.value.trim(); if (!text || !this.current) return;
    if (HubixOnline.ready && this.current.match_id && Auth.user) {
      await HubixOnline.sendPrivateMessage(this.current.match_id, Auth.user.id, text, null);
      input.value = ""; Auth.addXP(5); this.updateStats(); return;
    }
    DOM.el("privateMessages").innerHTML += `<div class="bubble me"><b>Moi</b>${text}</div>`;
    input.value = ""; Auth.addXP(5); this.updateStats();
  },

  async addFriend() {
    if (!this.current) return;
    if (HubixOnline.ready && Auth.user && this.current.id) await HubixOnline.addFriend(Auth.user.id, this.current.id);
    Friends.add("friends", this.current); alert("Ajouté en ami.");
  },

  async favorite() {
    if (!this.current) return;
    if (HubixOnline.ready && Auth.user && this.current.id) await HubixOnline.addFavorite(Auth.user.id, this.current.id);
    Friends.add("favorites", this.current); alert("Ajouté en favori.");
  },

  async block() {
    if (!this.current || !confirm("Bloquer cette personne ?")) return;
    if (HubixOnline.ready && Auth.user && this.current.id) await HubixOnline.blockUser(Auth.user.id, this.current.id);
    Friends.add("blocked", this.current); this.search();
  },

  report() { alert("Signalement envoyé."); },

  recordMatch() {
    const stats = HubixLocal.get("hubix_stats", { matches: 0 }); stats.matches++;
    HubixLocal.set("hubix_stats", stats); Auth.addXP(10); this.updateStats();
  },

  async updateStats() {
    const stats = HubixLocal.get("hubix_stats", { matches: 0 });
    const friends = Friends.get ? Friends.get("friends") : [];
    const wallet = Shop.wallet ? Shop.wallet() : { ownedFrames: [] };
    let online = HubixLocal.get("hubix_users", []).filter(u => u && u.status !== "Invisible").length;
    if (HubixOnline.ready) { try { online = await HubixOnline.onlineCount(); } catch {} }
    DOM.text("globalOnlineCount", online); DOM.text("homeOnline", online); DOM.text("homeMatches", stats.matches || 0); DOM.text("homeFriends", friends.length); DOM.text("homeFrames", wallet.ownedFrames.length); DOM.text("profileMatches", stats.matches || 0); DOM.text("profileFriends", friends.length); DOM.text("profileXP", Auth.user?.xp || 0); DOM.text("profileLevel", Auth.user?.level || 1);
  }
};
