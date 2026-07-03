const WorldPage = {
  currentLanguage: "Français",

  init() {
    document.querySelectorAll(".lang").forEach(button => {
      button.addEventListener("click", () => this.setLanguage(button));
    });

    document.querySelectorAll(".world-server").forEach(server => {
      server.addEventListener("click", () => this.openServer(server.dataset.server));
    });

    document.getElementById("sendWorldBtn").addEventListener("click", () => this.sendMessage());
    document.getElementById("worldInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
  },

  setLanguage(button) {
    this.currentLanguage = button.dataset.lang;

    document.querySelectorAll(".lang").forEach(b => b.classList.remove("active"));
    button.classList.add("active");

    document.getElementById("worldOne").textContent = this.currentLanguage + " #1";
    document.getElementById("worldTwo").textContent = this.currentLanguage + " #2";
    document.getElementById("worldThree").textContent = this.currentLanguage + " #3";
    document.getElementById("worldTitle").textContent = "🌍 " + this.currentLanguage + " #1";
  },

  openServer(number) {
    const title = this.currentLanguage + " #" + number;
    document.getElementById("worldTitle").textContent = "🌍 " + title;
    document.getElementById("worldMessages").innerHTML = `
      <div class="bubble system">Bienvenue dans ${title}.</div>
      <div class="bubble"><b>Lina</b>Salut le mondial !</div>
      <div class="bubble"><b>Max</b>Qui veut discuter ?</div>
    `;
  },

  sendMessage() {
    const input = document.getElementById("worldInput");
    const text = input.value.trim();
    if (!text) return;

    document.getElementById("worldMessages").innerHTML += `<div class="bubble"><b>Moi</b>${text}</div>`;
    input.value = "";
  }
};
