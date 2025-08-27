export interface StoryPrompt {
  text: string
  timestamp?: number
}

export interface PromptFormProps {
  onSubmit: (prompt: StoryPrompt) => void | Promise<void>
  placeholder?: string
  maxLength?: number
}

export interface StoryRequest {
  prompt: string
}

export interface StoryResponse {
  storyText: string
}

export interface TTSResponse {
  storyTitle: string
  storyDescription: string
  storyText: string
  audio: {
    mime: 'audio/mpeg'
    base64: string
  }
}

export interface ErrorResponse {
  error: string
  message?: string
  details?: Record<string, string[]>
}