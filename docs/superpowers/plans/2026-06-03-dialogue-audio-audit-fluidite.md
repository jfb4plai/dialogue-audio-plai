# Dialogue Audio — Audit fluidité, sécurité, erreurs et opportunités

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger le faux indicateur de progression, le timeout Next.js trop court, deux failles de sécurité et trois opportunités UX dans l'application Dialogue Audio.

**Architecture:** Le frontend Next.js (Vercel) proxie les requêtes TTS vers un backend FastAPI sur HuggingFace Spaces. L'audio généré est uploadé en arrière-plan sur Internet Archive ; le QR code est pré-calculé côté HF Space et renvoyé dans la réponse JSON avec l'audio en base64.

**Tech Stack:** Next.js 14 App Router, TypeScript, React 18, Tailwind CSS v3, FastAPI (Python), pydantic, edge-tts, piper, Google Gemini TTS, Internet Archive SDK.

---

## Fichiers modifiés

| Fichier | Rôle |
|---------|------|
| `components/GenerateButton.tsx` | Remplacer fake-progress par messages temporels honnêtes |
| `app/api/generate/route.ts` | maxDuration 60→300 + validation taille script |
| `app/api/generate-gemini/route.ts` | Validation taille script (maxDuration déjà 300) |
| `types/dialogue.ts` | Ajouter champ `upload_status` à `GenerateResult` |
| `components/AudioResult.tsx` | MP3 depuis base64 + countdown QR + message upload échoué |
| `hf-space/app.py` | CORS restreint + check_secret sur /voices |

---

## Task 1 : Fix GenerateButton — supprimer le fake-progress

**Fichiers :**
- Modifier : `components/GenerateButton.tsx`

Le composant actuel avance mécaniquement d'une étape toutes les 8s et se bloque sur "Création du QR code…" une fois la dernière étape atteinte. On remplace ça par trois messages basés sur le temps réel écoulé.

- [ ] **Lire le fichier actuel**

```bash
cat components/GenerateButton.tsx
```

- [ ] **Remplacer le contenu complet de `components/GenerateButton.tsx`**

```tsx
'use client'
import { useState } from 'react'

interface Props {
  onGenerate: () => Promise<void>
  disabled: boolean
}

function getProgressMessage(elapsed: number): string {
  if (elapsed < 60) return 'Génération en cours — 30s à 2 min selon la longueur du script'
  if (elapsed < 150) return 'Plus lent que prévu — le serveur continue, ne fermez pas la page.'
  return 'Génération longue détectée. Si aucun résultat dans 30 secondes, rechargez et réessayez.'
}

export default function GenerateButton({ onGenerate, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setDone(false)
    setElapsed(0)
    setErrorMsg(null)

    const timer = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    try {
      await onGenerate()
      setDone(true)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full text-white font-semibold py-3 transition-colors"
        style={{
          borderRadius: '2px',
          backgroundColor: disabled || loading ? '#5a5a5a' : '#FF3399',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Génération en cours...' : 'Générer le dialogue audio'}
      </button>

      {loading && (
        <div className="mt-3 text-sm text-jfb-gris space-y-1">
          <div className="flex items-center gap-2">
            <span className="animate-spin">⟳</span>
            <span>{getProgressMessage(elapsed)}</span>
          </div>
          <div className="text-xs text-jfb-gris-cl">{elapsed}s écoulées</div>
        </div>
      )}

      {done && (
        <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2" style={{ borderRadius: '2px' }}>
          Terminé ✓
        </div>
      )}

      {errorMsg && (() => {
        const isQuota = errorMsg.includes('journalier') || errorMsg.includes('per_model_per_day') || errorMsg.includes('PerDay')
        return (
          <div className={`mt-3 text-sm px-3 py-2 border ${isQuota ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200'}`} style={{ borderRadius: '2px' }}>
            {isQuota ? (
              <>
                <strong>Quota journalier atteint.</strong>{' '}
                {errorMsg.match(/Réessayez dans [\w]+/)?.[0] ?? 'Réessayez demain.'}{' '}
                La génération Gemini TTS est limitée à 100 appels/jour sur le plan gratuit.
              </>
            ) : errorMsg}
          </div>
        )
      })()}
    </div>
  )
}
```

- [ ] **Vérifier que le build TypeScript passe**

```bash
cd projets/dialogue-audio && npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add components/GenerateButton.tsx
git commit -m "fix: remplacer fake-progress par messages temporels honnêtes dans GenerateButton"
```

---

## Task 2 : Fix timeout + validation taille script dans generate/route.ts

**Fichiers :**
- Modifier : `app/api/generate/route.ts`

La route Piper/Edge TTS a encore `maxDuration = 60` — un script de 30 répliques peut prendre 90s. On passe à 300 (max Vercel Pro) et on ajoute une validation serveur limitant à 80 répliques.

- [ ] **Lire le fichier actuel**

```bash
cat app/api/generate/route.ts
```

- [ ] **Remplacer les deux premières lignes exportées** (maxDuration + début du POST)

Changer :
```ts
export const maxDuration = 60
```
En :
```ts
export const maxDuration = 300
```

- [ ] **Ajouter la validation de taille juste après `const body = await req.json()`**

Ajouter après `const body = await req.json()` :
```ts
  const scriptLines = (body.script as string).split('\n').filter((l: string) => /^[A-D]:/.test(l))
  if (scriptLines.length > 80) {
    return NextResponse.json({ error: 'Script trop long (max 80 répliques)' }, { status: 400 })
  }
