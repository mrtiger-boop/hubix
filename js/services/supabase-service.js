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

  normalizeProfile(profile) {
    if (!profile) return null;
    return {
      id: profile.id,
      email: profile.email || "",
      pseudo: profile.pseudo || profile.email?.split("@")[0] || "Utilisateur",
      bio: profile.bio || "Membre Hubix.",
      age: Number(profile.age) || 18,
      country: profile.country || "France",
      lang: profile.lang || "Français",
      gender: profile.gender || "Peu importe",
      status: profile.status || "En ligne",
      avatar: profile.avatar_url || profile.avatar || null,
      avatar_url: profile.avatar_url || profile.avatar || null,
      xp: Number(profile.xp) || 0,
      level: Number(profile.level) || 1
    };
  },

  async getCurrentUser() {
    if (!this.ready) return null;

    const { data, error } = await this.client.auth.getUser();
    if (error || !data?.user) return null;

    const profile = await this.getProfile(data.user.id);
    if (!profile) return null;

    await this.setOnline(profile.id, true);
    return profile;
  },

  async getProfile(id) {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

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

    const profile = {
      id: user.id,
      email,
      pseudo,
      bio: bio || "Membre Hubix.",
      age: Number(age) || 18,
      country: country || "France",
      lang: "Français",
      gender: "Peu importe",
      status: "En ligne",
      avatar_url,
      level: 1,
      xp: 0
    };

    const { data: inserted, error: insertError } = await this.client
      .from("profiles")
      .insert(profile)
      .select()
      .maybeSingle();

    if (insertError) throw insertError;

    await this.setOnline(user.id, true);
    return this.normalizeProfile(inserted || profile);
  },

  async signIn({ identifier, password }) {
    let email = identifier.trim().toLowerCase();

    if (!email.includes("@")) {
      const { data, error } = await this.client
        .from("profiles")
        .select("email")
        .eq("pseudo", identifier.trim())
        .maybeSingle();

      if (error) throw error;
      if (!data?.email) throw new Error("Pseudo introuvable.");
      email = data.email;
    }

    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const profile = await this.getProfile(data.user.id);
    if (!profile) throw new Error("Profil introuvable dans la table profiles.");

    await this.setOnline(profile.id, true);
    return profile;
  },

  async updateProfile(profile, avatarFile) {
    const updateData = {
      pseudo: profile.pseudo,
      bio: profile.bio,
      age: Number(profile.age) || 18,
      country: profile.country || "France",
      status: profile.status || "En ligne"
    };

    if (avatarFile) updateData.avatar_url = await this.uploadAvatar(profile.id, avatarFile);

    const { data, error } = await this.client
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return this.normalizeProfile(data);
  },

  async uploadAvatar(userId, file) {
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await this.client.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = this.client.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  },

  async setOnline(userId, isOnline) {
    if (!this.ready || !userId) return;
    await this.client.from("online_status").upsert({
      user_id: userId,
      is_online: isOnline,
      last_seen: new Date().toISOString()
    });
  },

  async onlineCount() {
    if (!this.ready) return 0;
    const { count } = await this.client
      .from("online_status")
      .select("*", { count: "exact", head: true })
      .eq("is_online", true);

    return count || 0;
  },

  ageOk(age, range) {
    if (!range || range === "Peu importe") return true;
    if (range === "71+") return age >= 71;
    const [a, b] = range.split("-").map(Number);
    return age >= a && age <= b;
  },

  async findMatch(currentUser, prefs, blockedNames = []) {
    let query = this.client
      .from("profiles")
      .select("*")
      .neq("id", currentUser.id)
      .limit(50);

    if (prefs.gender && prefs.gender !== "Peu importe") query = query.eq("gender", prefs.gender);
    if (prefs.country && prefs.country !== "Monde entier") query = query.eq("country", prefs.country);

    const { data, error } = await query;
    if (error) throw error;

    const pool = (data || [])
      .map(p => this.normalizeProfile(p))
      .filter(p => p && !blockedNames.includes(p.pseudo))
      .filter(p => this.ageOk(p.age, prefs.age));

    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  async sendWorldMessage(lang, room, senderId, body) {
    const { error } = await this.client.from("world_messages").insert({
      lang,
      room,
      sender_id: senderId,
      body
    });
    if (error) throw error;
  },

  async listWorldMessages(lang, room) {
    const { data, error } = await this.client
      .from("world_messages")
      .select("*, profiles!sender_id(pseudo)")
      .eq("lang", lang)
      .eq("room", room)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  }
};
