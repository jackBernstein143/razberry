import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Fetch user's stories
    const { data: stories, error: storiesError } = await (supabase as any)
      .from('stories')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    if (storiesError) {
      console.error('Error fetching stories:', storiesError)
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      stories: stories || []
    })
  } catch (error) {
    console.error('Error in list stories API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}