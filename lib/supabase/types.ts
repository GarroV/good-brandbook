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
      workspaces: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
      }
      users: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string
          role: 'admin' | 'member'
          is_superadmin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          email: string
          role?: 'admin' | 'member'
          is_superadmin?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      brandbook: {
        Row: {
          id: string
          workspace_id: string
          tokens: Json
          assets: Json
          context: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          tokens?: Json
          assets?: Json
          context?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['brandbook']['Insert']>
      }
      batches: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          prompt: string
          reference_batch_id: string | null
          status: 'draft' | 'published'
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          prompt: string
          reference_batch_id?: string | null
          status?: 'draft' | 'published'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['batches']['Insert']>
      }
      batch_items: {
        Row: {
          id: string
          batch_id: string
          workspace_id: string
          format: string
          html_url: string | null
          status: 'pending' | 'generating' | 'preview_ready' | 'exporting' | 'done' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          workspace_id: string
          format: string
          html_url?: string | null
          status?: 'pending' | 'generating' | 'preview_ready' | 'exporting' | 'done' | 'failed'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['batch_items']['Insert']>
      }
      assets: {
        Row: {
          id: string
          batch_item_id: string
          workspace_id: string
          type: 'jpeg_preview' | 'png_final' | 'pdf'
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          batch_item_id: string
          workspace_id: string
          type: 'jpeg_preview' | 'png_final' | 'pdf'
          url: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
      }
      invites: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role: 'admin' | 'member'
          token: string
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role?: 'admin' | 'member'
          token?: string
          accepted_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invites']['Insert']>
      }
      workspace_limits: {
        Row: {
          workspace_id: string
          monthly_batches: number
          daily_per_user: number
          bonus_batches: number
          reset_at: string
        }
        Insert: {
          workspace_id: string
          monthly_batches?: number
          daily_per_user?: number
          bonus_batches?: number
          reset_at?: string
        }
        Update: Partial<Database['public']['Tables']['workspace_limits']['Insert']>
      }
      activity_feed: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          format: string | null
          action: 'generated' | 'published'
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          format?: string | null
          action: 'generated' | 'published'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['activity_feed']['Insert']>
      }
      generation_log: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          format: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          format: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['generation_log']['Insert']>
      }
    }
    Functions: {
      check_and_increment_limit: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: undefined
      }
      my_workspace_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
