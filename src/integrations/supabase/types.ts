export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          kshetra_id: string | null
          mandal_id: string | null
          mandir_id: string | null
          name: string | null
          updated_at: string
          village_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean
          kshetra_id?: string | null
          mandal_id?: string | null
          mandir_id?: string | null
          name?: string | null
          updated_at?: string
          village_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          kshetra_id?: string | null
          mandal_id?: string | null
          mandir_id?: string | null
          name?: string | null
          updated_at?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_kshetra_id_fkey"
            columns: ["kshetra_id"]
            isOneToOne: false
            referencedRelation: "kshetras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_mandal_id_fkey"
            columns: ["mandal_id"]
            isOneToOne: false
            referencedRelation: "mandals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_mandir_id_fkey"
            columns: ["mandir_id"]
            isOneToOne: false
            referencedRelation: "mandirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      kshetras: {
        Row: {
          contact_number: string | null
          contact_person: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          mandir_id: string
          name: string
          updated_at: string
        }
        Insert: {
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mandir_id: string
          name: string
          updated_at?: string
        }
        Update: {
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mandir_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kshetras_mandir_id_fkey"
            columns: ["mandir_id"]
            isOneToOne: false
            referencedRelation: "mandirs"
            referencedColumns: ["id"]
          },
        ]
      }
      mandals: {
        Row: {
          contact_number: string | null
          contact_person: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          meeting_day: string | null
          meeting_time: string | null
          name: string
          updated_at: string
          village_id: string
        }
        Insert: {
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          updated_at?: string
          village_id: string
        }
        Update: {
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          updated_at?: string
          village_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandals_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      mandirs: {
        Row: {
          address: string | null
          contact_number: string | null
          contact_person: string | null
          created_at: string
          description: string | null
          email: string | null
          established_date: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          established_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          established_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_deleted: boolean
          message_type: string
          room_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          is_active: boolean
          is_whatsapp_same_as_mobile: boolean | null
          kshetra_id: string | null
          mandal_id: string | null
          mandir_id: string | null
          mobile_number: string
          profession_id: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          seva_type_id: string | null
          updated_at: string
          village_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id: string
          is_active?: boolean
          is_whatsapp_same_as_mobile?: boolean | null
          kshetra_id?: string | null
          mandal_id?: string | null
          mandir_id?: string | null
          mobile_number: string
          profession_id?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seva_type_id?: string | null
          updated_at?: string
          village_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_whatsapp_same_as_mobile?: boolean | null
          kshetra_id?: string | null
          mandal_id?: string | null
          mandir_id?: string | null
          mobile_number?: string
          profession_id?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seva_type_id?: string | null
          updated_at?: string
          village_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_kshetra_id_fkey"
            columns: ["kshetra_id"]
            isOneToOne: false
            referencedRelation: "kshetras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_mandal_id_fkey"
            columns: ["mandal_id"]
            isOneToOne: false
            referencedRelation: "mandals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_mandir_id_fkey"
            columns: ["mandir_id"]
            isOneToOne: false
            referencedRelation: "mandirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_seva_type_id_fkey"
            columns: ["seva_type_id"]
            isOneToOne: false
            referencedRelation: "seva_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      seva_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          kshetra_id: string | null
          mandal_id: string | null
          mandir_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
          village_id: string | null
        }
        Insert: {
          assigned_by: string
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          kshetra_id?: string | null
          mandal_id?: string | null
          mandir_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string
          village_id?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          kshetra_id?: string | null
          mandal_id?: string | null
          mandir_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_kshetra_id_fkey"
            columns: ["kshetra_id"]
            isOneToOne: false
            referencedRelation: "kshetras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_mandal_id_fkey"
            columns: ["mandal_id"]
            isOneToOne: false
            referencedRelation: "mandals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_mandir_id_fkey"
            columns: ["mandir_id"]
            isOneToOne: false
            referencedRelation: "mandirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_add: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_view: boolean | null
          created_at: string
          id: string
          module: string
          scope_kshetra_id: string | null
          scope_mandal_id: string | null
          scope_mandir_id: string | null
          scope_village_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_add?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          module: string
          scope_kshetra_id?: string | null
          scope_mandal_id?: string | null
          scope_mandir_id?: string | null
          scope_village_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_add?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          module?: string
          scope_kshetra_id?: string | null
          scope_mandal_id?: string | null
          scope_mandir_id?: string | null
          scope_village_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_scope_kshetra_id_fkey"
            columns: ["scope_kshetra_id"]
            isOneToOne: false
            referencedRelation: "kshetras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_scope_mandal_id_fkey"
            columns: ["scope_mandal_id"]
            isOneToOne: false
            referencedRelation: "mandals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_scope_mandir_id_fkey"
            columns: ["scope_mandir_id"]
            isOneToOne: false
            referencedRelation: "mandirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_scope_village_id_fkey"
            columns: ["scope_village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      villages: {
        Row: {
          contact_number: string | null
          contact_person: string | null
          created_at: string
          district: string | null
          id: string
          is_active: boolean
          kshetra_id: string
          name: string
          pincode: string | null
          population: number | null
          state: string | null
          updated_at: string
        }
        Insert: {
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          kshetra_id: string
          name: string
          pincode?: string | null
          population?: number | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          kshetra_id?: string
          name?: string
          pincode?: string | null
          population?: number | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "villages_kshetra_id_fkey"
            columns: ["kshetra_id"]
            isOneToOne: false
            referencedRelation: "kshetras"
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
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed"
      task_type: "personal" | "delegated" | "broadcasted"
      user_role:
        | "super_admin"
        | "sant_nirdeshak"
        | "sah_nirdeshak"
        | "mandal_sanchalak"
        | "karyakar"
        | "sevak"
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
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed"],
      task_type: ["personal", "delegated", "broadcasted"],
      user_role: [
        "super_admin",
        "sant_nirdeshak",
        "sah_nirdeshak",
        "mandal_sanchalak",
        "karyakar",
        "sevak",
      ],
    },
  },
} as const
