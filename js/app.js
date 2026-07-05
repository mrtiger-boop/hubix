const App = {
  presenceSubscription: null,

  async init() {
    HubixOnline.init();

    DOM.text("onlineModeText", HubixOnline.ready
      ? "Mode public en ligne actif : Supabase synchronise les utilisateurs."
      : "Mode local actif. Remplis js/services/supabase-config.js pour passer en ligne."
    );

    Router.init();
    Shop.init();
    Friends.init();
    await Auth.init();
    Profile.init();
    Match.init();
    World.init();

    if (HubixOnline.ready) {
      await this.startPresence();
      setInterval(() => {
        if (Auth.user?.id) HubixOnline.setPresence(Auth.user.id, true, document.querySelector(".page.active")?.id || "home");
      }, 15000);

      window.addEventListener("beforeunload", () => {
        if (Auth.user?.id) HubixOnline.setPresence(Auth.user.id, false, "closed");
      });
    }
  },

  async startPresence() {
    await Match.updateStats();
    if (this.presenceSubscription) this.presenceSubscription.unsubscribe?.();
    this.presenceSubscription = HubixOnline.subscribePresence(async () => {
      await Match.updateStats();
    });
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
