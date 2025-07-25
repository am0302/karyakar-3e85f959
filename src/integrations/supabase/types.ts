
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: []
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
        Relationships: []
      }
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_system_role: boolean | null
          role_name: string
          status: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_system_role?: boolean | null
          role_name: string
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_system_role?: boolean | null
          role_name?: string
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hierarchy_permissions: {
        Row: {
          can_assign_locations: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_view: boolean | null
          created_at: string
          higher_role: string
          id: string
          lower_role: string
          updated_at: string
        }
        Insert: {
          can_assign_locations?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          higher_role: string
          id?: string
          lower_role: string
          updated_at?: string
        }
        Update: {
          can_assign_locations?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          higher_role?: string
          id?: string
          lower_role?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      module_permissions: {
        Row: {
          can_add: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_view: boolean | null
          created_at: string
          id: string
          module_name: string
          scope_kshetra_id: string | null
          scope_mandal_id: string | null
          scope_mandir_id: string | null
          scope_type: string | null
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
          module_name: string
          scope_kshetra_id?: string | null
          scope_mandal_id?: string | null
          scope_mandir_id?: string | null
          scope_type?: string | null
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
          module_name?: string
          scope_kshetra_id?: string | null
          scope_mandal_id?: string | null
          scope_mandir_id?: string | null
          scope_type?: string | null
          scope_village_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          email: string | null
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
          role: string
          seva_type_id: string | null
          updated_at: string
          village_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
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
          role?: string
          seva_type_id?: string | null
          updated_at?: string
          village_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
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
          role?: string
          seva_type_id?: string | null
          updated_at?: string
          village_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      role_hierarchy: {
        Row: {
          created_at: string
          id: string
          level: number
          parent_role: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          parent_role?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          parent_role?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_add: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_view: boolean | null
          created_at: string
          id: string
          module_name: string
          role: string
          updated_at: string
        }
        Insert: {
          can_add?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          module_name: string
          role: string
          updated_at?: string
        }
        Update: {
          can_add?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          module_name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      user_location_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          id: string
          kshetra_ids: string[] | null
          mandal_ids: string[] | null
          mandir_ids: string[] | null
          updated_at: string
          user_id: string
          village_ids: string[] | null
        }
        Insert: {
          assigned_by: string
          created_at?: string
          id?: string
          kshetra_ids?: string[] | null
          mandal_ids?: string[] | null
          mandir_ids?: string[] | null
          updated_at?: string
          user_id: string
          village_ids?: string[] | null
        }
        Update: {
          assigned_by?: string
          created_at?: string
          id?: string
          kshetra_ids?: string[] | null
          mandal_ids?: string[] | null
          mandir_ids?: string[] | null
          updated_at?: string
          user_id?: string
          village_ids?: string[] | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_priority: "high" | "low" | "medium"
      task_status: "completed" | "in_progress" | "pending"
      task_type: "general" | "personal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
