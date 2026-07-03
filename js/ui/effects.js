const HubixEffects = {
  init(){this.nav();this.clicks()},
  clicks(){document.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>b.animate([{transform:"scale(1)"},{transform:"scale(.96)"},{transform:"scale(1)"}],{duration:150})))},
  nav(){const pop=document.getElementById("navPopover");document.getElementById("menuToggle")?.addEventListener("click",e=>{e.stopPropagation();pop?.classList.toggle("open")});document.addEventListener("click",e=>{if(pop&&!pop.contains(e.target)&&e.target.id!=="menuToggle")pop.classList.remove("open")});document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".icon-nav button,.nav-popover button").forEach(n=>n.classList.toggle("active",n.dataset.page===btn.dataset.page));pop?.classList.remove("open")}))}
};