```

- [ ] **Vérifier que le build TypeScript passe**

```bash
npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add app/api/generate/route.ts
git commit -m "fix: maxDuration 60→300 et validation taille script dans /api/generate"
```

---

## Task 3 : Validation taille script dans generate-gemini/route.ts

**Fichiers :**
- Modifier : `app/api/generate-gemini/route.ts`

`maxDuration` est déjà à 300 dans ce fichier. On ajoute seulement la validation de taille.

- [ ] **Lire le fichier actuel pour trouver la ligne `const body = await req.json()`**

```bash
cat app/api/generate-gemini/route.ts
```

- [ ] **Ajouter la validation de taille juste après `const body = await req.json()`**

Ajouter après `const body = await req.json()` :
```ts
  const scriptLines = (body.script as string).split('\n').filter((l: string) => /^[A-D]:/.test(l))
  if (scriptLines.length > 80) {
    return NextResponse.json({ error: 'Script trop long (max 80 répliques)' }, { status: 400 })
  }
```

- [ ] **Vérifier le build**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add app/api/generate-gemini/route.ts
git commit -m "fix: validation taille script dans /api/generate-gemini"
```

---

## Task 4 : AudioResult — MP3 depuis base64 + countdown QR + message upload échoué

**Fichiers :**
- Modifier : `components/AudioResult.tsx`
- Modifier : `types/dialogue.ts`

Trois améliorations dans ce fichier :
1. Téléchargement MP3 immédiat depuis `audio_data` (base64) sans passer par l'URL Internet Archive
2. Countdown dynamique "QR actif dans ~Xmin" → "QR actif ✓"
3. Message si l'upload IA a probablement échoué (audio_url présente mais plus de 20 min écoulées)

- [ ] **Ajouter `upload_status` dans `types/dialogue.ts`**

Dans `types/dialogue.ts`, modifier l'interface `GenerateResult` pour ajouter le champ optionnel :
```ts
export interface GenerateResult {
  audio_url: string
  audio_data?: string
  qr_base64: string
  duration_seconds: number
  segments: Segment[]
  generated_at?: string
  upload_status?: 'pending' | 'ok' | 'failed'  // ← ajouter cette ligne
}
```

- [ ] **Remplacer le contenu complet de `components/AudioResult.tsx`**

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { GenerateResult } from '@/types/dialogue'

