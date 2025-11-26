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
      categories: {
        Row: {
          color: string
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          name: string
          name_en: string | null
          name_ru: string | null
          name_sr: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          name_en?: string | null
          name_ru?: string | null
          name_sr?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
          name_ru?: string | null
          name_sr?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          name_en: string
          name_ru: string
          name_sr: string
          zoom_level: number
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name_en: string
          name_ru: string
          name_sr: string
          zoom_level?: number
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name_en?: string
          name_ru?: string
          name_sr?: string
          zoom_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          id: string
          name_en: string
          name_ru: string
          name_sr: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name_en: string
          name_ru: string
          name_sr: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name_en?: string
          name_ru?: string
          name_sr?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      donation_content: {
        Row: {
          created_at: string
          donation_description_en: string | null
          donation_description_ru: string | null
          donation_description_sr: string | null
          donation_qr_code_url: string | null
          donation_title_en: string
          donation_title_ru: string
          donation_title_sr: string
          donation_wallet_address: string | null
          id: string
          updated_at: string
          welcome_description_en: string | null
          welcome_description_ru: string | null
          welcome_description_sr: string | null
          welcome_title_en: string
          welcome_title_ru: string
          welcome_title_sr: string
        }
        Insert: {
          created_at?: string
          donation_description_en?: string | null
          donation_description_ru?: string | null
          donation_description_sr?: string | null
          donation_qr_code_url?: string | null
          donation_title_en?: string
          donation_title_ru?: string
          donation_title_sr?: string
          donation_wallet_address?: string | null
          id?: string
          updated_at?: string
          welcome_description_en?: string | null
          welcome_description_ru?: string | null
          welcome_description_sr?: string | null
          welcome_title_en?: string
          welcome_title_ru?: string
          welcome_title_sr?: string
        }
        Update: {
          created_at?: string
          donation_description_en?: string | null
          donation_description_ru?: string | null
          donation_description_sr?: string | null
          donation_qr_code_url?: string | null
          donation_title_en?: string
          donation_title_ru?: string
          donation_title_sr?: string
          donation_wallet_address?: string | null
          id?: string
          updated_at?: string
          welcome_description_en?: string | null
          welcome_description_ru?: string | null
          welcome_description_sr?: string | null
          welcome_title_en?: string
          welcome_title_ru?: string
          welcome_title_sr?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_en: string
          body_ru: string
          body_sr: string
          created_at: string
          id: string
          subject_en: string
          subject_ru: string
          subject_sr: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body_en: string
          body_ru: string
          body_sr: string
          created_at?: string
          id?: string
          subject_en: string
          subject_ru: string
          subject_sr: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_ru?: string
          body_sr?: string
          created_at?: string
          id?: string
          subject_en?: string
          subject_ru?: string
          subject_sr?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_statistics: {
        Row: {
          body: string
          created_at: string
          failed_count: number
          id: string
          is_test: boolean | null
          sent_at: string
          sent_by: string | null
          successful_count: number
          title: string
          total_recipients: number
        }
        Insert: {
          body: string
          created_at?: string
          failed_count?: number
          id?: string
          is_test?: boolean | null
          sent_at?: string
          sent_by?: string | null
          successful_count?: number
          title: string
          total_recipients?: number
        }
        Update: {
          body?: string
          created_at?: string
          failed_count?: number
          id?: string
          is_test?: boolean | null
          sent_at?: string
          sent_by?: string | null
          successful_count?: number
          title?: string
          total_recipients?: number
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          place_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          place_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          place_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category_id: string | null
          city_id: string | null
          created_at: string
          custom_button_text: string | null
          custom_button_url: string | null
          custom_page_content: Json | null
          description: string | null
          description_en: string | null
          description_sr: string | null
          google_maps_url: string | null
          has_custom_page: boolean | null
          id: string
          image_url: string | null
          is_hidden: boolean | null
          is_premium: boolean | null
          latitude: number
          longitude: number
          name: string
          name_en: string | null
          name_sr: string | null
          owner_id: string | null
          phone: string | null
          premium_expires_at: string | null
          promotions: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          custom_button_text?: string | null
          custom_button_url?: string | null
          custom_page_content?: Json | null
          description?: string | null
          description_en?: string | null
          description_sr?: string | null
          google_maps_url?: string | null
          has_custom_page?: boolean | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean | null
          is_premium?: boolean | null
          latitude: number
          longitude: number
          name: string
          name_en?: string | null
          name_sr?: string | null
          owner_id?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          promotions?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          custom_button_text?: string | null
          custom_button_url?: string | null
          custom_page_content?: Json | null
          description?: string | null
          description_en?: string | null
          description_sr?: string | null
          google_maps_url?: string | null
          has_custom_page?: boolean | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean | null
          is_premium?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          name_en?: string | null
          name_sr?: string | null
          owner_id?: string | null
          phone?: string | null
          premium_expires_at?: string | null
          promotions?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city_id: string | null
          country_id: string | null
          created_at: string
          credits: number
          email: string
          full_name: string | null
          id: string
          language: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          credits?: number
          email: string
          full_name?: string | null
          id: string
          language?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          credits?: number
          email?: string
          full_name?: string | null
          id?: string
          language?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      purchased_tours: {
        Row: {
          id: string
          purchased_at: string
          tour_id: string
          user_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          tour_id: string
          user_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          tour_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchased_tours_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          scheduled_for: string
          sent: boolean | null
          sent_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          scheduled_for: string
          sent?: boolean | null
          sent_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          scheduled_for?: string
          sent?: boolean | null
          sent_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      share_statistics: {
        Row: {
          id: string
          place_id: string
          platform: string
          shared_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          place_id: string
          platform: string
          shared_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          place_id?: string
          platform?: string
          shared_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_statistics_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          name_ru: string | null
          name_sr: string | null
          price: number
          type: Database["public"]["Enums"]["subscription_type"]
          updated_at: string
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          name_ru?: string | null
          name_sr?: string | null
          price?: number
          type: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          name_ru?: string | null
          name_sr?: string | null
          price?: number
          type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
        }
        Relationships: []
      }
      tour_places: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          place_id: string
          tour_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          place_id: string
          tour_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          place_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_places_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          city_id: string | null
          created_at: string
          description: string | null
          description_en: string | null
          description_sr: string | null
          display_order: number | null
          guide_content: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_en: string | null
          name_sr: string | null
          price: number | null
          tour_content: Json | null
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_sr?: string | null
          display_order?: number | null
          guide_content?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_en?: string | null
          name_sr?: string | null
          price?: number | null
          tour_content?: Json | null
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_sr?: string | null
          display_order?: number | null
          guide_content?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          name_sr?: string | null
          price?: number | null
          tour_content?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_places: {
        Row: {
          created_at: string
          id: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string
          id: string
          is_active: boolean
          next_billing_date: string
          place_id: string | null
          plan_id: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          next_billing_date: string
          place_id?: string | null
          plan_id: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          next_billing_date?: string
          place_id?: string | null
          plan_id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      trigger_custom_email: {
        Args: {
          email: string
          email_action_type: string
          redirect_to: string
          token: string
          token_hash: string
          user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      billing_period: "daily" | "weekly" | "monthly" | "yearly"
      subscription_type: "place_listing" | "premium_status"
      user_type: "individual" | "business"
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
    Enums: {
      app_role: ["admin", "user"],
      billing_period: ["daily", "weekly", "monthly", "yearly"],
      subscription_type: ["place_listing", "premium_status"],
      user_type: ["individual", "business"],
    },
  },
} as const
