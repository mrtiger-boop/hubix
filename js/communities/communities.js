const CommunitiesPage = {
  communities: [], activeServerId: null, activeChannelId: null,

  init() {
    this.communities = HubixStorage.get("hubix_v09_communities", []);
    if (!Array.isArray(this.communities)) this.communities = [];
    this.bind(); this.render(); this.renderHome();
  },

  bind() {
    document.getElementById("addCommunityBtn")?.addEventListener("click", () => this.addCommunity());
    document.getElementById("generateCommunityCode")?.addEventListener("click", () => this.generateCode());
    document.getElementById("joinCommunityBtn")?.addEventListener("click", () => this.joinByCode());
    document.getElementById("addChannelToServer")?.addEventListener("click", () => this.addChannel());
    document.getElementById("sendServerMessage")?.addEventListener("click", () => this.sendMessage());
    document.getElementById("copyServerCode")?.addEventListener("click", () => this.copyCode());
    document.getElementById("deleteServer")?.addEventListener("click", () => this.deleteServer());
    document.getElementById("clearChannel")?.addEventListener("click", () => this.clearChannel());
    document.getElementById("deleteChannel")?.addEventListener("click", () => this.deleteChannel());
    document.getElementById("serverMessageInput")?.addEventListener("keydown", e => { if (e.key === "Enter") this.sendMessage(); });
  },

  id(){return "id_"+Math.random().toString(36).slice(2,10)+Date.now().toString(36)},
  cleanCode(v){return (v||"").trim().toUpperCase().replace(/[^A-Z0-9_-]/g,"")},

  generateCode(){
    const name=document.getElementById("communityName").value||"HUBIX";
    const base=name.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8)||"HUBIX";
    let code=base+Math.floor(100+Math.random()*899);
    while(this.communities.some(c=>c.code===code)) code=base+Math.floor(100+Math.random()*899);
    document.getElementById("communityCode").value=code;
  },

  defaultChannels(){return[{id:this.id(),name:"général",type:"text",messages:[]},{id:this.id(),name:"annonces",type:"announce",messages:[]},{id:this.id(),name:"règlement",type:"text",messages:[]}]},

  addCommunity(){
    const name=document.getElementById("communityName").value.trim();
    const desc=document.getElementById("communityDesc").value.trim();
    const code=this.cleanCode(document.getElementById("communityCode").value);
    const category=document.getElementById("communityCategory").value;
    if(!name)return alert("Mets un nom de serveur.");
    if(!code)return alert("Mets un code unique ou clique sur Générer.");
    if(this.communities.some(c=>c.code===code))return alert("Ce code est déjà utilisé.");
    const user=AuthPage?.currentUser?.pseudo||"Moi";
    const server={id:this.id(),name,desc:desc||"Serveur Hubix.",code,category,members:[{name:user,role:"Propriétaire",online:true}],favorite:false,channels:this.defaultChannels()};
    this.communities.unshift(server); this.save();
    ["communityName","communityDesc","communityCode"].forEach(id=>document.getElementById(id).value="");
    this.render(); this.renderHome(); this.openServer(server.id);
  },

  joinByCode(){
    const code=this.cleanCode(document.getElementById("joinCommunityCode").value);
    const box=document.getElementById("joinCommunityMessage");
    const server=this.communities.find(c=>c.code===code);
    box.classList.add("show");
    if(!server){box.textContent="Aucun serveur trouvé avec ce code.";return}
    const user=AuthPage?.currentUser?.pseudo||"Moi";
    if(!server.members.some(m=>m.name===user))server.members.push({name:user,role:"Membre",online:true});
    this.save(); box.textContent="Tu as rejoint : "+server.name; this.render(); this.renderHome(); this.openServer(server.id);
  },

  render(){
    const box=document.getElementById("communityList"); if(!box)return;
    if(!this.communities.length){box.innerHTML=`<div class="community-item-pro"><div><strong>Aucun serveur</strong><span>Crée ton premier serveur.</span></div></div>`;return}
    box.innerHTML=this.communities.map(c=>`<div class="community-item-pro"><div><strong>${c.favorite?"⭐ ":""}${c.name}</strong><span>${c.category} • ${c.members.length} membre(s) • ${c.channels.length} salon(s) • Code : ${c.code}</span></div><button class="ruby-primary" onclick="CommunitiesPage.openServer('${c.id}')">Ouvrir</button></div>`).join("");
  },

  renderHome(){
    const serverCount=document.getElementById("homeServerCount"), channelCount=document.getElementById("homeChannelCount");
    const frameCount=document.getElementById("homeFrameCount");
    if(serverCount)serverCount.textContent=this.communities.length;
    if(channelCount)channelCount.textContent=this.communities.reduce((n,s)=>n+s.channels.length,0);
    if(frameCount)frameCount.textContent=(ShopPage?.wallet?.().ownedFrames||[]).length;
    const list=document.getElementById("homeServerList");
    if(list)list.innerHTML=this.communities.length?this.communities.slice(0,6).map(c=>`<button class="favorite" onclick="Router.show('communities');CommunitiesPage.openServer('${c.id}')">💎 ${c.name}<b>${c.channels.length}</b></button>`).join(""):`<button class="favorite" data-page="communities">＋ Créer un serveur</button>`;
    const activity=document.getElementById("homeActivity");
    if(activity)activity.innerHTML=this.communities.length?this.communities.slice(0,5).map(c=>`<div class="favorite"><span>💬</span><div><strong>${c.name}</strong><br><small>${c.desc} — Code : ${c.code}</small></div></div>`).join(""):`<p class="muted">Aucune activité pour l’instant.</p>`;
  },

  openServer(id){this.activeServerId=id;const s=this.currentServer();if(!s)return;this.activeChannelId=s.channels[0]?.id||null;document.getElementById("serverApp").classList.remove("hidden");this.renderServer()},
  renderServer(){const s=this.currentServer();if(!s)return;document.getElementById("activeServerIcon").textContent=s.name[0].toUpperCase();document.getElementById("activeServerName").textContent=s.name;document.getElementById("activeServerCode").textContent=s.code;document.getElementById("activeServerMembers").textContent=s.members.length+" membre(s)";document.getElementById("serverMembersList").innerHTML=s.members.map(m=>`<div class="member ${m.online?"online":""}"><span>${m.name[0].toUpperCase()}</span><div><strong>${m.name}</strong><small>${m.role}</small></div></div>`).join("");this.renderChannels();this.renderMessages()},
  renderChannels(){const s=this.currentServer();document.getElementById("activeServerChannels").innerHTML=s.channels.map(ch=>`<button class="server-channel-pro ${ch.id===this.activeChannelId?"active":""}" onclick="CommunitiesPage.selectChannel('${ch.id}')">${this.icon(ch.type)} # ${ch.name}</button>`).join("")},
  selectChannel(id){this.activeChannelId=id;this.renderChannels();this.renderMessages()},
  renderMessages(){const ch=this.currentChannel();if(!ch)return;document.getElementById("activeChannelTitle").textContent="# "+ch.name;document.getElementById("activeChannelType").textContent=this.icon(ch.type)+" "+this.label(ch.type);const box=document.getElementById("serverMessages");box.innerHTML=ch.messages.length?ch.messages.map(m=>`<div class="bubble"><b>${m.author}</b>${m.text}</div>`).join(""):`<div class="bubble system">Aucun message pour l’instant.</div>`;box.scrollTop=box.scrollHeight},
  addChannel(){const s=this.currentServer();const name=document.getElementById("newChannelName").value.trim().toLowerCase().replaceAll(" ","-");const type=document.getElementById("newChannelType").value;if(!s||!name)return alert("Mets un nom de salon.");if(s.channels.some(ch=>ch.name===name))return alert("Ce salon existe déjà.");const ch={id:this.id(),name,type,messages:[]};s.channels.push(ch);this.activeChannelId=ch.id;document.getElementById("newChannelName").value="";this.save();this.render();this.renderHome();this.renderServer()},
  sendMessage(){const input=document.getElementById("serverMessageInput");const text=input.value.trim();const ch=this.currentChannel();if(!text||!ch)return;ch.messages.push({author:AuthPage?.currentUser?.pseudo||"Moi",text});input.value="";this.save();this.renderMessages()},
  clearChannel(){const ch=this.currentChannel();if(!ch||!confirm("Vider ce salon ?"))return;ch.messages=[];this.save();this.renderMessages()},
  deleteChannel(){const s=this.currentServer();const ch=this.currentChannel();if(!s||!ch)return;if(s.channels.length<=1)return alert("Il faut garder au moins un salon.");if(!confirm("Supprimer ce salon ?"))return;s.channels=s.channels.filter(c=>c.id!==ch.id);this.activeChannelId=s.channels[0].id;this.save();this.render();this.renderHome();this.renderServer()},
  deleteServer(){const s=this.currentServer();if(!s||!confirm("Supprimer ce serveur ?"))return;this.communities=this.communities.filter(c=>c.id!==s.id);this.activeServerId=null;document.getElementById("serverApp").classList.add("hidden");this.save();this.render();this.renderHome()},
  copyCode(){const s=this.currentServer();if(!s)return;navigator.clipboard?.writeText(s.code);alert("Code copié : "+s.code)},
  currentServer(){return this.communities.find(c=>c.id===this.activeServerId)},currentChannel(){return this.currentServer()?.channels.find(ch=>ch.id===this.activeChannelId)},icon(t){return{text:"💬",announce:"📢",media:"🖼",staff:"🛡"}[t]||"💬"},label(t){return{text:"Texte",announce:"Annonce",media:"Média",staff:"Staff"}[t]||"Texte"},save(){HubixStorage.set("hubix_v09_communities",this.communities)}
};
