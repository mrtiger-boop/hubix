const S={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
function fileToDataUrl(file, cb){if(!file)return cb(null);const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file)}
function avatarHTML(value, cls="avatar-img"){return value?`<img class="${cls}" src="${value}" alt="avatar">`:null}

const Router={init(){document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>this.show(b.dataset.page)))},show(p){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(p)?.classList.add("active");document.querySelectorAll(".icon-nav button,.nav-popover button").forEach(b=>b.classList.toggle("active",b.dataset.page===p));document.getElementById("navPopover")?.classList.remove("open")}};

const Auth={
users:[],user:null,
init(){this.users=S.get("hubix_users",[]);this.user=S.get("hubix_session",null);$("registerBtn")?.addEventListener("click",()=>this.register());$("loginBtn")?.addEventListener("click",()=>this.login());this.ui()},
register(){let pseudo=$("registerPseudo").value.trim().replace(/\s+/g,""),email=$("registerEmail").value.trim().toLowerCase(),password=$("registerPassword").value,age=Number($("registerAge")?.value)||18,country=$("registerCountry")?.value.trim()||"France",bio=$("registerBio")?.value.trim()||"Membre Hubix.";if(pseudo.length<3)return msg("registerMessage","Pseudo trop court","error");if(!email.includes("@"))return msg("registerMessage","Email invalide","error");if(password.length<4)return msg("registerMessage","Mot de passe trop court","error");if(age<18)return msg("registerMessage","Hubix est prévu pour les 18+ dans cette maquette.","error");if(this.users.some(u=>u.pseudo.toLowerCase()===pseudo.toLowerCase()))return msg("registerMessage","Pseudo déjà utilisé","error");fileToDataUrl($("registerAvatar")?.files?.[0],avatar=>{this.user={id:"u"+Date.now(),pseudo,email,password,bio,age,country,status:"En ligne",xp:0,level:1,avatar};this.users.push(this.user);this.save();msg("registerMessage","Compte créé","success");this.ui();setTimeout(()=>Router.show("profile"),300)})},
login(){let id=$("loginIdentifier").value.trim().toLowerCase(),pw=$("loginPassword").value;let u=this.users.find(x=>(x.pseudo.toLowerCase()===id||x.email===id)&&x.password===pw);if(!u)return msg("loginMessage","Identifiants incorrects","error");this.user=u;this.save();msg("loginMessage","Connexion réussie","success");this.ui();setTimeout(()=>Router.show("profile"),300)},
update(d){if(!this.user)return false;let p=(d.pseudo||this.user.pseudo).trim().replace(/\s+/g,"");if(this.users.some(u=>u.id!==this.user.id&&u.pseudo.toLowerCase()===p.toLowerCase()))return false;this.user={...this.user,...d,pseudo:p};this.users=this.users.map(u=>u.id===this.user.id?this.user:u);this.save();this.ui();return true},
xp(n){if(!this.user)return;this.user.xp=(this.user.xp||0)+n;this.user.level=Math.floor(this.user.xp/100)+1;this.users=this.users.map(u=>u.id===this.user.id?this.user:u);this.save()},
save(){S.set("hubix_users",this.users);S.set("hubix_session",this.user)},
ui(){document.body.classList.toggle("logged-in",!!this.user);let p=this.user?.pseudo||"Invité",i=p[0]?.toUpperCase()||"?";set("miniPseudo",p);if($("miniAvatar"))$("miniAvatar").innerHTML=this.user?.avatar?`<img class="avatar-img" src="${this.user.avatar}">`:i;let e=$("settingsEmail");if(e)e.value=this.user?.email||"invité";Profile.render();Match.stats()}
};

