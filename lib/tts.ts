const MAX_TEXT_LENGTH = 10000

interface ElevenLabsRequest {
  text: string
  model_id: string
  output_format: string
  voice_settings?: {
    stability?: number
    similarity_boost?: number
  }
}

interface ElevenLabsError {
  detail?: {
    status?: string
    message?: string
  }
  error?: string
}

export async function generateAudioFromText(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  const modelId = process.env.ELEVENLABS_MODEL_ID

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }

  if (!voiceId) {
    throw new Error('ELEVENLABS_VOICE_ID is not configured')
  }

  if (!modelId) {
    throw new Error('ELEVENLABS_MODEL_ID is not configured')
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty')
  }

  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) 
    : text

  const requestBody: ElevenLabsRequest = {
    text: truncatedText,
    model_id: modelId,
    output_format: 'mp3_44100_128',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  }

  console.log(`Generating audio for text (${truncatedText.length} characters)`)

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`
      
      try {
        const errorData: ElevenLabsError = await response.json()
        if (errorData.detail?.message) {
          errorMessage = errorData.detail.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // If JSON parsing fails, use the default error message
      }

      console.error('ElevenLabs TTS error:', errorMessage)
      throw new Error(errorMessage)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      throw new Error('ElevenLabs returned empty audio data')
    }

    console.log(`Audio generated successfully (${buffer.length} bytes)`)
    
    return buffer
  } catch (error) {
    if (error instanceof Error) {
      console.error('TTS generation error:', error.message)
      throw error
    }
    
    console.error('Unexpected error during TTS generation:', error)
    throw new Error('Failed to generate audio')
  }
}