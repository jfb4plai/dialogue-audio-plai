# Dialogue Audio — Audit fluidité, sécurité, erreurs et opportunités

**Date :** 2026-06-03  
**Scope :** Fix fluidité GenerateButton + correctifs sécurité/erreurs + 3 opportunités UX  
**Hors scope :** Refactoring SSE / job-ID pattern (envisageable dans une V2)

---

## 1. Contexte et diagnostic

### Problème signalé
L'enseignant voit les étapes de progression s'enchaîner normalement puis reste bloqué sur "Création du QR code…" pendant une durée indéterminée.

### Cause racine identifiée
Les étapes de progression dans `GenerateButton.tsx` sont **entièrement simulées** : un `setInterval` avance d'une étape toutes les 8 secondes, sans lien avec ce qui se passe réellement côté serveur. Après ~40s, l'indicateur atteint la dernière étape disponible (`STEPS[STEPS.length - 2]` = "Création du QR code…") et y reste figé jusqu'à la fin réelle de la génération.

### Problème secondaire critique
La route Next.js `app/api/generate/route.ts` a `maxDuration = 60`. L'appel HF Space peut prendre jusqu'à 180s (Piper + script long + cold start). Si Next.js coupe à 60s, l'enseignant voit une erreur alors que l'audio est potentiellement généré et uploadé côté HF Space — sans aucun moyen de le récupérer.

---

## 2. Section 1 — Fluidité

### Fichiers concernés
- `components/GenerateButton.tsx`
- `app/api/generate/route.ts`
- `app/api/generate-gemini/route.ts`

### Changements GenerateButton

Supprimer le fake-progress (STEPS + stepInterval). Remplacer par :

**Phase 0–59s** : message fixe  
> "Génération en cours — 30s à 2 min selon la longueur du script"

**Phase 60–149s** : message d'attente  
> "Plus lent que prévu — le serveur continue, ne fermez pas la page."

**Phase ≥150s** : message d'alerte  
> "Génération longue détectée. Si aucun résultat dans 30 secondes, rechargez et réessayez."

Le chrono (secondes écoulées) reste affiché dans tous les cas.  
Le message de succès final ("Terminé ✓") reste déclenché par la vraie fin de l'appel.

### Changements timeout

Dans les deux routes API Next.js :
```ts
export const maxDuration = 300  // Vercel Pro max — était 60
```

Note : 300s est le plafond Vercel Pro. Au-delà il faudrait Enterprise. Les scripts Gemini très longs (>25 répliques) peuvent prendre 2–4 min ; 300s couvre tous les cas normaux.

---

## 3. Section 2 — Sécurité

### 3.1 CORS permissif sur HF Space (`app.py`)

**Risque :** `allow_origins=["*"]` expose tous les endpoints à n'importe quelle origine.  
**Mitigant existant :** `X-PLAI-Secret` sur les endpoints sensibles — mais `/health` et `/voices` sont accessibles sans secret.  
**Fix :** Restreindre les origines CORS à l'URL Vercel de production + localhost dev. Ajouter `check_secret` sur `/voices`.

```python
allow_origins=[
    "https://dialogue-audio.vercel.app",   # à adapter selon le vrai domaine
    "http://localhost:3000",
]
```

### 3.2 SUPABASE_SERVICE_KEY côté Next.js

**Risque :** La service key bypass toute RLS Supabase. Utilisée actuellement uniquement pour l'insertion dans `dialogues`. Si elle fuite (logs verbose, erreur Next.js non catchée), accès total en lecture/écriture à toute la base.  
**Fix :** Deux options, dans l'ordre de préférence :
- Remplacer par la clé `anon` + politique RLS INSERT seule sur `dialogues` (recommandé)
- Sinon : s'assurer que la service key n'apparaît jamais dans les logs, et que la table `dialogues` a une RLS INSERT basée sur `user_id`

### 3.3 Absence de validation de taille du script côté API

**Risque :** Un script de plusieurs milliers de lignes peut être soumis tel quel — surcharge HF Space, coût tokens IA, timeout garanti.  
**Fix :** Ajouter dans les routes `/api/generate` et `/api/generate-gemini` une validation :
```ts
const lines = body.script.split('\n').filter((l: string) => /^[A-D]:/.test(l))
if (lines.length > 80) {
  return NextResponse.json({ error: 'Script trop long (max 80 répliques)' }, { status: 400 })
}
```
Le frontend limite déjà à 60 répliques via le slider — cette validation côté serveur est une défense en profondeur.