const Shop={
items:["ruby","robot","heart","dragon","crown","galaxy","fire","ice","angel","demon","moon","cloud"].map((id,i)=>({id,name:id[0].toUpperCase()+id.slice(1),price:[250,350,420,900,1200,1300,700,700,850,850,650,600][i],file:`assets/frames/frame-${id}.svg`})),
init(){if(!S.get("hubix_wallet",null))S.set("hubix_wallet",{coins:2500,ownedFrames:[],equippedFrame:null});this.render()},
wallet(){return S.get("hubix_wallet",{coins:2500,ownedFrames:[],equippedFrame:null})},
save(w){S.set("hubix_wallet",w);this.coins();Match.stats()},
coins(){set("coinAmount",this.wallet().coins.toLocaleString("fr-FR"))},
render(){this.coins();let g=$("shopGrid");if(!g)return;let w=this.wallet();g.innerHTML=this.items.map(it=>{let owned=w.ownedFrames.includes(it.id),eq=w.equippedFrame===it.id;return `<article class="shop-card"><div class="shop-preview animated-frame" style="background-image:url('${it.file}')"></div><h3>${it.name}</h3><p>Cadre de profil Hubix.</p><div class="shop-price">💎 ${it.price} coins</div><button class="${owned?'owned':''}" onclick="${owned?`Shop.equip('${it.id}')`:`Shop.buy('${it.id}')`}">${eq?'Équipé':owned?'Équiper':'Acheter'}</button></article>`}).join("")},
buy(id){let it=this.items.find(x=>x.id===id),w=this.wallet();if(w.ownedFrames.includes(id))return this.equip(id);if(w.coins<it.price)return alert("Pas assez de coins");w.coins-=it.price;w.ownedFrames.push(id);w.equippedFrame=id;this.save(w);this.render();Profile.render()},
equip(id){let w=this.wallet();w.equippedFrame=id;this.save(w);this.render();Profile.render()},
equipped(){let w=this.wallet();return this.items.find(x=>x.id===w.equippedFrame)},
owned(){let w=this.wallet();return this.items.filter(x=>w.ownedFrames.includes(x.id))},
random(){return this.items[Math.floor(Math.random()*this.items.length)]}
};

const Friends={
init(){$("searchFriendBtn")?.addEventListener("click",()=>this.render());this.render()},
arr(k){return S.get("hubix_"+k,[])},save(k,a){S.set("hubix_"+k,a);this.render();Match.stats()},
names(k){return this.arr(k).map(p=>p.name)},
add(k,p){let a=this.arr(k);if(!a.some(x=>x.name===p.name))a.push(p);this.save(k,a)},
remove(k,n){this.save(k,this.arr(k).filter(x=>x.name!==n))},
card(p,k){return `<div class="person-card"><h3>${p.name}</h3><p>${p.age} ans • ${p.country}<br>${p.bio||""}</p><button>Voir profil</button><button onclick="Friends.remove('${k}','${p.name}')">Supprimer</button></div>`},
render(){let q=($("friendSearch")?.value||"").toLowerCase(),f=a=>a.filter(p=>p.name.toLowerCase().includes(q));if($("friendList"))$("friendList").innerHTML=f(this.arr("friends")).map(p=>this.card(p,"friends")).join("")||`<p class="muted">Aucun ami.</p>`;if($("favoriteList"))$("favoriteList").innerHTML=f(this.arr("favorites")).map(p=>this.card(p,"favorites")).join("")||`<p class="muted">Aucun favori.</p>`;if($("blockedList"))$("blockedList").innerHTML=f(this.arr("blocked")).map(p=>this.card(p,"blocked")).join("")||`<p class="muted">Aucun bloqué.</p>`}
};

