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
    
    const { avatar } = await request.json()
    
    if (!avatar) {
      return NextResponse.json(
        { error: 'No avatar provided' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    
    // Upload image to Supabase Storage
    const base64Data = avatar.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    let fileExt = avatar.match(/data:image\/(\w+)/)?.[1] || 'png'
    
    // Ensure we only use supported formats
    if (!['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExt.toLowerCase())) {
      fileExt = 'jpg' // Default to jpg for unsupported formats
    }
    
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    
    // Create storage bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets()
    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars')
    
    if (!avatarBucketExists) {
      await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })
    }
    
    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    
    // Update profile with new avatar URL
    const { data: profile, error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Profile update error:', updateError)
      throw updateError
    }
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Avatar update error:', error)
    return NextResponse.json(
      { error: 'Failed to update avatar' },
      { status: 500 }
    )
  }
}