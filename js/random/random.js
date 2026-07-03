const RandomPage = {
  users: [
    ["Lina", "France • Musique • Cinéma", "L"],
    ["Max", "France • Gaming • Roblox", "M"],
    ["Noa", "Belgique • Manga • Études", "N"],
    ["Sarah", "France • Association • Entraide", "S"],
    ["Yanis", "France • Rap • Sport", "Y"]
  ],

  init() {
    document.getElementById("newMatchBtn").addEventListener("click", () => this.newMatch());
    document.getElementById("sendRandomBtn").addEventListener("click", () => this.sendMessage());
    document.getElementById("randomInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
  },

  newMatch() {
    const user = this.users[Math.floor(Math.random() * this.users.length)];

    document.getElementById("matchName").textContent = "Connecté avec " + user[0];
    document.getElementById("matchBio").textContent = user[1];
    document.getElementById("matchAvatar").textContent = user[2];

    this.addSystemMessage(`Hubix : tu discutes avec ${user[0]}.`);
  },

  sendMessage() {
    const input = document.getElementById("randomInput");
    const text = input.value.trim();
    if (!text) return;

    document.getElementById("randomMessages").innerHTML += `<div class="bubble"><b>Moi</b>${text}</div>`;
    input.value = "";
  },

  addSystemMessage(text) {
    document.getElementById("randomMessages").innerHTML += `<div class="bubble system">${text}</div>`;
  }
};