const Match={
people:[],
current:null,
realPool(){
  const users = S.get("hubix_users", []);
  const blocked = Friends.names("blocked");
  const me = Auth.user?.pseudo;
  return users
    .filter(u => u && u.pseudo && u.pseudo !== me)
    .filter(u => !blocked.includes(u.pseudo))
    .map(u => ({
      name: u.pseudo,
      gender: u.gender || "Peu importe",
      age: Number(u.age) || 18,
      country: u.country || "France",
      lang: u.lang || "Français",
      goal: u.goals || ["Discuter"],
      interests: u.interests || ["💬 Discuter"],
      bio: u.bio || "Membre Hubix.",
      status: u.status || "En ligne",
      avatar: u.avatar || null,
      realUser: true
    }));
},
current:null,
init(){["genderChoices","ageChoices"].forEach(id=>bindChoice(id,false));["purposeChoices","interestChoices"].forEach(id=>bindChoice(id,true));$("startMatchBtn")?.addEventListener("click",()=>this.search());$("nextMatchBtn")?.addEventListener("click",()=>this.search());$("addFriendFromMatch")?.addEventListener("click",()=>this.addFriend());$("favoriteMatch")?.addEventListener("click",()=>this.favorite());$("blockMatch")?.addEventListener("click",()=>this.block());$("reportMatch")?.addEventListener("click",()=>this.report());$("sendPrivateMessage")?.addEventListener("click",()=>this.send());$("privateInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")this.send()});$("emojiBtn")?.addEventListener("click",()=>this.toggleEmoji());$("privateImageInput")?.addEventListener("change",e=>this.sendImage(e));this.buildEmojis();this.stats()},
active(id){return [...document.querySelectorAll(`#${id} button.active`)].map(b=>b.dataset.value||b.textContent.trim())},
prefs(){return{gender:this.active("genderChoices")[0]||"Peu importe",age:this.active("ageChoices")[0]||"Peu importe",purposes:this.active("purposeChoices"),interests:this.active("interestChoices"),country:$("countryFilter").value,lang:$("languageFilter").value,status:$("statusFilter").value}},
search(){hide("matchIdle");hide("matchResult");show("searchScreen");let steps=["Recherche...","Analyse des préférences...","Recherche d'une personne...","Connexion...","Match trouvé ✨"],i=0;$("searchStep").textContent=steps[0];let t=setInterval(()=>{i++;$("searchStep").textContent=steps[i]||steps.at(-1);if(i>=steps.length-1){clearInterval(t);setTimeout(()=>this.show(),450)}},600)},
show(){let p=this.prefs();let pool=this.realPool().filter(x=>(p.gender==="Peu importe"||x.gender===p.gender)&&(p.country==="Monde entier"||x.country===p.country)&&(p.status!=="En ligne uniquement"||x.status==="En ligne")&&this.ageOk(x.age,p.age));
if(!pool.length){hide("searchScreen");show("matchIdle");$("matchIdle").innerHTML=`<img src="assets/illustrations/match-robot.svg"/><h1>Aucun vrai utilisateur trouvé</h1><p>Les faux profils ont été supprimés. Quand Hubix sera branché en temps réel, les utilisateurs connectés apparaîtront ici.</p><button class="primary huge" id="restartSearchBtn">Relancer la recherche</button>`;$("restartSearchBtn")?.addEventListener("click",()=>this.search());return}
this.current=pool[Math.floor(Math.random()*pool.length)];this.render();hide("searchScreen");show("matchResult");this.record()},
ageOk(age,r){if(!r||r==="Peu importe")return true;if(r==="71+")return age>=71;let [a,b]=r.split("-").map(Number);return age>=a&&age<=b},
score(p){let prefs=this.prefs(),s=40;if(prefs.gender==="Peu importe"||prefs.gender===p.gender)s+=10;if(prefs.country==="Monde entier"||prefs.country===p.country)s+=10;if(prefs.lang===p.lang)s+=10;s+=Math.min(20,prefs.interests.filter(i=>p.interests.includes(i)).length*5);return Math.min(99,s)},
render(){let p=this.current,sc=this.score(p);if($("matchedInitial"))$("matchedInitial").innerHTML=p.avatar?`<img class="profile-avatar-large" src="${p.avatar}">`:p.name[0];set("matchedName",p.name);set("matchedMeta",`${p.age} ans • ${p.country} • ${p.lang} • ${p.status}`);set("matchedBio",p.bio);set("compatibilityBadge",`Compatibilité ${sc}%`);$("matchedInterests").innerHTML=p.interests.map(i=>`<span>${i}</span>`).join("");set("privateChatTitle","Conversation avec "+p.name);$("privateMessages").innerHTML=`<div class="bubble"><b>${p.name}</b>Connexion avec un vrai profil Hubix.</div>`;$("matchFrame").style.setProperty("--frame-url",`url("../${Shop.random().file}")`)},
buildEmojis(){const box=$("emojiPanel");if(!box)return;box.innerHTML=["😀","😂","😍","❤️","🔥","💎","👋","😎","🥳","😅","👍","🙏","🎮","🎵","🌹","✨"].map(e=>`<button onclick="Match.addEmoji('${e}')">${e}</button>`).join("")},
toggleEmoji(){ $("emojiPanel")?.classList.toggle("hidden") },
addEmoji(e){const input=$("privateInput"); if(input){input.value+=e; input.focus()}},
sendImage(ev){const file=ev.target.files?.[0];if(!file||!this.current)return;fileToDataUrl(file,url=>{let box=$("privateMessages");box.innerHTML+=`<div class="bubble me"><b>Moi</b><br><img class="chat-image" src="${url}"></div>`;box.scrollTop=box.scrollHeight;Auth.xp(5)});ev.target.value=""},
send(){let input=$("privateInput"),text=input.value.trim();if(!text||!this.current)return;let box=$("privateMessages");box.innerHTML+=`<div class="bubble me"><b>Moi</b>${text}</div>`;input.value="";box.scrollTop=box.scrollHeight;Auth.xp(5);this.stats()},
addFriend(){Friends.add("friends",this.current);alert(this.current.name+" ajouté en ami.")},favorite(){Friends.add("favorites",this.current);alert(this.current.name+" ajouté en favori.")},block(){if(confirm("Bloquer "+this.current.name+" ?")){Friends.add("blocked",this.current);this.search()}},report(){let r=S.get("hubix_reports",[]);r.push({name:this.current.name,date:new Date().toISOString()});S.set("hubix_reports",r);alert("Signalement envoyé.")},
record(){let st=S.get("hubix_stats",{matches:0});st.matches++;S.set("hubix_stats",st);Auth.xp(10);this.stats()},
stats(){let st=S.get("hubix_stats",{matches:0}),fr=Friends.arr("friends"),w=Shop.wallet?.()||{ownedFrames:[]},online=Math.max(0,S.get("hubix_users",[]).filter(u=>u.status!=="Invisible").length);set("globalOnlineCount",online);set("homeOnline",online);set("homeMatches",st.matches||0);set("homeFriends",fr.length);set("homeFrames",w.ownedFrames.length);set("profileMatches",st.matches||0);set("profileFriends",fr.length);set("profileXP",Auth.user?.xp||0);set("profileLevel",Auth.user?.level||1);if($("homeActivity")&&st.matches)$("homeActivity").innerHTML=`<div class="favorite">💎 <div><strong>${st.matches} rencontre(s)</strong><br><small>Continue à discuter pour gagner de l'XP.</small></div></div>`}
};

