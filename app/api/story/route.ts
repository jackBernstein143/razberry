import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateStoryFromPrompt } from '@/lib/openrouter'
import { generateAudioFromText } from '@/lib/tts'

const StoryRequestSchema = z.object({
  prompt: z.string().min(1).max(1000)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = StoryRequestSchema.safeParse(body)
    
    if (!validation.success) {
      console.error('Invalid request body:', validation.error.flatten())
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const { prompt } = validation.data
    
    console.log('Generating story for prompt:', prompt.substring(0, 100) + '...')
    
    const storyResult = await generateStoryFromPrompt(prompt)
    
    console.log('Story generated successfully, title:', storyResult.title, 'description:', storyResult.description, 'length:', storyResult.story.length)
    
    console.log('Generating audio from story text...')
    
    try {
      const audioBuffer = await generateAudioFromText(storyResult.story)
      const audioBase64 = audioBuffer.toString('base64')
      
      console.log('Audio generated successfully, size:', audioBuffer.length, 'bytes')
      
      return NextResponse.json(
        { 
          storyTitle: storyResult.title,
          storyDescription: storyResult.description,
          storyText: storyResult.story,
          audio: {
            mime: 'audio/mpeg',
            base64: audioBase64
          }
        },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (audioError) {
      console.error('Audio generation failed:', audioError)
      
      if (audioError instanceof Error && audioError.message.includes('ElevenLabs')) {
        return NextResponse.json(
          { 
            error: 'Failed to generate audio',
            message: audioError.message,
            storyTitle: storyResult.title,
            storyDescription: storyResult.description,
            storyText: storyResult.story
          },
          { status: 502 }
        )
      }
      
      return NextResponse.json(
        { 
          storyTitle: storyResult.title,
          storyDescription: storyResult.description,
          storyText: storyResult.story,
          error: 'Audio generation failed but story was created'
        },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  } catch (error) {
    console.error('Story generation error:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    if (error instanceof Error) {
      if (error.message.includes('not configured')) {
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to generate story',
          message: error.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}