# Mise en ligne Hubix v2.8

1. Crée un projet Supabase.
2. Va dans SQL Editor.
3. Copie le contenu de `supabase/schema.sql`.
4. Clique sur Run.
5. Dans Storage, crée les buckets :
   - avatars
   - chat-images
6. Dans Project Settings > API, récupère :
   - Project URL
   - anon public key
7. Mets ces valeurs dans `js/supabase-config.js`.
8. Mets le projet sur GitHub.
9. Déploie sur Vercel ou Netlify.

## Tables incluses
profiles, online_status, matches, private_messages, world_messages, friends, favorites, blocks, reports, user_cosmetics.
