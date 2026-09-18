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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string | null
          created_at: string
          id: number
          send_user: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          send_user?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          send_user?: string
        }
        Relationships: []
      }
      credit_logs: {
        Row: {
          change: number
          created_at: string | null
          id: string
          meeting_id: string | null
          payment_id: string | null
          reason: string
          user_id: string | null
        }
        Insert: {
          change: number
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          payment_id?: string | null
          reason: string
          user_id?: string | null
        }
        Update: {
          change?: number
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          payment_id?: string | null
          reason?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_logs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          balance: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meeting_confirmations: {
        Row: {
          confirmed_at: string | null
          credit_log_id: string | null
          id: string
          meeting_id: string | null
          organization_credit_log_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          credit_log_id?: string | null
          id?: string
          meeting_id?: string | null
          organization_credit_log_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          credit_log_id?: string | null
          id?: string
          meeting_id?: string | null
          organization_credit_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_confirmations_credit_log_id_fkey"
            columns: ["credit_log_id"]
            isOneToOne: true
            referencedRelation: "credit_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_confirmations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_confirmations_organization_credit_log_id_fkey"
            columns: ["organization_credit_log_id"]
            isOneToOne: true
            referencedRelation: "organization_credit_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_reads: {
        Row: {
          last_notified_at: string | null
          last_read_at: string | null
          meeting_id: string
          user_id: string
        }
        Insert: {
          last_notified_at?: string | null
          last_read_at?: string | null
          meeting_id: string
          user_id: string
        }
        Update: {
          last_notified_at?: string | null
          last_read_at?: string | null
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_reads_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_schedules: {
        Row: {
          created_at: string | null
          date: string | null
          is_commit: boolean
          is_finished: boolean
          meeting_id: string
          time: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          is_commit?: boolean
          is_finished?: boolean
          meeting_id: string
          time?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          is_commit?: boolean
          is_finished?: boolean
          meeting_id?: string
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_schedules_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          actions_taken: string | null
          created_at: string
          description: string | null
          desired_outcome: string | null
          finish_requested_by: string | null
          id: string
          mentor: string | null
          title: string | null
          trouble_episode: string | null
          unresolved_issues: string | null
          user: string | null
        }
        Insert: {
          actions_taken?: string | null
          created_at?: string
          description?: string | null
          desired_outcome?: string | null
          finish_requested_by?: string | null
          id?: string
          mentor?: string | null
          title?: string | null
          trouble_episode?: string | null
          unresolved_issues?: string | null
          user?: string | null
        }
        Update: {
          actions_taken?: string | null
          created_at?: string
          description?: string | null
          desired_outcome?: string | null
          finish_requested_by?: string | null
          id?: string
          mentor?: string | null
          title?: string | null
          trouble_episode?: string | null
          unresolved_issues?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_mentor_fkey"
            columns: ["mentor"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_mentor_fkey"
            columns: ["mentor"]
            isOneToOne: false
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_user_fkey1"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_availabilities: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          mentor_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          mentor_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          mentor_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_availabilities_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_availabilities_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_balance_logs: {
        Row: {
          change: number
          created_at: string | null
          id: string
          meeting_id: string | null
          mentor_id: string | null
          reason: string
          transfer_id: string | null
        }
        Insert: {
          change: number
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          mentor_id?: string | null
          reason: string
          transfer_id?: string | null
        }
        Update: {
          change?: number
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          mentor_id?: string | null
          reason?: string
          transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_balance_logs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_balance_logs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_balance_logs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_balance_logs_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_balances: {
        Row: {
          balance: number
          id: string
          mentor_id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          id?: string
          mentor_id: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          id?: string
          mentor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_balances_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_balances_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_secret: {
        Row: {
          admin_allow: boolean
          created_at: string | null
          id: string
          stripe_account_id: string | null
          stripe_onboarding_completed: boolean
          transfer_rate: number | null
        }
        Insert: {
          admin_allow?: boolean
          created_at?: string | null
          id: string
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean
          transfer_rate?: number | null
        }
        Update: {
          admin_allow?: boolean
          created_at?: string | null
          id?: string
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean
          transfer_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_secret_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_secret_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_tags: {
        Row: {
          mentor_id: string
          tag_id: string
        }
        Insert: {
          mentor_id: string
          tag_id: string
        }
        Update: {
          mentor_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_tags_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_tags_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          bio: string | null
          created_at: string
          department: string | null
          faculty: string | null
          icon: string | null
          id: string
          is_allowed: boolean | null
          name: string | null
          quote: string | null
          region: string | null
          university: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department?: string | null
          faculty?: string | null
          icon?: string | null
          id: string
          is_allowed?: boolean | null
          name?: string | null
          quote?: string | null
          region?: string | null
          university?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          department?: string | null
          faculty?: string | null
          icon?: string | null
          id?: string
          is_allowed?: boolean | null
          name?: string | null
          quote?: string | null
          region?: string | null
          university?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          meeting_id: string | null
          sender_id: string | null
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          meeting_id?: string | null
          sender_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          meeting_id?: string | null
          sender_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_credit_logs: {
        Row: {
          change: number
          created_at: string
          granted_by: string | null
          id: string
          meeting_id: string | null
          organization_id: string
          reason: string
          spent_by: string | null
        }
        Insert: {
          change: number
          created_at?: string
          granted_by?: string | null
          id?: string
          meeting_id?: string | null
          organization_id: string
          reason: string
          spent_by?: string | null
        }
        Update: {
          change?: number
          created_at?: string
          granted_by?: string | null
          id?: string
          meeting_id?: string | null
          organization_id?: string
          reason?: string
          spent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_credit_logs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_credit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_credits: {
        Row: {
          balance: number
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_credits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_join_requests: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          id: string
          organization_id: string
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          organization_id: string
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          organization_id?: string
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          credit_limit: number | null
          credits_used: number
          id: string
          joined_at: string
          organization_id: string
          removed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          credit_limit?: number | null
          credits_used?: number
          id?: string
          joined_at?: string
          organization_id: string
          removed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          credit_limit?: number | null
          credits_used?: number
          id?: string
          joined_at?: string
          organization_id?: string
          removed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_owners: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          join_code: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          join_code: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          join_code?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          credits_granted: number
          id: string
          status: string
          stripe_payment_intent_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          credits_granted?: number
          id?: string
          status: string
          stripe_payment_intent_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          credits_granted?: number
          id?: string
          status?: string
          stripe_payment_intent_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          set: boolean | null
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          set?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          set?: boolean | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      review_sum: {
        Row: {
          count_1star: number
          count_2star: number
          count_3star: number
          count_4star: number
          count_5star: number
          id: string
          mentor_id: string
          star_avg: number
          star_sum: number
          total_count: number
          updated_at: string | null
        }
        Insert: {
          count_1star?: number
          count_2star?: number
          count_3star?: number
          count_4star?: number
          count_5star?: number
          id?: string
          mentor_id: string
          star_avg?: number
          star_sum?: number
          total_count?: number
          updated_at?: string | null
        }
        Update: {
          count_1star?: number
          count_2star?: number
          count_3star?: number
          count_4star?: number
          count_5star?: number
          id?: string
          mentor_id?: string
          star_avg?: number
          star_sum?: number
          total_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_sum_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_sum_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comments: string | null
          created_at: string | null
          id: string
          meeting_id: string
          mentor_id: string
          stars: number
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          id?: string
          meeting_id: string
          mentor_id: string
          stars: number
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string
          mentor_id?: string
          stars?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number
          created_at: string | null
          error_reason: string | null
          id: string
          mentor_id: string | null
          payout_fee: number
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          error_reason?: string | null
          id?: string
          mentor_id?: string | null
          payout_fee?: number
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          error_reason?: string | null
          id?: string
          mentor_id?: string | null
          payout_fee?: number
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "public_mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          customer_id: string | null
          desire: string | null
          grade: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          desire?: string | null
          grade?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          desire?: string | null
          grade?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_mentors: {
        Row: {
          bio: string | null
          created_at: string | null
          department: string | null
          faculty: string | null
          icon: string | null
          id: string | null
          name: string | null
          quote: string | null
          region: string | null
          university: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_join_request: {
        Args: { p_decided_by: string; p_request_id: string }
        Returns: undefined
      }
      consume_credit: {
        Args: { p_meeting_id: string; p_user_id: string }
        Returns: undefined
      }
      consume_organization_credit: {
        Args: {
          p_meeting_id: string
          p_organization_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      email_exists: { Args: { check_email: string }; Returns: boolean }
      find_organization_by_join_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      find_user_id_by_email: { Args: { check_email: string }; Returns: string }
    }
    Enums: {
      mentor_region: "A" | "B" | "C" | "D" | "E" | "F"
      methods:
        | "一般入試（前期）"
        | "一般入試（後期）"
        | "共通テスト利用"
        | "総合型選抜（旧AO入試）"
        | "学校推薦型選抜（旧推薦入試）"
        | "その他"
      user_role: "pending" | "user" | "mentor" | "admin" | "organization"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      mentor_region: ["A", "B", "C", "D", "E", "F"],
      methods: [
        "一般入試（前期）",
        "一般入試（後期）",
        "共通テスト利用",
        "総合型選抜（旧AO入試）",
        "学校推薦型選抜（旧推薦入試）",
        "その他",
      ],
      user_role: ["pending", "user", "mentor", "admin", "organization"],
    },
  },
} as const
