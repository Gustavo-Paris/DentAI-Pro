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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      evaluations: {
        Row: {
          aesthetic_level: string
          alternatives: Json | null
          bruxism: boolean
          budget: string
          cavity_class: string
          created_at: string
          has_inventory_at_creation: boolean | null
          id: string
          ideal_reason: string | null
          ideal_resin_id: string | null
          is_from_inventory: boolean | null
          longevity_expectation: string
          patient_age: number
          photo_45: string | null
          photo_face: string | null
          photo_frontal: string | null
          recommendation_text: string | null
          recommended_resin_id: string | null
          region: string
          restoration_size: string
          stratification_needed: boolean
          stratification_protocol: Json | null
          substrate: string
          tooth: string
          tooth_color: string
          user_id: string
        }
        Insert: {
          aesthetic_level: string
          alternatives?: Json | null
          bruxism?: boolean
          budget: string
          cavity_class: string
          created_at?: string
          has_inventory_at_creation?: boolean | null
          id?: string
          ideal_reason?: string | null
          ideal_resin_id?: string | null
          is_from_inventory?: boolean | null
          longevity_expectation: string
          patient_age: number
          photo_45?: string | null
          photo_face?: string | null
          photo_frontal?: string | null
          recommendation_text?: string | null
          recommended_resin_id?: string | null
          region: string
          restoration_size: string
          stratification_needed?: boolean
          stratification_protocol?: Json | null
          substrate: string
          tooth: string
          tooth_color: string
          user_id: string
        }
        Update: {
          aesthetic_level?: string
          alternatives?: Json | null
          bruxism?: boolean
          budget?: string
          cavity_class?: string
          created_at?: string
          has_inventory_at_creation?: boolean | null
          id?: string
          ideal_reason?: string | null
          ideal_resin_id?: string | null
          is_from_inventory?: boolean | null
          longevity_expectation?: string
          patient_age?: number
          photo_45?: string | null
          photo_face?: string | null
          photo_frontal?: string | null
          recommendation_text?: string | null
          recommended_resin_id?: string | null
          region?: string
          restoration_size?: string
          stratification_needed?: boolean
          stratification_protocol?: Json | null
          substrate?: string
          tooth?: string
          tooth_color?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_ideal_resin_id_fkey"
            columns: ["ideal_resin_id"]
            isOneToOne: false
            referencedRelation: "resins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_recommended_resin_id_fkey"
            columns: ["recommended_resin_id"]
            isOneToOne: false
            referencedRelation: "resins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          cro: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cro?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cro?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resins: {
        Row: {
          aesthetics: string
          created_at: string
          description: string | null
          id: string
          indications: string[]
          manufacturer: string
          name: string
          opacity: string
          polishing: string
          price_range: string
          resistance: string
          type: string
        }
        Insert: {
          aesthetics: string
          created_at?: string
          description?: string | null
          id?: string
          indications?: string[]
          manufacturer: string
          name: string
          opacity: string
          polishing: string
          price_range: string
          resistance: string
          type: string
        }
        Update: {
          aesthetics?: string
          created_at?: string
          description?: string | null
          id?: string
          indications?: string[]
          manufacturer?: string
          name?: string
          opacity?: string
          polishing?: string
          price_range?: string
          resistance?: string
          type?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          created_at: string
          id: string
          resin_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resin_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_resin_id_fkey"
            columns: ["resin_id"]
            isOneToOne: false
            referencedRelation: "resins"
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
