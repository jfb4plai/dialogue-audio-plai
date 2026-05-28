import { GeminiVoice } from '@/types/dialogue'

/**
 * Voix Edge TTS disponibles par locale pour les dialogues à 3-4 locuteurs.
 * Edge TTS est gratuit et illimité — prioritaire sur ElevenLabs quand assez de voix.
 * Miroir exact de EDGE_MULTI_VOICES dans hf-space/app.py.
 *
 * Règle de routage :
 *   len(voix[locale]) >= nb_locuteurs → Edge TTS
 *   sinon → ElevenLabs (seul cas : nl_NL à 4 locuteurs)
 */
export const EDGE_MULTI_VOICES: Record<string, GeminiVoice[]> = {
  nl_BE: [
    { id: 'nl-BE-DenaNeural',    label: 'Dena',         gender: 'féminin',  character: '' },
    { id: 'nl-BE-ArnaudNeural',  label: 'Arnaud',       gender: 'masculin', character: '' },
    { id: 'nl-NL-ColetteNeural', label: 'Colette (NL)', gender: 'féminin',  character: '' },
    { id: 'nl-NL-FennaNeural',   label: 'Fenna (NL)',   gender: 'féminin',  character: '' },
    { id: 'nl-NL-MaartenNeural', label: 'Maarten (NL)', gender: 'masculin', character: '' },
  ],
  nl_NL: [
    { id: 'nl-NL-ColetteNeural', label: 'Colette', gender: 'féminin',  character: '' },
    { id: 'nl-NL-FennaNeural',   label: 'Fenna',   gender: 'féminin',  character: '' },
    { id: 'nl-NL-MaartenNeural', label: 'Maarten', gender: 'masculin', character: '' },
  ],
  fr_FR: [
    { id: 'fr-FR-DeniseNeural', label: 'Denise', gender: 'féminin',  character: '' },
    { id: 'fr-FR-EloiseNeural', label: 'Eloise', gender: 'féminin',  character: '' },
    { id: 'fr-FR-HenriNeural',  label: 'Henri',  gender: 'masculin', character: '' },
    { id: 'fr-FR-JeromeNeural', label: 'Jérome', gender: 'masculin', character: '' },
  ],
  fr_BE: [
    { id: 'fr-BE-CharlineNeural', label: 'Charline',    gender: 'féminin',  character: '' },
    { id: 'fr-BE-GerardNeural',   label: 'Gérard',      gender: 'masculin', character: '' },
    { id: 'fr-FR-DeniseNeural',   label: 'Denise (FR)', gender: 'féminin',  character: '' },
    { id: 'fr-FR-HenriNeural',    label: 'Henri (FR)',  gender: 'masculin', character: '' },
  ],
  de_DE: [
    { id: 'de-DE-KatjaNeural',  label: 'Katja',  gender: 'féminin',  character: '' },
    { id: 'de-DE-AmalaNeural',  label: 'Amala',  gender: 'féminin',  character: '' },
    { id: 'de-DE-ConradNeural', label: 'Conrad', gender: 'masculin', character: '' },
    { id: 'de-DE-BerndNeural',  label: 'Bernd',  gender: 'masculin', character: '' },
  ],
  en_GB: [
    { id: 'en-GB-SoniaNeural',  label: 'Sonia',  gender: 'féminin',  character: '' },
    { id: 'en-GB-LibbyNeural',  label: 'Libby',  gender: 'féminin',  character: '' },
    { id: 'en-GB-RyanNeural',   label: 'Ryan',   gender: 'masculin', character: '' },
    { id: 'en-GB-OliverNeural', label: 'Oliver', gender: 'masculin', character: '' },
  ],
  es_ES: [
    { id: 'es-ES-ElviraNeural', label: 'Elvira', gender: 'féminin',  character: '' },
    { id: 'es-ES-AbrilNeural',  label: 'Abril',  gender: 'féminin',  character: '' },
    { id: 'es-ES-AlvaroNeural', label: 'Álvaro', gender: 'masculin', character: '' },
    { id: 'es-ES-ArnauNeural',  label: 'Arnau',  gender: 'masculin', character: '' },
  ],
  it_IT: [
    { id: 'it-IT-ElsaNeural',     label: 'Elsa',     gender: 'féminin',  character: '' },
    { id: 'it-IT-IsabellaNeural', label: 'Isabella', gender: 'féminin',  character: '' },
    { id: 'it-IT-DiegoNeural',    label: 'Diego',    gender: 'masculin', character: '' },
    { id: 'it-IT-BenignoNeural',  label: 'Benigno',  gender: 'masculin', character: '' },
  ],
}

/**
 * Retourne les voix Edge TTS si la locale dispose d'assez de voix pour le nombre de locuteurs.
 * null → fallback ElevenLabs.
 */
export function getEdgeMultiVoicesForLocale(locale: string, count: number): GeminiVoice[] | null {
  const voices = EDGE_MULTI_VOICES[locale]
  if (voices && voices.length >= count) return voices
  return null
}
