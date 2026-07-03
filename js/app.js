const App = {
  async init() {
    HubixOnline.init();

    DOM.text("onlineModeText", HubixOnline.ready
      ? "Mode Supabase actif."
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
      setInterval(() => {
        if (Auth.user?.id) HubixOnline.setOnline(Auth.user.id, true);
      }, 30000);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
