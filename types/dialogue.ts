export interface Speaker {
  label: string
  voice: string
  color: string
}

export interface VoiceInfo {
  id: string
  label: string
  gender: string
}

export interface LanguageConfig {
  name: string
  voices: VoiceInfo[]
}

export interface VoicesConfig {
  [locale: string]: LanguageConfig
}

export interface Segment {
  index: number
  speaker: string
  voice: string
  duration: number
}

export interface GenerateResult {
  audio_url: string
  audio_data?: string   // base64 MP3 for immediate playback
  qr_base64: string
  duration_seconds: number
  segments: Segment[]
}

export interface DialogueRecord {
  id: string
  language: string
  script_text: string
  speakers: Speaker[]
  audio_url: string | null
  duration_seconds: number | null
  created_at: string
}
