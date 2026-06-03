#!/usr/bin/env python3
"""
Test des voix Gemini TTS — génère un MP3 par voix pour comparaison auditive.

Usage:
  1. pip install google-genai pydub
  2. set GOOGLE_API_KEY=ta_clé   (ou entre-la manuellement au lancement)
  3. python test-voices.py
  4. Écoute les fichiers dans voice-samples/

Durée : ~5 min (7s entre chaque appel pour rester sous le quota 10 req/min)
"""

import os
import sys
import time
from pathlib import Path
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Package manquant — installez : pip install google-genai")
    sys.exit(1)

import wave
import struct


# ── Clé API ─────────────────────────────────────────────────────────────────

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "").strip()
if not GOOGLE_API_KEY:
    GOOGLE_API_KEY = input("GOOGLE_API_KEY : ").strip()
if not GOOGLE_API_KEY:
    print("Clé API requise.")
    sys.exit(1)


# ── Voix à tester ────────────────────────────────────────────────────────────
# Les 8 voix actuellement dans l'app + ~22 candidates supplémentaires

VOICES = [
    # --- Déjà dans l'app ---
    "Aoede", "Kore", "Zephyr", "Leda",          # féminin
    "Puck", "Charon", "Fenrir", "Orus",          # masculin
    # --- Candidates supplémentaires ---
    "Schedar", "Sulafat", "Algieba", "Despina",
    "Erinome", "Laomedeia", "Pulcherrima",
    "Umbriel", "Vindemiatrix", "Moana",
    "Callirrhoe", "Auva", "Achernar",
    "Iapetus", "Rasalgethi", "Sadachbia",
    "Sadaltager", "Achird", "Algenib",
    "Alnilam", "Gacrux", "Capella",
]

# Phrase test — révèle le timbre, le rythme et la couleur émotionnelle
TEST_SENTENCE = (
    "Bonjour, bienvenue dans notre boulangerie. "
    "Nous avons du pain frais ce matin — voulez-vous goûter notre spécialité du jour ?"
)

DELAY_BETWEEN_CALLS = 7   # secondes — 8.5 req/min, sous la limite de 10 RPM
OUTPUT_DIR = Path("voice-samples")
OUTPUT_DIR.mkdir(exist_ok=True)

client = genai.Client(api_key=GOOGLE_API_KEY)

# ── Boucle de test ───────────────────────────────────────────────────────────

results: list[tuple] = []
total = len(VOICES)

print(f"\nTest de {total} voix Gemini TTS")
print(f"Fichiers MP3 → {OUTPUT_DIR.absolute()}\n")

for idx, voice_name in enumerate(VOICES):
    label = f"[{idx+1:02d}/{total}]"
    print(f"{label} {voice_name:<20}", end=" ", flush=True)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=TEST_SENTENCE,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=voice_name
                        )
                    )
                )
            )
        )

        # Collecte les bytes audio
        audio_data = b""
        mime_type  = ""
        for part in response.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
                audio_data += part.inline_data.data
                if not mime_type and part.inline_data.mime_type:
                    mime_type = part.inline_data.mime_type.lower()

        if not audio_data:
            print("❌  pas de données audio")
            results.append((voice_name, "no_audio"))
        else:
            # Sauvegarde selon le format retourné par l'API
            if "mp3" in mime_type or "mpeg" in mime_type:
                out_path = OUTPUT_DIR / f"{idx+1:02d}_{voice_name}.mp3"
                out_path.write_bytes(audio_data)
                ext = "mp3"
            elif "wav" in mime_type:
                out_path = OUTPUT_DIR / f"{idx+1:02d}_{voice_name}.wav"
                out_path.write_bytes(audio_data)
                ext = "wav"
            else:
                # PCM brut (L16 mono 24kHz) → WAV via module wave natif Python
                rate = 24000
                if "rate=" in mime_type:
                    try:
                        rate = int(mime_type.split("rate=")[1].split(";")[0].split(",")[0])
                    except Exception:
                        pass
                out_path = OUTPUT_DIR / f"{idx+1:02d}_{voice_name}.wav"
                with wave.open(str(out_path), "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)   # 16-bit
                    wf.setframerate(rate)
                    wf.writeframes(audio_data)
                ext = "wav"

            # Durée approximative depuis la taille (PCM: 2 bytes/sample, 24kHz)
            n_samples = len(audio_data) // 2
            duration_s = n_samples / 24000 if ext == "wav" else len(audio_data) / 16000
            print(f"✓  ~{duration_s:.1f}s  →  {out_path.name}")
            results.append((voice_name, "ok", str(out_path)))

    except Exception as exc:
        err = str(exc)
        if any(k in err for k in ("not found", "invalid", "INVALID", "NOT_FOUND")):
            print("⚠   voix inexistante dans cette version du modèle")
            results.append((voice_name, "not_found"))
        elif "429" in err or "RESOURCE_EXHAUSTED" in err:
            print("⏳  quota atteint — attente 25s puis retry...")
            time.sleep(25)
            results.append((voice_name, "quota"))
        else:
            short = err[:100].replace("\n", " ")
            print(f"❌  {short}")
            results.append((voice_name, "error", short))

    if idx < total - 1:
        time.sleep(DELAY_BETWEEN_CALLS)


# ── Résumé ───────────────────────────────────────────────────────────────────

ok      = [r for r in results if r[1] == "ok"]
invalid = [r for r in results if r[1] == "not_found"]
errors  = [r for r in results if r[1] not in ("ok", "not_found")]

print("\n" + "=" * 55)
print(f"  ✓  {len(ok):2d} voix disponibles")
print(f"  ⚠   {len(invalid):2d} voix inexistantes")
print(f"  ❌  {len(errors):2d} erreurs")
print("=" * 55)
print(f"\nFichiers dans : {OUTPUT_DIR.absolute()}")
print("\nVoix disponibles :")
for r in ok:
    print(f"  {Path(r[2]).name}")
