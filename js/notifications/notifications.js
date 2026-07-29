const Notifications = {
  sub: null,

  async init() {
    await this.render();
    if (API.ready && Auth.user) {
      this.sub = API.subNotify(Auth.user.id, n => {
        this.toast(n.title, n.body);
        this.render();
      });
    }
  },

  async render() {
    const box = DOM.el("notificationsList");
    if (!box) return;

    if (!API.ready || !Auth.user) {
      box.innerHTML = "<div class='card empty-state'><span class='icon'>🔒</span>Connecte-toi pour voir tes notifications.</div>";
      return;
    }

    const list = await API.notifyList(Auth.user.id);
    box.innerHTML = list.length
      ? list.map(n => `
        <div class="card notif-card">
          <div class="icon">💎</div>
          <div>
            <b>${n.title}</b>
            <p>${n.body || ""}</p>
          </div>
        </div>
      `).join("")
      : "<div class='card empty-state'><span class='icon'>🔔</span>Aucune notification pour le moment.</div>";
  },

  toast(title, body = "") {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<b>💎 ${title}</b><p>${body}</p>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
};
