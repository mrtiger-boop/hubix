const Auth = {
  user: null,
  localUsers: [],

  async init() {
    this.localUsers = HubixLocal.get("hubix_users", []);
    if (HubixOnline.ready) {
      try { this.user = await HubixOnline.getCurrentUser(); } catch (e) { console.warn(e); }
    }
    if (!this.user) this.user = HubixLocal.get("hubix_session", null);
    this.bind();
    this.render();
  },

  bind() {
    DOM.el("registerBtn")?.addEventListener("click", () => this.register());
    DOM.el("loginBtn")?.addEventListener("click", () => this.login());
    DOM.el("registerAvatar")?.addEventListener("change", async event => {
      const url = await DOM.fileToDataUrl(event.target.files?.[0]);
      if (url) DOM.html("registerAvatarPreview", `<img class="profile-avatar-large" src="${url}">`);
    });
  },

  async register() {
    const pseudo = DOM.el("registerPseudo").value.trim().replace(/\s+/g, "");
    const email = DOM.el("registerEmail").value.trim().toLowerCase();
    const password = DOM.el("registerPassword").value;
    const age = Number(DOM.el("registerAge").value) || 18;
    const country = DOM.el("registerCountry").value.trim() || "France";
    const bio = DOM.el("registerBio").value.trim() || "Membre Hubix.";
    const avatarFile = DOM.el("registerAvatar").files?.[0];

    if (pseudo.length < 3) return DOM.message("registerMessage", "Pseudo trop court.", "error");
    if (!email.includes("@")) return DOM.message("registerMessage", "Email invalide.", "error");
    if (password.length < 4) return DOM.message("registerMessage", "Mot de passe trop court.", "error");

    try {
      if (HubixOnline.ready) {
        this.user = await HubixOnline.signUp({ email, password, pseudo, age, country, bio, avatarFile });
      } else {
        const avatar = await DOM.fileToDataUrl(avatarFile);
        this.user = { id:"local_"+Date.now(), pseudo, email, password, bio, age, country, lang:"Français", gender:"Peu importe", status:"En ligne", avatar, xp:0, level:1 };
        this.localUsers.push(this.user);
        HubixLocal.set("hubix_users", this.localUsers);
      }
      HubixLocal.set("hubix_session", this.user);
      DOM.message("registerMessage", "Compte créé.", "success");
      this.render();
      Router.show("profile");
    } catch (error) {
      DOM.message("registerMessage", error.message || "Erreur inscription.", "error");
    }
  },

  async login() {
    const identifier = DOM.el("loginIdentifier").value.trim();
    const password = DOM.el("loginPassword").value;
    if (!identifier || !password) return DOM.message("loginMessage", "Remplis tous les champs.", "error");

    try {
      if (HubixOnline.ready) {
        this.user = await HubixOnline.signIn({ identifier, password });
      } else {
        const id = identifier.toLowerCase();
        const found = this.localUsers.find(u => u && u.pseudo && u.email && (u.pseudo.toLowerCase() === id || u.email.toLowerCase() === id) && u.password === password);
        if (!found) return DOM.message("loginMessage", "Identifiants incorrects.", "error");
        this.user = found;
      }
      HubixLocal.set("hubix_session", this.user);
      DOM.message("loginMessage", "Connexion réussie.", "success");
      this.render();
      Router.show("profile");
    } catch (error) {
      DOM.message("loginMessage", error.message || "Erreur connexion.", "error");
    }
  },

  async updateProfile(data, avatarFile) {
    if (!this.user) return false;
    try {
      if (HubixOnline.ready && this.user.id && !this.user.id.startsWith("local_")) {
        this.user = await HubixOnline.updateProfile({ ...this.user, ...data }, avatarFile);
      } else {
        const avatar = avatarFile ? await DOM.fileToDataUrl(avatarFile) : this.user.avatar;
        this.user = { ...this.user, ...data, avatar };
      }
      HubixLocal.set("hubix_session", this.user);
      this.render();
      return true;
    } catch (error) {
      DOM.message("profileMessage", error.message || "Erreur profil.", "error");
      return false;
    }
  },

  addXP(amount) {
    if (!this.user) return;
    this.user.xp = (this.user.xp || 0) + amount;
    this.user.level = Math.floor(this.user.xp / 100) + 1;
    HubixLocal.set("hubix_session", this.user);
    this.render();
  },

  render() {
    document.body.classList.toggle("logged-in", !!this.user);
    const pseudo = this.user?.pseudo || "Invité";
    const avatar = this.user?.avatar || this.user?.avatar_url;
    DOM.text("miniPseudo", pseudo);
    DOM.html("miniAvatar", avatar ? `<img class="avatar-img" src="${avatar}">` : (pseudo[0]?.toUpperCase() || "?"));
    const emailInput = DOM.el("settingsEmail");
    if (emailInput) emailInput.value = this.user?.email || "invité";
    Profile.render();
    Match.updateStats();
  }
};
