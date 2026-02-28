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
      bookings: {
        Row: {
          borrower_company_id: string
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          currency_code: string
          end_date: string
          funded_period_end: string | null
          id: string
          lender_company_id: string
          ot_terms_snapshot: Json | null
          payment_type: string
          primary_site_contact_id: string | null
          project_id: string
          service_fee_amount: number
          start_date: string
          status: string
          termination_notice_days: number | null
          total_amount: number
          updated_at: string | null
          work_order_id: string | null
          worker_id: string
          worker_payout_amount: number
        }
        Insert: {
          borrower_company_id: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          currency_code?: string
          end_date: string
          funded_period_end?: string | null
          id?: string
          lender_company_id: string
          ot_terms_snapshot?: Json | null
          payment_type: string
          primary_site_contact_id?: string | null
          project_id: string
          service_fee_amount?: number
          start_date: string
          status: string
          termination_notice_days?: number | null
          total_amount?: number
          updated_at?: string | null
          work_order_id?: string | null
          worker_id: string
          worker_payout_amount?: number
        }
        Update: {
          borrower_company_id?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          currency_code?: string
          end_date?: string
          funded_period_end?: string | null
          id?: string
          lender_company_id?: string
          ot_terms_snapshot?: Json | null
          payment_type?: string
          primary_site_contact_id?: string | null
          project_id?: string
          service_fee_amount?: number
          start_date?: string
          status?: string
          termination_notice_days?: number | null
          total_amount?: number
          updated_at?: string | null
          work_order_id?: string | null
          worker_id?: string
          worker_payout_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_borrower_company_id_fkey"
            columns: ["borrower_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lender_company_id_fkey"
            columns: ["lender_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_primary_site_contact_id_fkey"
            columns: ["primary_site_contact_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          borrower_company_id: string
          created_at: string | null
          end_date: string
          hourly_rate: number
          id: string
          start_date: string
          work_order_id: string
          worker_id: string
        }
        Insert: {
          borrower_company_id: string
          created_at?: string | null
          end_date: string
          hourly_rate: number
          id?: string
          start_date: string
          work_order_id: string
          worker_id: string
        }
        Update: {
          borrower_company_id?: string
          created_at?: string | null
          end_date?: string
          hourly_rate?: number
          id?: string
          start_date?: string
          work_order_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_borrower_company_id_fkey"
            columns: ["borrower_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cart_worker_profile"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          break_duration_minutes: number | null
          break_policy_type: string | null
          break_required_after_hours: number | null
          contact_phone: string | null
          created_at: string | null
          default_currency: string
          ein: string | null
          id: string
          kyb_status: string | null
          lunch_duration_minutes: number | null
          lunch_policy_type: string | null
          lunch_required_after_hours: number | null
          member_count: number | null
          min_billable_hours: number | null
          name: string
          no_show_fee_hours: number | null
          ot_rate_type: string | null
          ot_rule_daily: boolean | null
          ot_rule_weekend: boolean | null
          ot_rule_weekly: boolean | null
          strikes_count: number | null
          stripe_account_id: string | null
          tax_exempt_status: boolean | null
          trial_policy: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          break_duration_minutes?: number | null
          break_policy_type?: string | null
          break_required_after_hours?: number | null
          contact_phone?: string | null
          created_at?: string | null
          default_currency?: string
          ein?: string | null
          id?: string
          kyb_status?: string | null
          lunch_duration_minutes?: number | null
          lunch_policy_type?: string | null
          lunch_required_after_hours?: number | null
          member_count?: number | null
          min_billable_hours?: number | null
          name: string
          no_show_fee_hours?: number | null
          ot_rate_type?: string | null
          ot_rule_daily?: boolean | null
          ot_rule_weekend?: boolean | null
          ot_rule_weekly?: boolean | null
          strikes_count?: number | null
          stripe_account_id?: string | null
          tax_exempt_status?: boolean | null
          trial_policy?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          break_duration_minutes?: number | null
          break_policy_type?: string | null
          break_required_after_hours?: number | null
          contact_phone?: string | null
          created_at?: string | null
          default_currency?: string
          ein?: string | null
          id?: string
          kyb_status?: string | null
          lunch_duration_minutes?: number | null
          lunch_policy_type?: string | null
          lunch_required_after_hours?: number | null
          member_count?: number | null
          min_billable_hours?: number | null
          name?: string
          no_show_fee_hours?: number | null
          ot_rate_type?: string | null
          ot_rule_daily?: boolean | null
          ot_rule_weekend?: boolean | null
          ot_rule_weekly?: boolean | null
          strikes_count?: number | null
          stripe_account_id?: string | null
          tax_exempt_status?: boolean | null
          trial_policy?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_break_lunch_policies: {
        Row: {
          break_duration_minutes: number
          break_is_paid: boolean | null
          break_required_after_hours: number
          company_id: string
          created_at: string | null
          id: string
          jurisdiction_id: string
          lunch_duration_minutes: number
          lunch_is_paid: boolean | null
          lunch_required_after_hours: number
          updated_at: string | null
        }
        Insert: {
          break_duration_minutes: number
          break_is_paid?: boolean | null
          break_required_after_hours: number
          company_id: string
          created_at?: string | null
          id?: string
          jurisdiction_id: string
          lunch_duration_minutes: number
          lunch_is_paid?: boolean | null
          lunch_required_after_hours: number
          updated_at?: string | null
        }
        Update: {
          break_duration_minutes?: number
          break_is_paid?: boolean | null
          break_required_after_hours?: number
          company_id?: string
          created_at?: string | null
          id?: string
          jurisdiction_id?: string
          lunch_duration_minutes?: number
          lunch_is_paid?: boolean | null
          lunch_required_after_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_break_lunch_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_break_lunch_policies_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          company_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          roles: Json
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          roles?: Json
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          roles?: Json
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          company_id: string
          created_at: string | null
          document_url: string | null
          expiration_date: string
          id: string
          insurance_type: string
          is_active: boolean | null
          is_self_certified_by_lender: boolean | null
          updated_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_url?: string | null
          expiration_date: string
          id?: string
          insurance_type: string
          is_active?: boolean | null
          is_self_certified_by_lender?: boolean | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_url?: string | null
          expiration_date?: string
          id?: string
          insurance_type?: string
          is_active?: boolean | null
          is_self_certified_by_lender?: boolean | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdictions: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_sessions: {
        Row: {
          company_id: string | null
          completed: boolean | null
          created_at: string | null
          current_step: number
          expires_at: string | null
          id: string
          step_data: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          current_step?: number
          expires_at?: string | null
          id?: string
          step_data?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          current_step?: number
          expires_at?: string | null
          id?: string
          step_data?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string
          company_id: string
          created_at: string | null
          daily_start_time: string | null
          id: string
          jurisdiction_id: string | null
          lat: number | null
          lng: number | null
          meeting_instructions: string | null
          meeting_location_type: string | null
          name: string
          project_description: string | null
          timezone: string
          updated_at: string | null
        }
        Insert: {
          address: string
          company_id: string
          created_at?: string | null
          daily_start_time?: string | null
          id?: string
          jurisdiction_id?: string | null
          lat?: number | null
          lng?: number | null
          meeting_instructions?: string | null
          meeting_location_type?: string | null
          name?: string
          project_description?: string | null
          timezone: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          company_id?: string
          created_at?: string | null
          daily_start_time?: string | null
          id?: string
          jurisdiction_id?: string | null
          lat?: number | null
          lng?: number | null
          meeting_instructions?: string | null
          meeting_location_type?: string | null
          name?: string
          project_description?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_preference: string
          borrower_company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_checked_at: string | null
          name: string
          search_criteria: Json
          timezone: string
          updated_at: string | null
        }
        Insert: {
          alert_preference?: string
          borrower_company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          name: string
          search_criteria: Json
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          alert_preference?: string
          borrower_company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          name?: string
          search_criteria?: Json
          timezone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_borrower_company_id_fkey"
            columns: ["borrower_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          booking_id: string | null
          break_end: string | null
          break_start: string | null
          clock_in: string
          clock_out: string | null
          company_id: string
          created_at: string | null
          gps_clock_in: Json | null
          gps_clock_out: Json | null
          id: string
          notes: string | null
          project_id: string | null
          status: string
          total_break_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          break_end?: string | null
          break_start?: string | null
          clock_in?: string
          clock_out?: string | null
          company_id: string
          created_at?: string | null
          gps_clock_in?: Json | null
          gps_clock_out?: Json | null
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          total_break_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          break_end?: string | null
          break_start?: string | null
          clock_in?: string
          clock_out?: string | null
          company_id?: string
          created_at?: string | null
          gps_clock_in?: Json | null
          gps_clock_out?: Json | null
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          total_break_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_agreements: {
        Row: {
          agreement_type: string
          id: string
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          agreement_type: string
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          agreement_type?: string
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_agreements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          firebase_uid: string | null
          full_name: string | null
          id: string
          is_onboarded: boolean | null
          mobile_number: string | null
          password_hash: string | null
          stripe_identity_id: string | null
          updated_at: string | null
          user_state: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          firebase_uid?: string | null
          full_name?: string | null
          id: string
          is_onboarded?: boolean | null
          mobile_number?: string | null
          password_hash?: string | null
          stripe_identity_id?: string | null
          updated_at?: string | null
          user_state?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          firebase_uid?: string | null
          full_name?: string | null
          id?: string
          is_onboarded?: boolean | null
          mobile_number?: string | null
          password_hash?: string | null
          stripe_identity_id?: string | null
          updated_at?: string | null
          user_state?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          end_time: string
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          project_id: string
          quantity: number
          role: string
          start_date: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          end_time: string
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          project_id: string
          quantity?: number
          role: string
          start_date: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          end_time?: string
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          project_id?: string
          quantity?: number
          role?: string
          start_date?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_availability: {
        Row: {
          availability_mode: string
          blocked_dates: string[] | null
          company_id: string
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          recall_notice_days: number | null
          start_date: string | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          availability_mode: string
          blocked_dates?: string[] | null
          company_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          recall_notice_days?: number | null
          start_date?: string | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          availability_mode?: string
          blocked_dates?: string[] | null
          company_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          recall_notice_days?: number | null
          start_date?: string | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_availability_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_availability_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_profiles: {
        Row: {
          certifications: Json | null
          created_at: string | null
          earliest_start_time: string | null
          home_zip_code: string | null
          id: string
          languages: Json | null
          lat: number | null
          latest_start_time: string | null
          lng: number | null
          max_travel_distance_miles: number | null
          photo_url: string | null
          skills: Json | null
          tools_equipment: string | null
          trade: string | null
          travel_radius_miles: number | null
          updated_at: string | null
          user_id: string
          years_of_experience: Json | null
        }
        Insert: {
          certifications?: Json | null
          created_at?: string | null
          earliest_start_time?: string | null
          home_zip_code?: string | null
          id?: string
          languages?: Json | null
          lat?: number | null
          latest_start_time?: string | null
          lng?: number | null
          max_travel_distance_miles?: number | null
          photo_url?: string | null
          skills?: Json | null
          tools_equipment?: string | null
          trade?: string | null
          travel_radius_miles?: number | null
          updated_at?: string | null
          user_id: string
          years_of_experience?: Json | null
        }
        Update: {
          certifications?: Json | null
          created_at?: string | null
          earliest_start_time?: string | null
          home_zip_code?: string | null
          id?: string
          languages?: Json | null
          lat?: number | null
          latest_start_time?: string | null
          lng?: number | null
          max_travel_distance_miles?: number | null
          photo_url?: string | null
          skills?: Json | null
          tools_equipment?: string | null
          trade?: string | null
          travel_radius_miles?: number | null
          updated_at?: string | null
          user_id?: string
          years_of_experience?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_rates: {
        Row: {
          company_id: string
          created_at: string | null
          hourly_rate: number
          id: string
          overtime_rate: number | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          hourly_rate: number
          id?: string
          overtime_rate?: number | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          hourly_rate?: number
          id?: string
          overtime_rate?: number | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_rates_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      zip_codes: {
        Row: {
          city: string | null
          created_at: string | null
          latitude: number
          longitude: number
          state: string | null
          zip_code: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          latitude: number
          longitude: number
          state?: string | null
          zip_code: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          latitude?: number
          longitude?: number
          state?: string | null
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      firebase_uid: { Args: never; Returns: string }
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
