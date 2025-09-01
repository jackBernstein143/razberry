import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, content, audioBase64, prompt } = body

    if (!title || !content || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const profile = profileData as { id: string }
    let audioUrl = null

    // Upload audio to Supabase Storage if provided
    if (audioBase64) {
      console.log('Attempting to upload audio, base64 length:', audioBase64.length)
      
      try {
        // First check if bucket exists, create if not
        const { data: buckets } = await supabase.storage.listBuckets()
        const bucketExists = buckets?.some(bucket => bucket.name === 'story-audio')
        
        if (!bucketExists) {
          console.log('Creating story-audio bucket...')
          const { error: createBucketError } = await supabase.storage.createBucket('story-audio', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          })
          
          if (createBucketError) {
            console.error('Error creating bucket:', createBucketError)
            // Continue anyway, bucket might already exist
          }
        }

        const audioBuffer = Buffer.from(audioBase64, 'base64')
        const fileName = `${profile.id}/${Date.now()}_story.mp3`
        
        console.log('Uploading audio file:', fileName, 'Size:', audioBuffer.length)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('story-audio')
          .upload(fileName, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: false
          })

        if (uploadError) {
          console.error('Error uploading audio:', uploadError)
          return NextResponse.json(
            { error: `Failed to upload audio: ${uploadError.message}` },
            { status: 500 }
          )
        }
        
        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('story-audio')
            .getPublicUrl(fileName)
          audioUrl = publicUrl
          console.log('Audio uploaded successfully, URL:', audioUrl)
        }
      } catch (uploadError) {
        console.error('Unexpected error during audio upload:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload audio file' },
          { status: 500 }
        )
      }
    } else {
      console.log('No audio data provided in request')
    }

    // Save story to database
    const { data: story, error: storyError } = await (supabase as any)
      .from('stories')
      .insert({
        user_id: profile.id,
        title,
        description: description || null,
        content,
        audio_url: audioUrl,
        prompt,
        is_public: false
      })
      .select()
      .single()

    if (storyError) {
      console.error('Error saving story:', storyError)
      return NextResponse.json(
        { error: 'Failed to save story' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      story 
    })
  } catch (error) {
    console.error('Error in save story API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}