const World={lang:"Français",server:1,init(){document.querySelectorAll(".lang").forEach(b=>b.addEventListener("click",()=>{this.lang=b.dataset.lang;document.querySelectorAll(".lang").forEach(x=>x.classList.remove("active"));b.classList.add("active");this.names();this.render()}));document.querySelectorAll(".world-server").forEach(b=>b.addEventListener("click",()=>{this.server=b.dataset.server;document.querySelectorAll(".world-server").forEach(x=>x.classList.remove("active"));b.classList.add("active");this.render()}));$("sendWorldBtn")?.addEventListener("click",()=>this.send());$("worldInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")this.send()});this.render()},key(){return`world_${this.lang}_${this.server}`},names(){["One","Two","Three"].forEach((n,i)=>set("world"+n,`${this.lang} #${i+1}`))},render(){set("worldTitle",`🌍 ${this.lang} #${this.server}`);let m=S.get(this.key(),[]);$("worldMessages").innerHTML=m.length?m.map(x=>`<div class="bubble"><b>${x.author}</b>${x.text}</div>`).join(""):`<p class="muted">Aucun message pour l’instant. Les messages réels apparaîtront ici.</p>`},send(){let input=$("worldInput"),text=input.value.trim();if(!text)return;let m=S.get(this.key(),[]);m.push({author:Auth.user?.pseudo||"Moi",text});S.set(this.key(),m);input.value="";this.render()}};

