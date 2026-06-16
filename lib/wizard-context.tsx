'use client'
import { createContext, useContext, useReducer, useEffect, useCallback, useState, ReactNode } from 'react'
import { Speaker, GeminiSpeakerProfile, GeminiVoice, ElevenLabsVoice, GenerateResult, VoicesConfig } from '@/types/dialogue'
import { DEFAULT_VOICES, SPEAKER_COLORS } from '@/lib/voices'

export type WizardMode = 'dialogue' | 'podcast' | null

export interface WizardState {
  mode: WizardMode
  locale: string
  engine: 'edge-tts' | 'gemini'
  speakers: Speaker[]
  geminiProfiles: GeminiSpeakerProfile[]
  geminiVoices: GeminiVoice[]
  elevenlabsVoices: ElevenLabsVoice[]
  ambient: string
  ambientIntensity: number
  silenceMs: number
  script: string
  result: GenerateResult | null
  voices: VoicesConfig
  niveau: string
  vocabulaire: string
  classe: string
}

type Action =
  | { type: 'SET_MODE';              payload: WizardMode }
  | { type: 'SET_LOCALE';            payload: string }
  | { type: 'SET_ENGINE';            payload: 'edge-tts' | 'gemini' }
  | { type: 'SET_SPEAKERS';          payload: Speaker[] }
  | { type: 'SET_GEMINI_PROFILES';   payload: GeminiSpeakerProfile[] }
  | { type: 'SET_GEMINI_VOICES';       payload: GeminiVoice[] }
  | { type: 'SET_ELEVENLABS_VOICES';   payload: ElevenLabsVoice[] }
  | { type: 'SET_AMBIENT';             payload: string }
  | { type: 'SET_AMBIENT_INTENSITY'; payload: number }
  | { type: 'SET_SILENCE_MS';        payload: number }
  | { type: 'SET_SCRIPT';            payload: string }
  | { type: 'SET_RESULT';            payload: GenerateResult | null }
  | { type: 'SET_VOICES';            payload: VoicesConfig }
  | { type: 'SET_NIVEAU';            payload: string }
  | { type: 'SET_VOCABULAIRE';       payload: string }
  | { type: 'SET_CLASSE';            payload: string }
  | { type: 'RESET' }

const initialState: WizardState = {
  mode: null,
  locale: 'nl_BE',
  engine: 'gemini',
  speakers: [
    { label: 'A', voice: 'nl-BE-DenaNeural',   color: SPEAKER_COLORS[0] },
    { label: 'B', voice: 'nl-BE-ArnaudNeural',  color: SPEAKER_COLORS[1] },
  ],
  geminiProfiles: [],
  geminiVoices: [],
  elevenlabsVoices: [],
  ambient: '',
  ambientIntensity: 0,
  silenceMs: 500,
  script: '',
  result: null,
  voices: DEFAULT_VOICES,
  niveau: '',
  vocabulaire: '',
  classe: '',
}

const SESSION_KEY = 'da_wizard_state'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24h

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_MODE':              return { ...state, mode: action.payload }
    case 'SET_LOCALE':            return { ...state, locale: action.payload }
    case 'SET_ENGINE':            return { ...state, engine: action.payload }
    case 'SET_SPEAKERS':          return { ...state, speakers: action.payload }
    case 'SET_GEMINI_PROFILES':   return { ...state, geminiProfiles: action.payload }
    case 'SET_GEMINI_VOICES':       return { ...state, geminiVoices: action.payload }
    case 'SET_ELEVENLABS_VOICES':   return { ...state, elevenlabsVoices: action.payload }
    case 'SET_AMBIENT':           return { ...state, ambient: action.payload }
    case 'SET_AMBIENT_INTENSITY': return { ...state, ambientIntensity: action.payload }
    case 'SET_SILENCE_MS':        return { ...state, silenceMs: action.payload }
    case 'SET_SCRIPT':            return { ...state, script: action.payload }
    case 'SET_RESULT':            return { ...state, result: action.payload }
    case 'SET_VOICES':            return { ...state, voices: action.payload }
    case 'SET_NIVEAU':            return { ...state, niveau: action.payload }
    case 'SET_VOCABULAIRE':       return { ...state, vocabulaire: action.payload }
    case 'SET_CLASSE':            return { ...state, classe: action.payload }
    case 'RESET':                 return { ...initialState, voices: state.voices, geminiVoices: state.geminiVoices, elevenlabsVoices: state.elevenlabsVoices }
    default:                      return state
  }
}

// Serialise l'état pour localStorage (exclut audio_data — peut être > 10 MB)
function serialize(state: WizardState): string {
  const safe = {
    ...state,
    result: state.result
      ? { ...state.result, audio_data: undefined }
      : null,
    // voices et geminiVoices sont rechargées depuis l'API — inutile de les stocker
    voices: undefined,
    geminiVoices: undefined,
    _expiresAt: Date.now() + SESSION_TTL_MS,
  }
  return JSON.stringify(safe)
}

function deserialize(raw: string): Partial<WizardState> | null {
  try {
    const parsed = JSON.parse(raw)
    // Ignorer les états expirés
    if (parsed._expiresAt && Date.now() > parsed._expiresAt) return null
    return parsed
  } catch {
    return null
  }
}

interface WizardContextValue {
  state: WizardState
  dispatch: React.Dispatch<Action>
  reset: () => void
  isHydrated: boolean
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate depuis localStorage au montage — toujours marquer isHydrated à la fin
  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    const saved = raw ? deserialize(raw) : null
    if (saved) {
      if (saved.mode !== undefined)            dispatch({ type: 'SET_MODE',              payload: saved.mode ?? null })
      if (saved.locale)                        dispatch({ type: 'SET_LOCALE',            payload: saved.locale })
      if (saved.engine)                        dispatch({ type: 'SET_ENGINE',            payload: saved.engine })
      if (saved.speakers?.length)              dispatch({ type: 'SET_SPEAKERS',          payload: saved.speakers })
      if (saved.geminiProfiles?.length)        dispatch({ type: 'SET_GEMINI_PROFILES',   payload: saved.geminiProfiles })
      if (saved.ambient !== undefined)         dispatch({ type: 'SET_AMBIENT',           payload: saved.ambient ?? '' })
      if (saved.ambientIntensity !== undefined)dispatch({ type: 'SET_AMBIENT_INTENSITY', payload: saved.ambientIntensity ?? 0 })
      if (saved.silenceMs !== undefined)       dispatch({ type: 'SET_SILENCE_MS',        payload: saved.silenceMs ?? 500 })
      if (saved.script !== undefined)          dispatch({ type: 'SET_SCRIPT',            payload: saved.script ?? '' })
      if (saved.result)                        dispatch({ type: 'SET_RESULT',            payload: saved.result })
      if (saved.niveau !== undefined)          dispatch({ type: 'SET_NIVEAU',            payload: saved.niveau ?? '' })
      if (saved.vocabulaire !== undefined)     dispatch({ type: 'SET_VOCABULAIRE',       payload: saved.vocabulaire ?? '' })
      if (saved.classe !== undefined)          dispatch({ type: 'SET_CLASSE',            payload: saved.classe ?? '' })
    }
    setIsHydrated(true)
  }, [])

  // Sync vers localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem(SESSION_KEY, serialize(state))
  }, [state])

  const reset = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    dispatch({ type: 'RESET' })
  }, [])

  return (
    <WizardContext.Provider value={{ state, dispatch, reset, isHydrated }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider')
  return ctx
}
