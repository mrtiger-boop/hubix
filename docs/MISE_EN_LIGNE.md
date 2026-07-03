# Hubix — Passage en vrai site en ligne

La v2.2 enlève les faux profils. Maintenant, le match cherche uniquement des profils réels.

## Prochaine étape technique

Pour que Hubix fonctionne vraiment en ligne, il faut ajouter :

1. Une base de données
2. Une authentification réelle
3. Un stockage des photos de profil
4. Un système temps réel pour :
   - utilisateurs en ligne
   - recherche de match
   - messages privés
   - chat mondial
   - amis / favoris / blocages / signalements

## Architecture conseillée

- Front : ton site actuel Hubix
- Base de données : Supabase
- Auth : Supabase Auth
- Photos : Supabase Storage
- Temps réel : Supabase Realtime
- Mise en ligne : Vercel, Netlify ou Render

## Tables nécessaires

- profiles
- online_status
- match_queue
- matches
- private_messages
- world_messages
- friends
- favorites
- blocks
- reports
- cosmetics
- user_cosmetics

## Important

Le système actuel utilise encore localStorage pour tester sur ton PC.
La prochaine version devra remplacer localStorage par Supabase.
