const DOM = {
  el(id) {
    return document.getElementById(id);
  },
  text(id, value) {
    const element = this.el(id);
    if (element) element.textContent = value;
  },
  html(id, value) {
    const element = this.el(id);
    if (element) element.innerHTML = value;
  },
  show(id) {
    this.el(id)?.classList.remove("hidden");
  },
  hide(id) {
    this.el(id)?.classList.add("hidden");
  },
  message(id, text, type = "success") {
    const element = this.el(id);
    if (!element) return;
    element.textContent = text;
    element.className = "message " + type;
  },
  fileToDataUrl(file) {
    return new Promise(resolve => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
};