interface Props { result: GenerateResult }

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => setCurrentTime(a.currentTime)
    const onMeta = () => setDuration(a.duration)
    const onEnd = () => setPlaying(false)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnd)
    }
  }, [])

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  const seek = (v: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = v
    setCurrentTime(v)
  }

  const changeSpeed = (v: number) => {
    const a = audioRef.current
    if (!a) return
    a.playbackRate = v
    setSpeed(v)
  }

  const changeVolume = (v: number) => {
    const a = audioRef.current
    if (!a) return
    a.volume = v
    setVolume(v)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-jfb-subtil border border-jfb-bordure p-4 space-y-3" style={{ borderRadius: '2px' }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-2 text-xs text-jfb-gris">
        <span className="w-8 text-right">{fmt(currentTime)}</span>
        <input
          type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="flex-1 accent-jfb-rose"
        />
        <span className="w-8">{fmt(duration)}</span>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-jfb-noir text-white flex items-center justify-center hover:bg-jfb-noir-doux text-lg flex-shrink-0"
          style={{ borderRadius: '2px' }}
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-40">
          <span className="text-xs text-jfb-gris w-16 flex-shrink-0">Vitesse {speed.toFixed(1)}×</span>
          <input
            type="range" min={0.5} max={2} step={0.1} value={speed}
            onChange={e => changeSpeed(Number(e.target.value))}
            className="flex-1 accent-jfb-rose"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-36">
          <span className="text-xs text-jfb-gris w-14 flex-shrink-0">
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'} {Math.round(volume * 100)}%
          </span>
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => changeVolume(Number(e.target.value))}
            className="flex-1 accent-jfb-rose"
          />
        </div>
        <div className="flex gap-1">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-2 py-0.5 text-xs font-medium ${
                speed === s ? 'bg-jfb-noir text-white' : 'bg-jfb-subtil text-jfb-gris hover:bg-jfb-beige border border-jfb-bordure'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Retourne le label du countdown QR basé sur generated_at (ISO string).
 *  Délai Internet Archive = 10 min. Met à jour toutes les 30s. */
function useQrCountdown(generatedAt: string | undefined): string {
  const IA_DELAY_MS = 10 * 60 * 1000
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!generatedAt) return
    const update = () => {
      const elapsed = Date.now() - new Date(generatedAt).getTime()
      const remaining = IA_DELAY_MS - elapsed
      if (remaining <= 0) {
        setLabel('QR actif ✓')
        return
      }
      const mins = Math.ceil(remaining / 60000)
      setLabel(`QR actif dans ~${mins} min`)
    }
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [generatedAt])

  return label
}

