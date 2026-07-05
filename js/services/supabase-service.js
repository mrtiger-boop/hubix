const HubixOnline = {
  client: null,
  ready: false,

  init() {
    const url = window.HUBIX_SUPABASE_URL;
    const key = window.HUBIX_SUPABASE_ANON_KEY;
    if (!window.supabase || !url || !key || url.includes("REMPLACE_") || key.includes("REMPLACE_")) {
      this.ready = false;
      return false;
    }
    this.client = window.supabase.createClient(url, key);
    this.ready = true;
    return true;
  },

  normalizeProfile(p) {
    if (!p) return null;
    return {
      id: p.id,
      email: p.email || "",
      pseudo: p.pseudo || p.email?.split("@")[0] || "Utilisateur",
      bio: p.bio || "Membre Hubix.",
      age: Number(p.age) || 18,
      country: p.country || "France",
      lang: p.lang || "Français",
      gender: p.gender || "Peu importe",
      interests: p.interests || [],
      goals: p.goals || [],
      status: p.status || "En ligne",
      avatar: p.avatar_url || p.avatar || null,
      avatar_url: p.avatar_url || p.avatar || null,
      xp: Number(p.xp) || 0,
      level: Number(p.level) || 1,
      rubies: Number(p.rubies) || 2500
    };
  },

  async getCurrentUser() {
    if (!this.ready) return null;
    const { data, error } = await this.client.auth.getUser();
    if (error || !data?.user) return null;
    const profile = await this.getProfile(data.user.id);
    if (!profile) return null;
    await this.setPresence(profile.id, true, "home");
    return profile;
  },

  async getProfile(id) {
    const { data, error } = await this.client.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return this.normalizeProfile(data);
  },

  async signUp({ email, password, pseudo, age, country, bio, avatarFile }) {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;
    const user = data.user;
    if (!user) throw new Error("Compte créé. Vérifie ton email puis connecte-toi.");
    let avatar_url = null;
    if (avatarFile) avatar_url = await this.uploadAvatar(user.id, avatarFile);
    const profile = { id: user.id, email, pseudo, bio: bio || "Membre Hubix.", age: Number(age) || 18, country: country || "France", lang: "Français", gender: "Peu importe", interests: [], goals: ["Discuter"], status: "En ligne", avatar_url, level: 1, xp: 0, rubies: 2500 };
    const { data: inserted, error: insertError } = await this.client.from("profiles").insert(profile).select().maybeSingle();
    if (insertError) throw insertError;
    await this.setPresence(user.id, true, "register");
    return this.normalizeProfile(inserted || profile);
  },

  async signIn({ identifier, password }) {
    let email = identifier.trim().toLowerCase();
    if (!email.includes("@")) {
      const { data, error } = await this.client.from("profiles").select("email").eq("pseudo", identifier.trim()).maybeSingle();
      if (error) throw error;
      if (!data?.email) throw new Error("Pseudo introuvable.");
      email = data.email;
    }
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await this.getProfile(data.user.id);
    if (!profile) throw new Error("Profil introuvable dans profiles.");
    await this.setPresence(profile.id, true, "login");
    return profile;
  },

  async updateProfile(profile, avatarFile) {
    const updateData = { pseudo: profile.pseudo, bio: profile.bio, age: Number(profile.age) || 18, country: profile.country || "France", status: profile.status || "En ligne", updated_at: new Date().toISOString() };
    if (avatarFile) updateData.avatar_url = await this.uploadAvatar(profile.id, avatarFile);
    const { data, error } = await this.client.from("profiles").update(updateData).eq("id", profile.id).select().maybeSingle();
    if (error) throw error;
    return this.normalizeProfile(data);
  },

  async uploadAvatar(userId, file) {
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await this.client.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) throw error;
    return this.client.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  },

  async setPresence(userId, isOnline, page = "") {
    if (!this.ready || !userId) return;
    const now = new Date().toISOString();
    await this.client.from("presence").upsert({ user_id: userId, is_online: isOnline, page, last_seen: now, updated_at: now });
    await this.client.from("online_status").upsert({ user_id: userId, is_online: isOnline, last_seen: now });
  },

  async onlineCount() {
    if (!this.ready) return 0;
    const { count } = await this.client.from("presence").select("*", { count: "exact", head: true }).eq("is_online", true);
    return count || 0;
  },

  subscribePresence(callback) {
    if (!this.ready) return null;
    return this.client.channel("hubix_presence").on("postgres_changes", { event: "*", schema: "public", table: "presence" }, callback).subscribe();
  },

  ageOk(age, range) {
    if (!range || range === "Peu importe") return true;
    if (range === "71+") return age >= 71;
    const [a, b] = range.split("-").map(Number);
    return age >= a && age <= b;
  },

  compatibility(me, other, prefs) {
    let score = 40;
    if (prefs.country === "Monde entier" || prefs.country === other.country) score += 15;
    if (prefs.lang === other.lang) score += 15;
    if (this.ageOk(other.age, prefs.age)) score += 15;
    if (prefs.gender === "Peu importe" || prefs.gender === other.gender) score += 10;
    return Math.min(99, score);
  },

  async getBlockedIds(userId) {
    if (!this.ready || !userId) return [];
    const { data } = await this.client.from("blocks").select("blocked_id").eq("user_id", userId);
    return (data || []).map(x => x.blocked_id);
  },

  async findMatch(currentUser, prefs, blockedNames = []) {
    const blockedIds = await this.getBlockedIds(currentUser.id);
    let query = this.client.from("profiles").select("*, presence!left(is_online)").neq("id", currentUser.id).limit(100);
    if (prefs.gender && prefs.gender !== "Peu importe") query = query.eq("gender", prefs.gender);
    if (prefs.country && prefs.country !== "Monde entier") query = query.eq("country", prefs.country);
    const { data, error } = await query;
    if (error) throw error;
    const pool = (data || []).map(profile => {
      const p = this.normalizeProfile(profile);
      p.is_online = Array.isArray(profile.presence) ? profile.presence[0]?.is_online : profile.presence?.is_online;
      p.compatibility = this.compatibility(currentUser, p, prefs);
      return p;
    }).filter(p => p && p.is_online !== false && !blockedIds.includes(p.id) && !blockedNames.includes(p.pseudo) && this.ageOk(p.age, prefs.age)).sort((a, b) => b.compatibility - a.compatibility);
    if (!pool.length) return null;
    const matched = pool.slice(0, 10)[Math.floor(Math.random() * Math.min(10, pool.length))];
    const match = await this.createMatch(currentUser.id, matched.id, matched.compatibility);
    matched.match_id = match?.id || null;
    return matched;
  },

  async createMatch(userA, userB, compatibility = 85) {
    const { data, error } = await this.client.from("matches").insert({ user_a: userA, user_b: userB, compatibility, active: true }).select().maybeSingle();
    if (error) throw error;
    return data;
  },

  async sendWorldMessage(lang, room, senderId, body, imageUrl = null) {
    const { error } = await this.client.from("world_messages").insert({ lang, room, sender_id: senderId, body, image_url: imageUrl });
    if (error) throw error;
  },

  async listWorldMessages(lang, room) {
    const { data, error } = await this.client.from("world_messages").select("*, profiles!sender_id(pseudo, avatar_url)").eq("lang", lang).eq("room", room).is("deleted_at", null).order("created_at", { ascending: true }).limit(150);
    if (error) throw error;
    return data || [];
  },

  subscribeWorldMessages(lang, room, callback) {
    if (!this.ready) return null;
    return this.client.channel(`hubix_world_${lang}_${room}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "world_messages" }, payload => {
      if (payload.new.lang === lang && Number(payload.new.room) === Number(room)) callback(payload.new);
    }).subscribe();
  },

  async sendPrivateMessage(matchId, senderId, body, imageUrl = null) {
    const { error } = await this.client.from("private_messages").insert({ match_id: matchId, sender_id: senderId, body, image_url: imageUrl });
    if (error) throw error;
  },

  async listPrivateMessages(matchId) {
    const { data, error } = await this.client.from("private_messages").select("*, profiles!sender_id(pseudo, avatar_url)").eq("match_id", matchId).is("deleted_at", null).order("created_at", { ascending: true }).limit(150);
    if (error) throw error;
    return data || [];
  },

  subscribePrivateMessages(matchId, callback) {
    if (!this.ready || !matchId) return null;
    return this.client.channel(`hubix_private_${matchId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `match_id=eq.${matchId}` }, payload => callback(payload.new)).subscribe();
  },

  async addFriend(userId, friendId) { await this.client.from("friends").upsert({ user_id: userId, friend_id: friendId }); },
  async addFavorite(userId, favoriteId) { await this.client.from("favorites").upsert({ user_id: userId, favorite_id: favoriteId }); },
  async blockUser(userId, blockedId) { await this.client.from("blocks").upsert({ user_id: userId, blocked_id: blockedId }); },

  async listSocial(table, userId, idColumn) {
    const { data } = await this.client.from(table).select(`${idColumn}, profiles!${idColumn}(*)`).eq("user_id", userId);
    return (data || []).map(row => this.normalizeProfile(row.profiles)).filter(Boolean);
  }
};
