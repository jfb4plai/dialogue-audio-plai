import { VoicesConfig } from '@/types/dialogue'

export const SPEAKER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']

export const DEFAULT_VOICES: VoicesConfig = {
  nl_BE: {
    name: 'Flamand (Belgique)',
    voices: [
      { id: 'nl-BE-DenaNeural',    label: 'Dena',         gender: 'féminin',   engine: 'edge-tts' },
      { id: 'nl-BE-ArnaudNeural',  label: 'Arnaud',       gender: 'masculin',  engine: 'edge-tts' },
      { id: 'nl-NL-ColetteNeural', label: 'Colette (NL)', gender: 'féminin',   engine: 'edge-tts' },
      { id: 'nl-NL-FennaNeural',   label: 'Fenna (NL)',   gender: 'féminin',   engine: 'edge-tts' },
      { id: 'nl-NL-MaartenNeural', label: 'Maarten (NL)', gender: 'masculin',  engine: 'edge-tts' },
    ],
  },
  nl_NL: {
    name: 'Néerlandais (Pays-Bas)',
    voices: [
      { id: 'nl-NL-ColetteNeural', label: 'Colette', gender: 'féminin',  engine: 'edge-tts' },
      { id: 'nl-NL-FennaNeural',   label: 'Fenna',   gender: 'féminin',  engine: 'edge-tts' },
      { id: 'nl-NL-MaartenNeural', label: 'Maarten', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  fr_FR: {
    name: 'Français',
    voices: [
      { id: 'fr-FR-DeniseNeural', label: 'Denise', gender: 'féminin',  engine: 'edge-tts' },
      { id: 'fr-FR-EloiseNeural', label: 'Eloise', gender: 'féminin',  engine: 'edge-tts' },
      { id: 'fr-FR-HenriNeural',  label: 'Henri',  gender: 'masculin', engine: 'edge-tts' },
      { id: 'fr-FR-JeromeNeural', label: 'Jérome', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  fr_BE: {
    name: 'Français (Belgique)',
    voices: [
      { id: 'fr-BE-CharlineNeural', label: 'Charline',   gender: 'féminin',  engine: 'edge-tts' },
      { id: 'fr-BE-GerardNeural',   label: 'Gérard',     gender: 'masculin', engine: 'edge-tts' },
      { id: 'fr-FR-DeniseNeural',   label: 'Denise (FR)',gender: 'féminin',  engine: 'edge-tts' },
      { id: 'fr-FR-HenriNeural',    label: 'Henri (FR)', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  de_DE: {
    name: 'Allemand',
    voices: [
      { id: 'de-DE-KatjaNeural',  label: 'Katja',  gender: 'féminin',  engine: 'edge-tts' },
      { id: 'de-DE-AmalaNeural',  label: 'Amala',  gender: 'féminin',  engine: 'edge-tts' },
      { id: 'de-DE-ConradNeural', label: 'Conrad', gender: 'masculin', engine: 'edge-tts' },
      { id: 'de-DE-BerndNeural',  label: 'Bernd',  gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  en_GB: {
    name: 'Anglais (UK)',
    voices: [
      { id: 'en-GB-SoniaNeural',  label: 'Sonia',  gender: 'féminin',  engine: 'edge-tts' },
      { id: 'en-GB-LibbyNeural',  label: 'Libby',  gender: 'féminin',  engine: 'edge-tts' },
      { id: 'en-GB-RyanNeural',   label: 'Ryan',   gender: 'masculin', engine: 'edge-tts' },
      { id: 'en-GB-OliverNeural', label: 'Oliver', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  es_ES: {
    name: 'Espagnol',
    voices: [
      { id: 'es-ES-ElviraNeural', label: 'Elvira', gender: 'féminin',  engine: 'edge-tts' },
      { id: 'es-ES-AbrilNeural',  label: 'Abril',  gender: 'féminin',  engine: 'edge-tts' },
      { id: 'es-ES-AlvaroNeural', label: 'Álvaro', gender: 'masculin', engine: 'edge-tts' },
      { id: 'es-ES-ArnauNeural',  label: 'Arnau',  gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  it_IT: {
    name: 'Italien',
    voices: [
      { id: 'it-IT-ElsaNeural',      label: 'Elsa',      gender: 'féminin',  engine: 'edge-tts' },
      { id: 'it-IT-IsabellaNeural',  label: 'Isabella',  gender: 'féminin',  engine: 'edge-tts' },
      { id: 'it-IT-DiegoNeural',     label: 'Diego',     gender: 'masculin', engine: 'edge-tts' },
      { id: 'it-IT-BenignoNeural',   label: 'Benigno',   gender: 'masculin', engine: 'edge-tts' },
    ],
  },
}