const Profile={init(){$("saveProfileBtn")?.addEventListener("click",()=>this.save());this.render()},render(){let u=Auth.user,p=u?.pseudo||"Invité",bio=u?.bio||"Connecte-toi pour personnaliser ton profil Hubix.",i=p[0]?.toUpperCase()||"?";if($("profileAvatar"))$("profileAvatar").innerHTML=u?.avatar?`<img class="profile-avatar-large" src="${u.avatar}">`:i;set("profilePseudo",p);set("profileBio",bio);if($("miniProfileInitial"))$("miniProfileInitial").innerHTML=u?.avatar?`<img class="avatar-img" src="${u.avatar}">`:i;set("miniProfileName",p);set("miniProfileStatus",u?.status||"Non connecté");let f=Shop.equipped?.();this.frame("profileFrame",f);this.frame("miniProfileFrame",f);if($("profileChips"))$("profileChips").innerHTML=`<span>${u?.status||"Invité"}</span><span>${u?.age||"?"} ans</span><span>${u?.country||"France"}</span><span>Style Ruby</span>`;if(u&&$("editPseudo")){$("editPseudo").value=u.pseudo;$("editBio").value=u.bio;$("editAge").value=u.age||18;$("editCountry").value=u.country||"France";$("editStatus").value=u.status||"En ligne"}this.frames();Match.stats()},save(){const data={pseudo:$("editPseudo").value,bio:$("editBio").value.trim()||"Membre Hubix.",age:Number($("editAge").value)||18,country:$("editCountry").value.trim()||"France",status:$("editStatus").value};const file=$("editAvatar")?.files?.[0];fileToDataUrl(file,avatar=>{if(avatar)data.avatar=avatar;let ok=Auth.update(data);if(!ok)return msg("profileMessage","Pseudo déjà utilisé","error");msg("profileMessage","Profil sauvegardé","success");this.render()})},frame(id,f){let el=$(id);if(!el)return;el.style.setProperty("--frame-url",f?`url("../${f.file}")`:"none");if(f)el.classList.add("animated-frame")},frames(){let o=Shop.owned?.()||[],box=$("profileFramesList");if(box)box.innerHTML=o.length?o.map(it=>`<div class="frame-option"><img src="${it.file}"><strong>${it.name}</strong><button onclick="Shop.equip('${it.id}')">Équiper</button></div>`).join(""):`<p class="muted">Aucun cadre possédé. Va dans la boutique.</p>`}};

function $(id){return document.getElementById(id)}function set(id,v){let e=$(id);if(e)e.textContent=v}function show(id){$(id)?.classList.remove("hidden")}function hide(id){$(id)?.classList.add("hidden")}function msg(id,t,c){let e=$(id);if(e){e.textContent=t;e.className="message "+c}}function bindChoice(id,multi){document.querySelectorAll(`#${id} button`).forEach(b=>b.addEventListener("click",()=>{if(!multi)document.querySelectorAll(`#${id} button`).forEach(x=>x.classList.remove("active"));b.classList.toggle("active")}))}
document.addEventListener("DOMContentLoaded",()=>{Router.init();Auth.init();Shop.init();Friends.init();Match.init();World.init();Profile.init();$("registerAvatar")?.addEventListener("change",e=>fileToDataUrl(e.target.files?.[0],url=>{if(url)$("registerAvatarPreview").innerHTML=`<img class="profile-avatar-large" src="${url}">`}));$("menuToggle")?.addEventListener("click",e=>{e.stopPropagation();$("navPopover")?.classList.toggle("open")});document.addEventListener("click",e=>{if(!$("navPopover")?.contains(e.target)&&e.target.id!=="menuToggle")$("navPopover")?.classList.remove("open")});document.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>b.animate([{transform:"scale(1)"},{transform:"scale(.96)"},{transform:"scale(1)"}],{duration:150})))});
