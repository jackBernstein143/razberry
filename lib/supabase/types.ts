export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          clerk_user_id: string
          email: string | null
          name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_plan: string | null
          subscription_period: string | null
          subscription_current_period_end: string | null
          audio_minutes_used: number
          audio_minutes_limit: number
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_plan?: string | null
          subscription_period?: string | null
          subscription_current_period_end?: string | null
          audio_minutes_used?: number
          audio_minutes_limit?: number
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_plan?: string | null
          subscription_period?: string | null
          subscription_current_period_end?: string | null
          audio_minutes_used?: number
          audio_minutes_limit?: number
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          content: string
          audio_url: string | null
          prompt: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          content: string
          audio_url?: string | null
          prompt: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          content?: string
          audio_url?: string | null
          prompt?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}