const NotificationsUI = {
  subscription: null,

  async start() {
    if (!HubixOnline.ready || !Auth.user?.id) return;
    await this.render();
    if (this.subscription) this.subscription.unsubscribe?.();
    this.subscription = HubixOnline.subscribeNotifications(Auth.user.id, async notification => {
      this.toast(notification.title, notification.body);
      await this.render();
    });
  },

  async render() {
    const box = DOM.el("notificationsList");
    if (!box || !Auth.user?.id || !HubixOnline.ready) return;
    try {
      const list = await HubixOnline.listNotifications(Auth.user.id);
      box.innerHTML = list.length ? list.map(n => `
        <div class="person-card">
          <h3>${n.title}</h3>
          <p>${n.body || ""}</p>
          <small>${new Date(n.created_at).toLocaleString("fr-FR")}</small>
        </div>
      `).join("") : `<p class="muted">Aucune notification.</p>`;
    } catch (error) {
      console.warn(error);
    }
  },

  toast(title, body = "") {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.right = "20px";
    toast.style.bottom = "20px";
    toast.style.zIndex = "9999";
    toast.style.padding = "14px 18px";
    toast.style.border = "1px solid rgba(255,45,85,.35)";
    toast.style.borderRadius = "16px";
    toast.style.background = "rgba(18,14,24,.96)";
    toast.style.color = "white";
    toast.style.boxShadow = "0 0 32px rgba(255,23,78,.35)";
    toast.innerHTML = `<b>💎 ${title}</b><br><span style="color:#b7a8b1">${body}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  }
};

window.NotificationsUI = NotificationsUI;
