const Profile = {
  init() {
    DOM.el("saveProfileBtn")?.addEventListener("click", () => this.save());
  },

  async save() {
    const data = {
      pseudo: DOM.el("editPseudo").value.trim().replace(/\s+/g, ""),
      bio: DOM.el("editBio").value.trim() || "Membre Hubix.",
      age: Number(DOM.el("editAge").value) || 18,
      country: DOM.el("editCountry").value.trim() || "France",
      status: DOM.el("editStatus").value
    };

    const avatarFile = DOM.el("editAvatar").files?.[0];
    const ok = await Auth.updateProfile(data, avatarFile);
    if (ok) DOM.message("profileMessage", "Profil sauvegardé.", "success");
  },

  render() {
    const user = Auth.user;
    const pseudo = user?.pseudo || "Invité";
    const initial = pseudo[0]?.toUpperCase() || "?";
    const avatar = user?.avatar || user?.avatar_url;
    const bio = user?.bio || "Connecte-toi pour personnaliser ton profil Hubix.";

    DOM.html("profileAvatar", avatar ? `<img class="profile-avatar-large" src="${avatar}">` : initial);
    DOM.text("profilePseudo", pseudo);
    DOM.text("profileBio", bio);

    DOM.html("miniProfileInitial", avatar ? `<img class="avatar-img" src="${avatar}">` : initial);
    DOM.text("miniProfileName", pseudo);
    DOM.text("miniProfileStatus", user?.status || "Non connecté");

    DOM.html("profileChips", `
      <span>${user?.status || "Invité"}</span>
      <span>${user?.age || "?"} ans</span>
      <span>${user?.country || "France"}</span>
    `);

    if (user && DOM.el("editPseudo")) {
      DOM.el("editPseudo").value = user.pseudo || "";
      DOM.el("editBio").value = user.bio || "";
      DOM.el("editAge").value = user.age || 18;
      DOM.el("editCountry").value = user.country || "France";
      DOM.el("editStatus").value = user.status || "En ligne";
    }

    const frame = Shop.getEquipped();
    this.applyFrame("profileFrame", frame);
    this.applyFrame("miniProfileFrame", frame);

    this.renderOwnedFrames();
  },

  applyFrame(id, frame) {
    const element = DOM.el(id);
    if (!element) return;
    element.style.setProperty("--frame-url", frame ? `url("../${frame.file}")` : "none");
  },

  renderOwnedFrames() {
    const box = DOM.el("profileFramesList");
    if (!box) return;

    const owned = Shop.getOwnedItems();
    box.innerHTML = owned.length ? owned.map(item => `
      <div class="frame-option">
        <img src="${item.file}">
        <strong>${item.name}</strong>
        <button onclick="Shop.equip('${item.id}')">Équiper</button>
      </div>
    `).join("") : `<p class="muted">Aucun cadre possédé.</p>`;
  }
};