---

## 4. Section 3 — Gestion d'erreurs

### 4.1 Upload Internet Archive silencieux

**Problème :** Si les 5 tentatives d'upload échouent, l'enseignant ne le sait jamais. Le QR code pointe vers une URL morte, sans aucune indication.  
**Fix en deux étapes :**

1. Dans `app/api/generate/route.ts` et `generate-gemini/route.ts` : ajouter un champ `upload_status: 'pending'` dans la réponse initiale.
2. Dans `AudioResult.tsx` : si `generated_at` est présent et que plus de 20 minutes se sont écoulées et que le lien IA ne fonctionne toujours pas → afficher :
   > "Le partage via QR code a échoué (Internet Archive indisponible). L'audio reste téléchargeable ci-dessus."

Note : vérifier si le lien fonctionne peut se faire avec un HEAD request depuis une API route `/api/check-url`.

### 4.2 Timeout Next.js avec audio possiblement généré côté HF

**Problème actuel :** Si Next.js coupe à 60s, l'enseignant voit une erreur mais l'audio peut exister sur IA.  
**Fix immédiat :** `maxDuration = 300` (section 1) réduit très fortement ce risque.  
**Fix structurel (V2) :** Pattern job-ID — hors scope de ce patch mais recommandé si les scripts podcast (>25 répliques Gemini) deviennent courants.

---

## 5. Section 4 — Opportunités UX

### 5.1 Estimation de durée avant génération

Le frontend connaît le nombre de répliques (depuis le script parsé) et le moteur TTS sélectionné. Afficher une estimation avant le clic :

| Moteur | Estimation |
|--------|-----------|
| Edge TTS | ~15–30s |
| Piper | ~30–90s (+ téléchargement modèle si nouvelle voix) |
| Gemini ≤25 répliques | ~30–60s |
| Gemini >25 répliques | ~2–4 min |

Implémentation : fonction `estimateDuration(engine, replicaCount): string` dans un helper, affichée sous le bouton avant le clic.

### 5.2 Téléchargement MP3 immédiat depuis audio_data

**Situation actuelle :** Le bouton "Télécharger MP3" pointe vers `/api/download?url=...` qui re-fetch l'URL Internet Archive — qui peut ne pas être encore active.  
**Or :** `audio_data` (base64) est déjà dans la réponse. Le téléchargement local peut se faire immédiatement sans passer par IA.  
**Fix :** Dans `AudioResult.tsx`, si `audio_data` est présent, déclencher le téléchargement depuis le base64 directement (comme `downloadQR` le fait déjà pour le PNG).

```ts
const downloadMp3 = () => {
  const link = document.createElement('a')
  link.href = `data:audio/mpeg;base64,${result.audio_data}`
  link.download = 'dialogue.mp3'
  link.click()
}
```

### 5.3 Countdown dynamique sur le QR code

**Situation actuelle :** Message statique "actif dans ~10 min".  
**Fix :** Calculer le temps restant depuis `result.generated_at` et afficher un countdown qui se met à jour toutes les 30s :  
> "QR actif dans ~8 min" → "QR actif dans ~3 min" → "QR actif ✓"

Implémentation : hook `useQrCountdown(generatedAt)` retournant le label à afficher.

---

## 6. Résumé des fichiers à modifier

| Fichier | Changement |
|---------|-----------|
| `components/GenerateButton.tsx` | Remplacer fake-progress par messages temporels honnêtes |
| `app/api/generate/route.ts` | `maxDuration = 300` + validation taille script |
| `app/api/generate-gemini/route.ts` | `maxDuration = 300` + validation taille script |
| `components/AudioResult.tsx` | Téléchargement MP3 depuis base64 + countdown QR + message upload échoué |
| `hf-space/app.py` | CORS restreint + `check_secret` sur `/voices` |

---

## 7. Ce qui n'est PAS dans ce patch

- SSE / streaming de progression réelle (V2 si nécessaire)
- Pattern job-ID pour scripts très longs (V2)
- Remplacement de SUPABASE_SERVICE_KEY par anon key (nécessite audit RLS séparé)