export default function AudioResult({ result }: Props) {
  const qrLabel = useQrCountdown(result.generated_at)

  const downloadQR = () => {
    if (!result.qr_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${result.qr_base64}`
    link.download = 'dialogue-qr.png'
    link.click()
  }

  const downloadMp3 = () => {
    const link = document.createElement('a')
    if (result.audio_data) {
      // Téléchargement immédiat depuis base64 — pas besoin d'attendre Internet Archive
      link.href = `data:audio/mpeg;base64,${result.audio_data}`
    } else {
      link.href = `/api/download?url=${encodeURIComponent(result.audio_url)}`
    }
    link.download = 'dialogue.mp3'
    link.click()
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(result.audio_url)
    alert('Lien copié !')
  }

  const audioSrc = result.audio_data
    ? `data:audio/mpeg;base64,${result.audio_data}`
    : result.audio_url

  // Détection upload IA probablement échoué : audio_url présente, generated_at > 20 min, pas de audio_data
  const TWENTY_MINUTES = 20 * 60 * 1000
  const uploadLikelyFailed = result.audio_url
    && !result.audio_data
    && result.generated_at
    && (Date.now() - new Date(result.generated_at).getTime()) > TWENTY_MINUTES

  // Après F5, audio_data est absent — Internet Archive met ~10 min à activer l'URL
  const TEN_MINUTES = 10 * 60 * 1000
  const isRecentWithoutData = !result.audio_data && result.generated_at
    && (Date.now() - new Date(result.generated_at).getTime()) < TEN_MINUTES

  return (
    <div className="bg-white border border-jfb-bordure p-6 mt-6" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
      <h2 className="text-lg font-semibold text-jfb-noir mb-4">
        Audio généré — {result.duration_seconds != null ? (() => {
          const s = Math.round(result.duration_seconds as number)
          return s >= 60 ? `${Math.floor(s/60)} min ${s%60} s` : `${s} s`
        })() : '—'}
      </h2>

      <AudioPlayer src={audioSrc} />

      {isRecentWithoutData && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2" style={{ borderRadius: '2px' }}>
          La page a été rechargée peu après la génération. L&apos;audio et le QR code deviennent actifs ~10 minutes après la génération (délai Internet Archive). Revenez dans quelques minutes et rechargez.
        </div>
      )}

      {uploadLikelyFailed && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2" style={{ borderRadius: '2px' }}>
          Le partage via QR code a échoué (Internet Archive indisponible). L&apos;audio reste téléchargeable via le bouton ci-dessous.
        </div>
      )}

      {/* QR code */}
      <div className="flex flex-col items-center mb-4 mt-4">
        {result.qr_base64 ? (
          <>
            <img
              src={`data:image/png;base64,${result.qr_base64}`}
              alt="QR code audio"
              className="w-48 h-48 border border-jfb-bordure" style={{ borderRadius: '2px' }}
            />
            {qrLabel && (
              <p className={`text-xs mt-1 font-medium ${qrLabel.includes('✓') ? 'text-green-700' : 'text-amber-600'}`}>
                {qrLabel}
              </p>
            )}
          </>
        ) : (
          <div className="w-48 h-48 border border-jfb-bordure flex items-center justify-center bg-jfb-subtil" style={{ borderRadius: '2px' }}>
            <span className="text-xs text-jfb-gris text-center px-4">
              {result.audio_url
                ? 'QR code en cours de génération…'
                : 'QR code indisponible — l\'upload Internet Archive a échoué. L\'audio est accessible localement via le lecteur ci-dessus.'}
            </span>
          </div>
        )}
        <p className="text-xs text-jfb-gris mt-2 text-center">
          Vos élèves scannent ce code avec l&apos;appareil photo de leur téléphone pour écouter l&apos;audio directement — sans application, sans compte.
        </p>
      </div>

      {/* Segments */}
      <div className="mb-4 text-sm text-jfb-gris">
        <p className="font-medium mb-1 text-jfb-noir">Répliques :</p>
        <ul className="space-y-0.5">
          {result.segments.map(s => {
            const voiceLabel = s.voice.includes('-')
              ? s.voice.split('-').slice(2).join('-').replace('Neural', '') || s.voice
              : s.voice
            return (
              <li key={s.index}>
                <span className="font-semibold">{s.speaker}</span> ({voiceLabel}) — {s.duration}s
              </li>
            )
          })}
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={downloadMp3}
          className="px-4 py-2 bg-jfb-noir text-white text-sm font-medium hover:bg-jfb-noir-doux" style={{ borderRadius: '2px' }}
        >
          Télécharger MP3
        </button>
        <button onClick={downloadQR}
          disabled={!result.qr_base64}
          className="px-4 py-2 bg-jfb-subtil text-jfb-gris border border-jfb-bordure text-sm font-medium hover:bg-jfb-beige disabled:opacity-50 disabled:cursor-not-allowed" style={{ borderRadius: '2px' }}>
          Télécharger QR PNG
        </button>
        <button onClick={copyLink}
          disabled={!result.audio_url}
          title={!result.audio_url ? 'Lien indisponible' : undefined}
          className="px-4 py-2 bg-jfb-subtil text-jfb-gris border border-jfb-bordure text-sm font-medium hover:bg-jfb-beige disabled:opacity-50 disabled:cursor-not-allowed" style={{ borderRadius: '2px' }}>
          Copier le lien
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Vérifier le build TypeScript**

```bash
npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add types/dialogue.ts components/AudioResult.tsx
git commit -m "feat: téléchargement MP3 immédiat, countdown QR dynamique, message upload échoué"
```

---

## Task 5 : Estimation de durée avant génération

**Fichiers :**
- Modifier : `components/GenerateButton.tsx`

Afficher sous le bouton (avant le clic) une estimation basée sur le moteur et le nombre de répliques. Le frontend reçoit ces infos via les props.

- [ ] **Modifier l'interface Props dans `components/GenerateButton.tsx`**

Ajouter deux props optionnelles :
```tsx
interface Props {
  onGenerate: () => Promise<void>
  disabled: boolean
  engine?: string          // 'piper' | 'edge-tts' | 'gemini' | 'azure'
  replicaCount?: number    // nombre de répliques dans le script
}
```

- [ ] **Ajouter la fonction d'estimation et l'affichage dans `GenerateButton`**

Ajouter après la définition de `getProgressMessage` :
```tsx
function getEstimate(engine: string | undefined, count: number | undefined): string {
  if (!count) return ''
  if (engine === 'edge-tts' || engine === 'azure') return '~15–30s'
  if (engine === 'gemini') return count > 25 ? '~2–4 min' : '~30–60s'
  // piper par défaut
  return '~30–90s'
}
```

Dans le JSX du composant, ajouter sous le bouton (avant le bloc `{loading && ...}`) :
```tsx
{!loading && !done && (engine || replicaCount) && (
  <p className="mt-2 text-xs text-jfb-gris-cl">
    Durée estimée : {getEstimate(engine, replicaCount)}
  </p>
)}
```

- [ ] **Vérifier le build TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add components/GenerateButton.tsx
git commit -m "feat: estimation de durée avant génération dans GenerateButton"
```

---

## Task 6 : Fix sécurité HF Space — CORS restreint + check_secret sur /voices

**Fichiers :**
- Modifier : `hf-space/app.py`

**Avant de commencer :** identifier le domaine Vercel de production de l'app. Vérifier dans les settings Vercel ou dans le fichier `.env.local` la variable `NEXT_PUBLIC_APP_URL` ou le domaine configuré. Typiquement `dialogue-audio.jfb4plai.com`.

- [ ] **Identifier le domaine de production**

```bash
# Chercher le domaine dans les fichiers de config
grep -r "jfb4plai\|vercel\.app" .env* next.config.js 2>/dev/null | head -10
```

Note le domaine trouvé — il sera utilisé à l'étape suivante.

- [ ] **Dans `hf-space/app.py`, remplacer le middleware CORS**

Changer :
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Par (remplacer `https://dialogue-audio.jfb4plai.com` par le vrai domaine trouvé à l'étape précédente) :
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dialogue-audio.jfb4plai.com",  # domaine Vercel production
        "http://localhost:3000",                  # dev local
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-PLAI-Secret"],
)
```

- [ ] **Ajouter `check_secret` sur l'endpoint `/voices`**

Changer :
```python
@app.get("/voices")
def get_voices(request: Request):
    check_secret(request)
    return VOICES_CONFIG
```

C'est déjà là — vérifier que `check_secret` est bien appelé. Si absent, l'ajouter.

- [ ] **Vérifier que `/health` reste sans authentification** (utilisé par Vercel pour health checks)

L'endpoint `/health` doit rester tel quel :
```python
@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": loaded_models}
```

- [ ] **Tester localement si possible**

```bash
# Si tu as Python + les dépendances en local :
cd hf-space
python -m uvicorn app:app --port 8000 &
curl -s http://localhost:8000/health
# Attendu : {"status":"ok","models_loaded":[]}
curl -s http://localhost:8000/voices
# Attendu : 403 Forbidden (si HF_SPACE_SECRET est défini) ou liste des voix (si vide)
```

- [ ] **Commit**

```bash
git add hf-space/app.py
git commit -m "fix: CORS restreint et check_secret sur /voices dans HF Space"
```

---

## Task 7 : Déploiement et vérification

- [ ] **Pousser sur main pour déclencher le déploiement Vercel**

```bash
git push origin main
```

- [ ] **Vérifier le déploiement Vercel**

Dans le dashboard Vercel, s'assurer que le build passe sans erreur TypeScript.

- [ ] **Redéployer le HF Space**

Pousser les changements de `hf-space/app.py` vers le Space HuggingFace (via git ou l'interface HF).

- [ ] **Test fonctionnel — génération courte (<60s)**

1. Ouvrir l'app en production
2. Créer un dialogue 6 répliques, Edge TTS
3. Cliquer "Générer le dialogue audio"
4. Vérifier : le message affiché est "Génération en cours — 30s à 2 min selon la longueur du script" (pas "Création du QR code…")
5. Vérifier : le résultat s'affiche avec le bouton "Télécharger MP3" actif immédiatement
6. Vérifier : le countdown QR s'affiche ("QR actif dans ~10 min")

- [ ] **Test fonctionnel — téléchargement MP3 immédiat**

1. Après une génération réussie, cliquer "Télécharger MP3"
2. Vérifier que le téléchargement démarre immédiatement (pas d'attente IA)
3. Vérifier que le fichier MP3 est valide et lisible

- [ ] **Test du countdown QR**

1. Récupérer un résultat généré il y a 5 minutes (via l'historique si disponible)
2. Vérifier que le label affiche "QR actif dans ~5 min" (approximatif selon le timing)
3. Attendre 10+ minutes : vérifier que le label passe à "QR actif ✓"
