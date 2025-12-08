export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      calendars: {
        Row: {
          calendar_id: string
          color: string
          created_at: string
          id: string
          is_default: boolean
          is_visible: boolean
          name: string
          updated_at: string
        }
        Insert: {
          calendar_id: string
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_visible?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_visible?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          message_id: string
          role: string
          timestamp: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_id: string
          role: string
          timestamp?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string
          role?: string
          timestamp?: string
        }
        Relationships: []
      }
      event_sync_mapping: {
        Row: {
          created_at: string | null
          google_account_id: string | null
          google_event_id: string
          id: string
          last_synced_at: string | null
          local_event_id: string
          sync_status: string | null
        }
        Insert: {
          created_at?: string | null
          google_account_id?: string | null
          google_event_id: string
          id?: string
          last_synced_at?: string | null
          local_event_id: string
          sync_status?: string | null
        }
        Update: {
          created_at?: string | null
          google_account_id?: string | null
          google_event_id?: string
          id?: string
          last_synced_at?: string | null
          local_event_id?: string
          sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sync_mapping_google_account_id_fkey"
            columns: ["google_account_id"]
            isOneToOne: false
            referencedRelation: "google_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean | null
          calendar_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          end_time: string
          event_id: string
          event_type: string
          id: string
          is_deleted: boolean | null
          location: string | null
          notifications: Json | null
          recurrence: string | null
          recurrence_end: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean | null
          calendar_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_time: string
          event_id: string
          event_type?: string
          id?: string
          is_deleted?: boolean | null
          location?: string | null
          notifications?: Json | null
          recurrence?: string | null
          recurrence_end?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean | null
          calendar_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_time?: string
          event_id?: string
          event_type?: string
          id?: string
          is_deleted?: boolean | null
          location?: string | null
          notifications?: Json | null
          recurrence?: string | null
          recurrence_end?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      google_accounts: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string | null
          email: string
          id: string
          last_sync_at: string | null
          refresh_token: string
          sync_enabled: boolean | null
          sync_token: string | null
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_sync_at?: string | null
          refresh_token: string
          sync_enabled?: boolean | null
          sync_token?: string | null
          token_expires_at: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string
          sync_enabled?: boolean | null
          sync_token?: string | null
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          default_view: string | null
          id: string
          locale: string | null
          notification_email: string | null
          settings_key: string
          theme: string | null
          time_format: string | null
          updated_at: string
          week_starts_on: number | null
        }
        Insert: {
          created_at?: string
          default_view?: string | null
          id?: string
          locale?: string | null
          notification_email?: string | null
          settings_key?: string
          theme?: string | null
          time_format?: string | null
          updated_at?: string
          week_starts_on?: number | null
        }
        Update: {
          created_at?: string
          default_view?: string | null
          id?: string
          locale?: string | null
          notification_email?: string | null
          settings_key?: string
          theme?: string | null
          time_format?: string | null
          updated_at?: string
          week_starts_on?: number | null
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          action: string
          attempts: number | null
          created_at: string | null
          error_message: string | null
          event_data: Json | null
          google_account_id: string | null
          id: string
          last_attempt_at: string | null
          local_event_id: string
        }
        Insert: {
          action: string
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          google_account_id?: string | null
          id?: string
          last_attempt_at?: string | null
          local_event_id: string
        }
        Update: {
          action?: string
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          google_account_id?: string | null
          id?: string
          last_attempt_at?: string | null
          local_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_google_account_id_fkey"
            columns: ["google_account_id"]
            isOneToOne: false
            referencedRelation: "google_accounts"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
