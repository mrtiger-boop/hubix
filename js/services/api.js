const API = {
  client: null,
  ready: false,

  init() {
    const url = window.HUBIX_SUPABASE_URL;
    const key = window.HUBIX_SUPABASE_ANON_KEY;
    if (!window.supabase || !url || !key || url.includes("REMPLACE_") || key.includes("REMPLACE_")) return false;
    this.client = window.supabase.createClient(url, key);
    this.ready = true;
    return true;
  },

  profile(p) {
    if (!p) return null;
    return {
      id: p.id,
      email: p.email || "",
      pseudo: p.pseudo || p.email?.split("@")[0] || "Utilisateur",
      bio: p.bio || "Membre Hubix.",
      age: Number(p.age) || 18,
      country: p.country || "France",
      region: p.region || "",
      city: p.city || "",
      lang: p.lang || "Français",
      gender: p.gender || "Peu importe",
      interests: p.interests || [],
      goals: p.goals || [],
      status: p.status || "En ligne",
      avatar_url: p.avatar_url || null,
      banner_url: p.banner_url || null,
      xp: Number(p.xp) || 0,
      level: Number(p.level) || 1,
      rubies: Number(p.rubies) || 2500
    };
  },

  async current() {
    const { data } = await this.client.auth.getUser();
    if (!data?.user) return null;
    return this.getProfile(data.user.id);
  },

  async getProfile(id) {
    const { data, error } = await this.client.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return this.profile(data);
  },

  async uploadAvatar(id, file) {
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${id}/avatar-${Date.now()}.${ext}`;
    const { error } = await this.client.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) throw error;
    return this.client.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  },

  async signUp({ email, password, pseudo, age, country, bio, avatarFile }) {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Confirme ton email puis connecte-toi.");
    let avatar_url = null;
    if (avatarFile) avatar_url = await this.uploadAvatar(data.user.id, avatarFile);
    const row = { id: data.user.id, email, pseudo, bio: bio || "Membre Hubix.", age: Number(age) || 18, country: country || "France", lang: "Français", gender: "Peu importe", goals: ["Discuter"], avatar_url };
    const ins = await this.client.from("profiles").insert(row).select().maybeSingle();
    if (ins.error) throw ins.error;
    await this.setPresence(data.user.id, true, "register");
    return this.profile(ins.data || row);
  },

  async signIn({ identifier, password }) {
    let email = identifier.trim().toLowerCase();
    if (!email.includes("@")) {
      const r = await this.client.from("profiles").select("email").eq("pseudo", identifier.trim()).maybeSingle();
      if (r.error) throw r.error;
      if (!r.data?.email) throw new Error("Pseudo introuvable.");
      email = r.data.email;
    }
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const p = await this.getProfile(data.user.id);
    await this.setPresence(p.id, true, "login");
    return p;
  },

  async signOut(id) {
    if (id) await this.setPresence(id, false, "logout");
    await this.client.auth.signOut();
  },

  async updateProfile(p, file) {
    const up = { pseudo: p.pseudo, bio: p.bio, age: Number(p.age) || 18, country: p.country || "France", status: p.status || "En ligne", updated_at: new Date().toISOString() };
    if (file) up.avatar_url = await this.uploadAvatar(p.id, file);
    const r = await this.client.from("profiles").update(up).eq("id", p.id).select().maybeSingle();
    if (r.error) throw r.error;
    return this.profile(r.data);
  },

  async setPresence(id, online, page = "") {
    if (!id) return;
    const now = new Date().toISOString();
    await this.client.from("presence").upsert({ user_id: id, is_online: online, page, last_seen: now, updated_at: now });
  },

  async onlineCount() {
    const { count } = await this.client.from("presence").select("*", { count: "exact", head: true }).eq("is_online", true);
    return count || 0;
  },

  subPresence(cb) {
    return this.client.channel("presence_global").on("postgres_changes", { event: "*", schema: "public", table: "presence" }, cb).subscribe();
  },

  async worldList(lang, room) {
    const r = await this.client.from("world_messages").select("*,profiles!sender_id(pseudo,avatar_url)").eq("lang", lang).eq("room", room).is("deleted_at", null).order("created_at", { ascending: true }).limit(150);
    if (r.error) throw r.error;
    return r.data || [];
  },

  async worldSend(lang, room, uid, body) {
    const r = await this.client.from("world_messages").insert({ lang, room, sender_id: uid, body });
    if (r.error) throw r.error;
  },

  subWorld(lang, room, cb) {
    return this.client.channel(`world_${lang}_${room}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "world_messages" }, payload => {
      if (payload.new.lang === lang && Number(payload.new.room) === Number(room)) cb(payload.new);
    }).subscribe();
  },

  ageOk(age, range) {
    if (!range || range === "Peu importe") return true;
    if (range === "51+") return age >= 51;
    const [a, b] = range.split("-").map(Number);
    return age >= a && age <= b;
  },

  score(me, other, prefs) {
    let score = 45;
    if (prefs.country === "Monde entier" || prefs.country === other.country) score += 15;
    if (prefs.lang === other.lang) score += 15;
    if (this.ageOk(other.age, prefs.age)) score += 15;
    if (prefs.gender === "Peu importe" || prefs.gender === other.gender) score += 10;
    return Math.min(99, score);
  },

  async getExistingMatch(userA, userB) {
    const r = await this.client.from("matches").select("*").or(`and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`).limit(1);
    if (r.error) throw r.error;
    return r.data?.[0] || null;
  },

  async getOrCreateMatch(userA, userB, compatibility = 85) {
    const existing = await this.getExistingMatch(userA, userB);
    if (existing) return existing;
    const created = await this.client.from("matches").insert({ user_a: userA, user_b: userB, compatibility, active: true }).select().maybeSingle();
    if (created.error) throw created.error;
    return created.data;
  },

  async findMatch(me, prefs) {
    let query = this.client.from("profiles").select("*,presence!left(is_online)").neq("id", me.id).limit(100);
    if (prefs.gender !== "Peu importe") query = query.eq("gender", prefs.gender);
    if (prefs.country !== "Monde entier") query = query.eq("country", prefs.country);
    const r = await query;
    if (r.error) throw r.error;
    let pool = (r.data || []).map(row => {
      const p = this.profile(row);
      p.is_online = Array.isArray(row.presence) ? row.presence[0]?.is_online : row.presence?.is_online;
      p.compatibility = this.score(me, p, prefs);
      return p;
    }).filter(p => p.is_online !== false).filter(p => this.ageOk(p.age, prefs.age)).sort((a, b) => b.compatibility - a.compatibility);
    if (!pool.length) return null;
    const matched = pool.slice(0, 10)[Math.floor(Math.random() * Math.min(10, pool.length))];
    const match = await this.getOrCreateMatch(me.id, matched.id, matched.compatibility);
    matched.match_id = match.id;
    return matched;
  },

  async privateList(matchId) {
    const r = await this.client.from("private_messages").select("*,profiles!sender_id(pseudo,avatar_url)").eq("match_id", matchId).is("deleted_at", null).order("created_at", { ascending: true }).limit(150);
    if (r.error) throw r.error;
    return r.data || [];
  },

  async privateSend(matchId, uid, body) {
    const r = await this.client.from("private_messages").insert({ match_id: matchId, sender_id: uid, body });
    if (r.error) throw r.error;
  },

  subPrivate(matchId, cb) {
    return this.client.channel(`private_${matchId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `match_id=eq.${matchId}` }, cb).subscribe();
  },

  async openFriendChat(friendId) {
    const friend = await this.getProfile(friendId);
    const match = await this.getOrCreateMatch(Auth.user.id, friendId, 95);
    friend.match_id = match.id;
    friend.compatibility = 95;
    return friend;
  },

  async sendFriendRequest(senderId, receiverId) {
    if (senderId === receiverId) throw new Error("Impossible de t'ajouter toi-même.");
    const existing = await this.client.from("friend_requests").select("*").or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`).limit(1);
    if (existing.error) throw existing.error;
    const found = existing.data?.[0];
    if (found) {
      if (found.status === "pending") return found;
      if (found.status === "accepted") throw new Error("Vous êtes déjà amis.");
    }
    const created = await this.client.from("friend_requests").insert({ sender_id: senderId, receiver_id: receiverId, status: "pending" }).select().maybeSingle();
    if (created.error) throw created.error;
    return created.data;
  },

  async listFriendRequests(userId) {
    const r = await this.client.from("friend_requests").select("*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)").eq("receiver_id", userId).eq("status", "pending").order("created_at", { ascending: false });
    if (r.error) throw r.error;
    return r.data || [];
  },

  async acceptFriendRequest(requestId) {
    const req = await this.client.from("friend_requests").select("*").eq("id", requestId).maybeSingle();
    if (req.error) throw req.error;
    if (!req.data) throw new Error("Demande introuvable.");
    const update = await this.client.from("friend_requests").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", requestId);
    if (update.error) throw update.error;
    await this.client.from("friends").upsert([
      { user_id: req.data.sender_id, friend_id: req.data.receiver_id },
      { user_id: req.data.receiver_id, friend_id: req.data.sender_id }
    ]);
    await this.getOrCreateMatch(req.data.sender_id, req.data.receiver_id, 95);
  },

  async refuseFriendRequest(requestId) {
    const r = await this.client.from("friend_requests").update({ status: "refused", updated_at: new Date().toISOString() }).eq("id", requestId);
    if (r.error) throw r.error;
  },

  async add(table, userId, otherId, col) {
    const r = await this.client.from(table).upsert({ user_id: userId, [col]: otherId });
    if (r.error) throw r.error;
  },

  async listSocial(table, userId, col) {
    const r = await this.client.from(table).select(`${col}, profiles!${col}(*)`).eq("user_id", userId);
    if (r.error) return [];
    return (r.data || []).map(x => this.profile(x.profiles)).filter(Boolean);
  },

  async notifyList(uid) {
    const r = await this.client.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
    return r.data || [];
  },

  subNotify(uid, cb) {
    return this.client.channel(`notify_${uid}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, payload => cb(payload.new)).subscribe();
  }
};
