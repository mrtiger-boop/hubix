const ShopPage = {
  items: [
    { id:"robot", name:"Robot Ruby animé", price:350, file:"assets/frames/frame-robot-ruby.svg", className:"robot" },
    { id:"gems", name:"Rubis éclatés", price:500, file:"assets/frames/frame-ruby-gems.svg", className:"gems" },
    { id:"stars", name:"Étoiles kawaii", price:420, file:"assets/frames/frame-kawaii-stars.svg", className:"stars" },
    { id:"heartbot", name:"Cœur Bot", price:650, file:"assets/frames/frame-heart-bot.svg", className:"heart" },
    { id:"magma", name:"Magma Ruby", price:900, file:"assets/frames/frame-magma.svg", className:"magma" }
  ],
  init(){this.ensureWallet();this.render()},
  ensureWallet(){if(!HubixStorage.get("hubix_v09_wallet",null))HubixStorage.set("hubix_v09_wallet",{coins:2500,ownedFrames:[],equippedFrame:null})},
  wallet(){return HubixStorage.get("hubix_v09_wallet",{coins:2500,ownedFrames:[],equippedFrame:null})},
  save(w){HubixStorage.set("hubix_v09_wallet",w);this.updateCoins();CommunitiesPage?.renderHome?.()},
  updateCoins(){const w=this.wallet();const el=document.getElementById("coinAmount");if(el)el.textContent=w.coins.toLocaleString("fr-FR")},
  render(){this.updateCoins();const grid=document.getElementById("shopGrid");if(!grid)return;const w=this.wallet();grid.innerHTML=this.items.map(item=>{const owned=w.ownedFrames.includes(item.id);const equipped=w.equippedFrame===item.id;return `<article class="shop-card"><div class="shop-preview animated-frame ${item.className}" style="background-image:url('${item.file}')"></div><h3>${item.name}</h3><p>Cadre de profil dessiné + animation.</p><div class="shop-price">💎 ${item.price} coins</div><button class="${owned?"owned":""}" onclick="${owned?`ShopPage.equip('${item.id}')`:`ShopPage.buy('${item.id}')`}">${equipped?"Équipé":owned?"Équiper":"Acheter"}</button></article>`}).join("")},
  buy(id){const item=this.items.find(i=>i.id===id), w=this.wallet();if(!item)return;if(w.ownedFrames.includes(id))return this.equip(id);if(w.coins<item.price)return alert("Pas assez de coins.");w.coins-=item.price;w.ownedFrames.push(id);w.equippedFrame=id;this.save(w);this.render();ProfilePage?.render?.()},
  equip(id){const w=this.wallet();if(!w.ownedFrames.includes(id))return;w.equippedFrame=id;this.save(w);this.render();ProfilePage?.render?.()},
  getEquippedFrame(){const w=this.wallet();return this.items.find(i=>i.id===w.equippedFrame)},
  getOwnedItems(){const w=this.wallet();return this.items.filter(i=>w.ownedFrames.includes(i.id))}
};
