# Dialogue Audio — PLAI

Générateur de dialogues audio multivoix pour l'enseignement. Utilise Piper TTS (open source, gratuit) avec hébergement sur Hugging Face Spaces et stockage audio permanent sur Internet Archive.

## Stack

| Composant | Outil | Rôle |
|-----------|-------|------|
| Frontend | Next.js 14 (App Router) | Interface, déployé Vercel |
| Backend TTS | FastAPI + Piper TTS (Docker) | Génération audio, déployé HF Space |
| Base de données | Supabase (PostgreSQL) | Auth + historique |
| Stockage audio | Internet Archive | Hébergement MP3 permanent, gratuit |
| QR code | python-qrcode | Généré côté backend |

## Déploiement — 4 étapes

### 1. HF Space (backend TTS)

1. Créer un compte sur [huggingface.co](https://huggingface.co)
2. Nouveau Space → type **Docker** → visibilité **Public**
3. Pousser le dossier `/hf-space/` vers le repo HF Space :
   ```bash
   git clone https://huggingface.co/spaces/[username]/[space-name]
   cp -r hf-space/* [space-name]/
   cd [space-name] && git add . && git commit -m "init" && git push
   ```
4. Dans Settings → Variables, ajouter :
   - `IA_ACCESS_KEY` — clé Internet Archive
   - `IA_SECRET_KEY` — secret Internet Archive
5. Attendre le build (~5 min) → tester `GET https://[username]-[space-name].hf.space/health`

### 2. Internet Archive (stockage audio)

1. Créer un compte sur [archive.org](https://archive.org)
2. Aller sur [archive.org/account/s3.php](https://archive.org/account/s3.php)
3. Copier **Access Key** et **Secret Key** → les mettre dans HF Space (étape 1)

### 3. Supabase (base de données)

1. Créer un projet sur [supabase.com](https://supabase.com) (plan Free)
2. SQL Editor → exécuter :
   ```sql
   create table dialogues (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users,
     language text not null,
     script_text text not null,
     speakers jsonb not null,
     audio_url text,
     qr_url text,
     duration_seconds float,
     created_at timestamptz default now()
   );

   alter table dialogues enable row level security;
   create policy "users see own dialogues"
     on dialogues for all
     using (auth.uid() = user_id);
   ```
3. Authentication → activer **Email provider**
4. Copier l'URL et l'anon key (Settings → API)

### 4. Vercel (frontend)

1. Pousser le dossier `/frontend/` sur un repo GitHub
2. Connecter à [vercel.com](https://vercel.com) → importer le repo
3. Ajouter les variables d'environnement (Settings → Environment Variables) :
   ```
   NEXT_PUBLIC_HF_SPACE_URL=https://[username]-[space-name].hf.space
   NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_KEY=...
   ```
4. Déployer

## Voix disponibles

| Langue | ID voix | Locuteur |
|--------|---------|----------|
| Flamand (Belgique) | `nl_BE-nathalie-medium` | Nathalie (F) |
| Flamand (Belgique) | `nl_BE-rdh-medium` | Rdh (M) |
| Français | `fr_FR-siwis-medium` | Siwis (F) |
| Français | `fr_FR-upmc-pierre-medium` | Pierre (M) |
| Allemand | `de_DE-thorsten-medium` | Thorsten (M) |
| Allemand | `de_DE-eva_k-x_low` | Eva (F) |
| Néerlandais (NL) | `nl_NL-mls-medium` | Mls (N) |

## Licence

Piper TTS : MIT — [github.com/rhasspy/piper](https://github.com/rhasspy/piper)
