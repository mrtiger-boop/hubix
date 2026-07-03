const AuthPage = {
  users: [],
  currentUser: null,

  init() {
    this.users = HubixStorage.get("hubix_v09_users", []);
    this.currentUser = HubixStorage.get("hubix_v09_session", null);
    document.getElementById("registerBtn")?.addEventListener("click", () => this.register());
    document.getElementById("loginBtn")?.addEventListener("click", () => this.login());
    this.refreshUI();
  },

  normalize(v) { return (v || "").trim().replace(/\s+/g, ""); },

  register() {
    const pseudo = this.normalize(document.getElementById("registerPseudo").value);
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;

    if (pseudo.length < 3) return this.message("registerMessage", "Pseudo trop court.", "error");
    if (!email.includes("@")) return this.message("registerMessage", "Email invalide.", "error");
    if (password.length < 4) return this.message("registerMessage", "Mot de passe trop court.", "error");
    if (this.users.some(u => u.pseudo.toLowerCase() === pseudo.toLowerCase())) return this.message("registerMessage", "Pseudo déjà utilisé.", "error");

    const user = { id: "u_" + Date.now(), pseudo, email, password, bio: "Membre Hubix.", status: "En ligne" };
    this.users.push(user);
    this.currentUser = user;
    this.save();
    this.message("registerMessage", "Compte créé.", "success");
    this.refreshUI();
    setTimeout(() => Router.show("profile"), 300);
  },

  login() {
    const id = document.getElementById("loginIdentifier").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const user = this.users.find(u => (u.pseudo.toLowerCase() === id || u.email === id) && u.password === password);
    if (!user) return this.message("loginMessage", "Identifiants incorrects.", "error");
    this.currentUser = user;
    this.save();
    this.message("loginMessage", "Connexion réussie.", "success");
    this.refreshUI();
    setTimeout(() => Router.show("profile"), 300);
  },

  updateCurrentUser(data) {
    if (!this.currentUser) return false;
    const newPseudo = this.normalize(data.pseudo || this.currentUser.pseudo);
    if (this.users.some(u => u.id !== this.currentUser.id && u.pseudo.toLowerCase() === newPseudo.toLowerCase())) return false;
    this.currentUser = { ...this.currentUser, ...data, pseudo: newPseudo };
    this.users = this.users.map(u => u.id === this.currentUser.id ? this.currentUser : u);
    this.save(); this.refreshUI(); return true;
  },

  save() { HubixStorage.set("hubix_v09_users", this.users); HubixStorage.set("hubix_v09_session", this.currentUser); },
  message(id, text, type) { const el = document.getElementById(id); if (el) { el.textContent = text; el.className = "auth-message " + type; } },

  refreshUI() {
    const logged = !!this.currentUser;
    document.body.classList.toggle("logged-in", logged);
    const pseudo = logged ? this.currentUser.pseudo : "Invité";
    const initial = pseudo[0]?.toUpperCase() || "?";
    this.setText("miniPseudo", pseudo); this.setText("miniAvatar", initial);
    this.setText("miniProfileName", pseudo); this.setText("miniProfileInitial", initial);
    this.setText("miniProfileStatus", logged ? this.currentUser.status : "Non connecté");
    const email = document.getElementById("settingsEmail"); if (email) email.value = logged ? this.currentUser.email : "invité";
    ProfilePage?.render?.();
  },

  setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
};
