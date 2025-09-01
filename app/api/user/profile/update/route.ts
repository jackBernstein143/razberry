import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const updateData: any = {}
    
    // Only include fields that were sent in the request
    if (body.name !== undefined) updateData.name = body.name
    if (body.bio !== undefined) updateData.bio = body.bio
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No data to update' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    
    // First check if profile exists, if not create it
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', user.id)
      .single()
    
    let profile
    
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', user.id)
        .select()
        .single()
      
      if (error) {
        console.error('Profile update error:', error)
        throw error
      }
      profile = data
    } else {
      // Create new profile if it doesn't exist
      const { data, error } = await (supabase as any)
        .from('profiles')
        .insert({
          clerk_user_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || null,
          ...updateData
        })
        .select()
        .single()
      
      if (error) {
        console.error('Profile creation error:', error)
        throw error
      }
      profile = data
    }
    
    // Note: Clerk user name update removed as it requires different approach in production
    // Users can update their Clerk profile through the UserButton component
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile update error details:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}