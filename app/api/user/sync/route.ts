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
    
    const supabase = createServerSupabaseClient()
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', user.id)
      .single()
    
    const profileData = {
      clerk_user_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || null,
      name: user.fullName || user.firstName || user.username || null,
      avatar_url: user.imageUrl || null,
    }
    
    let profile
    
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update(profileData)
        .eq('clerk_user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      profile = data
    } else {
      // Create new profile
      const { data, error } = await (supabase as any)
        .from('profiles')
        .insert(profileData)
        .select()
        .single()
      
      if (error) throw error
      profile = data
    }
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync profile' },
      { status: 500 }
    )
  }
}