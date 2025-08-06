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
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
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
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_system_role: boolean | null
          level: number | null
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
          level?: number | null
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
          level?: number | null
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
          higher_role: Database["public"]["Enums"]["user_role"]
          id: string
          lower_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          can_assign_locations?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          higher_role: Database["public"]["Enums"]["user_role"]
          id?: string
          lower_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          can_assign_locations?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          higher_role?: Database["public"]["Enums"]["user_role"]
          id?: string
          lower_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      karyakar_additional_details: {
        Row: {
          additional_info: Json | null
          blood_group: string | null
          created_at: string
          education_field: string | null
          education_institution: string | null
          education_level: string | null
          id: string
          karyakar_id: string
          marital_status: string | null
          satsangi_category: string | null
          skills: string[] | null
          updated_at: string
          vehicle_types: string[] | null
        }
        Insert: {
          additional_info?: Json | null
          blood_group?: string | null
          created_at?: string
          education_field?: string | null
          education_institution?: string | null
          education_level?: string | null
          id?: string
          karyakar_id: string
          marital_status?: string | null
          satsangi_category?: string | null
          skills?: string[] | null
          updated_at?: string
          vehicle_types?: string[] | null
        }
        Update: {
          additional_info?: Json | null
          blood_group?: string | null
          created_at?: string
          education_field?: string | null
          education_institution?: string | null
          education_level?: string | null
          id?: string
          karyakar_id?: string
          marital_status?: string | null
          satsangi_category?: string | null
          skills?: string[] | null
          updated_at?: string
          vehicle_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "karyakar_additional_details_karyakar_id_fkey"
            columns: ["karyakar_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
        Relationships: [
          {
            foreignKeyName: "module_permissions_scope_kshetra_id_fkey"
            columns: ["scope_kshetra_id"]
            isOneToOne: false
            referencedRelation: "kshetras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_permissions_scope_mandal_id_fkey"
            columns: ["scope_mandal_id"]
            isOneToOne: false
            referencedRelation: "mandals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_permissions_scope_mandir_id_fkey"
            columns: ["scope_mandir_id"]
            isOneToOne: false
            referencedRelation: "mandirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_permissions_scope_village_id_fkey"
            columns: ["scope_village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
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
          notes: string | null
          password_reset_expires_at: string | null
          password_reset_token: string | null
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
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          is_whatsapp_same_as_mobile?: boolean | null
          kshetra_id?: string | null
          mandal_id?: string | null
          mandir_id?: string | null
          mobile_number: string
          notes?: string | null
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
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
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_whatsapp_same_as_mobile?: boolean | null
          kshetra_id?: string | null
          mandal_id?: string | null
          mandir_id?: string | null
          mobile_number?: string
          notes?: string | null
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
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
      role_hierarchy: {
        Row: {
          created_at: string
          id: string
          level: number
          parent_role: Database["public"]["Enums"]["user_role"] | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          parent_role?: Database["public"]["Enums"]["user_role"] | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          parent_role?: Database["public"]["Enums"]["user_role"] | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_hierarchy_parent_role_fkey"
            columns: ["parent_role"]
            isOneToOne: false
            referencedRelation: "role_hierarchy"
            referencedColumns: ["role"]
          },
        ]
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
          role: Database["public"]["Enums"]["user_role"]
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
          role: Database["public"]["Enums"]["user_role"]
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
          role?: Database["public"]["Enums"]["user_role"]
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
        Relationships: [
          {
            foreignKeyName: "user_location_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      check_hierarchy_permission: {
        Args: {
          _user_id: string
          _target_user_id: string
          _permission_type: string
        }
        Returns: boolean
      }
      check_user_permission: {
        Args: {
          _user_id: string
          _module_name: string
          _permission_type: string
        }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_role_display_name: {
        Args: { _role_name: string }
        Returns: string
      }
      get_user_hierarchy_level: {
        Args: { _user_id: string }
        Returns: number
      }
      is_user_participant_in_room: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      sync_custom_roles_with_enum: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_role_exists: {
        Args: { _role_name: string }
        Returns: boolean
      }
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
        | "admin"
        | "moderator"
        | "user"
        | "nirikshak"
        | "Bal_Sanyojak"
        | "bal_sanyojak"
        | "coordinator"
        | "volunteer"
        | "manager"
        | "Nirdeshak"
        | "sah_nirikshak"
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
        "admin",
        "moderator",
        "user",
        "nirikshak",
        "Bal_Sanyojak",
        "bal_sanyojak",
        "coordinator",
        "volunteer",
        "manager",
        "Nirdeshak",
        "sah_nirikshak",
      ],
    },
  },
} as const
