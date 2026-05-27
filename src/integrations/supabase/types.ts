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
      certificates: {
        Row: {
          company_id: string
          id: string
          issued_at: string
          level: string
          pdf_url: string | null
          score: number
          seller_id: string
          verification_url: string | null
        }
        Insert: {
          company_id: string
          id?: string
          issued_at?: string
          level: string
          pdf_url?: string | null
          score: number
          seller_id: string
          verification_url?: string | null
        }
        Update: {
          company_id?: string
          id?: string
          issued_at?: string
          level?: string
          pdf_url?: string | null
          score?: number
          seller_id?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      client_archetypes: {
        Row: {
          base_prompt: string
          buying_signal_style: string
          created_at: string
          difficulty_base: number
          id: string
          is_boss_eligible: boolean
          objection_patterns: Json
          type: string
          variations: Json
          worlds_available: number[]
        }
        Insert: {
          base_prompt: string
          buying_signal_style: string
          created_at?: string
          difficulty_base: number
          id?: string
          is_boss_eligible?: boolean
          objection_patterns?: Json
          type: string
          variations?: Json
          worlds_available?: number[]
        }
        Update: {
          base_prompt?: string
          buying_signal_style?: string
          created_at?: string
          difficulty_base?: number
          id?: string
          is_boss_eligible?: boolean
          objection_patterns?: Json
          type?: string
          variations?: Json
          worlds_available?: number[]
        }
        Relationships: []
      }
      client_names: {
        Row: {
          avatar_style: string
          created_at: string
          gender: string
          id: string
          name: string
        }
        Insert: {
          avatar_style: string
          created_at?: string
          gender: string
          id?: string
          name: string
        }
        Update: {
          avatar_style?: string
          created_at?: string
          gender?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          company_sales_brain: Json | null
          created_at: string
          credits_per_month: number
          id: string
          name: string
          onboarding_completed: boolean
          plan: string
          slug: string | null
        }
        Insert: {
          company_sales_brain?: Json | null
          created_at?: string
          credits_per_month?: number
          id?: string
          name: string
          onboarding_completed?: boolean
          plan?: string
          slug?: string | null
        }
        Update: {
          company_sales_brain?: Json | null
          created_at?: string
          credits_per_month?: number
          id?: string
          name?: string
          onboarding_completed?: boolean
          plan?: string
          slug?: string | null
        }
        Relationships: []
      }
      company_invites: {
        Row: {
          code: string
          company_id: string
          created_at: string
          email: string | null
          expires_at: string
          failed_attempts: number
          id: string
          locked_until: string | null
          used: boolean
          used_by: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          email?: string | null
          expires_at?: string
          failed_attempts?: number
          id?: string
          locked_until?: string | null
          used?: boolean
          used_by?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          failed_attempts?: number
          id?: string
          locked_until?: string | null
          used?: boolean
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_onboarding_answers: {
        Row: {
          answer: string | null
          block_number: number
          company_id: string
          created_at: string
          id: string
          question_id: string
          question_text: string | null
        }
        Insert: {
          answer?: string | null
          block_number: number
          company_id: string
          created_at?: string
          id?: string
          question_id: string
          question_text?: string | null
        }
        Update: {
          answer?: string | null
          block_number?: number
          company_id?: string
          created_at?: string
          id?: string
          question_id?: string
          question_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_onboarding_answers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_usage: {
        Row: {
          company_id: string
          created_at: string
          credits_used: number
          date: string
          id: string
          seller_id: string
          sessions_count: number
        }
        Insert: {
          company_id: string
          created_at?: string
          credits_used?: number
          date?: string
          id?: string
          seller_id: string
          sessions_count?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          credits_used?: number
          date?: string
          id?: string
          seller_id?: string
          sessions_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_usage_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_comments: {
        Row: {
          comment: string
          company_id: string
          created_at: string
          id: string
          manager_id: string
          seller_id: string
          session_id: string
          turn_number: number | null
        }
        Insert: {
          comment: string
          company_id: string
          created_at?: string
          id?: string
          manager_id: string
          seller_id: string
          session_id: string
          turn_number?: number | null
        }
        Update: {
          comment?: string
          company_id?: string
          created_at?: string
          id?: string
          manager_id?: string
          seller_id?: string
          session_id?: string
          turn_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_comments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_comments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_comments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      node_cards: {
        Row: {
          body: string
          card_content_type: string
          card_order: number
          card_type: string
          created_at: string
          flip_back_text: string | null
          id: string
          node_id: string
          title: string | null
        }
        Insert: {
          body: string
          card_content_type?: string
          card_order: number
          card_type: string
          created_at?: string
          flip_back_text?: string | null
          id?: string
          node_id: string
          title?: string | null
        }
        Update: {
          body?: string
          card_content_type?: string
          card_order?: number
          card_type?: string
          created_at?: string
          flip_back_text?: string | null
          id?: string
          node_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "node_cards_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      node_progress: {
        Row: {
          company_id: string
          consistency_score: number
          created_at: string
          id: string
          last_practiced_at: string | null
          node_id: string
          reps_completed: number
          seller_id: string
          sessions_count: number
          stars: number
          status: string
        }
        Insert: {
          company_id: string
          consistency_score?: number
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          node_id: string
          reps_completed?: number
          seller_id: string
          sessions_count?: number
          stars?: number
          status?: string
        }
        Update: {
          company_id?: string
          consistency_score?: number
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          node_id?: string
          reps_completed?: number
          seller_id?: string
          sessions_count?: number
          stars?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_progress_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_progress_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      node_quiz_questions: {
        Row: {
          correct_option: string
          created_at: string
          explanation_correct: string
          explanation_wrong: string
          id: string
          node_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order: number
          question_text: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          explanation_correct: string
          explanation_wrong: string
          id?: string
          node_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order: number
          question_text: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          explanation_correct?: string
          explanation_wrong?: string
          id?: string
          node_id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_order?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_quiz_questions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      node_skills: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          node_id: string
          relation: string
          skill_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          node_id: string
          relation: string
          skill_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          node_id?: string
          relation?: string
          skill_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "node_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          boss_goal: string | null
          checkpoints: Json | null
          conversation_scope: string | null
          description: string | null
          difficulty_level: number
          engine_type: string | null
          field_mission: string | null
          id: string
          is_boss: boolean
          name: string
          node_type: string
          order_index: number
          practice_script: Json | null
          reps_required: number
          technique: string | null
          world_id: number
        }
        Insert: {
          boss_goal?: string | null
          checkpoints?: Json | null
          conversation_scope?: string | null
          description?: string | null
          difficulty_level?: number
          engine_type?: string | null
          field_mission?: string | null
          id: string
          is_boss?: boolean
          name: string
          node_type?: string
          order_index: number
          practice_script?: Json | null
          reps_required?: number
          technique?: string | null
          world_id: number
        }
        Update: {
          boss_goal?: string | null
          checkpoints?: Json | null
          conversation_scope?: string | null
          description?: string | null
          difficulty_level?: number
          engine_type?: string | null
          field_mission?: string | null
          id?: string
          is_boss?: boolean
          name?: string
          node_type?: string
          order_index?: number
          practice_script?: Json | null
          reps_required?: number
          technique?: string | null
          world_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "nodes_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_classifications: {
        Row: {
          company_id: string
          created_at: string
          flags: string[] | null
          id: string
          session_id: string
          speaker: string
          stage: string | null
          turn_number: number
        }
        Insert: {
          company_id: string
          created_at?: string
          flags?: string[] | null
          id?: string
          session_id: string
          speaker: string
          stage?: string | null
          turn_number: number
        }
        Update: {
          company_id?: string
          created_at?: string
          flags?: string[] | null
          id?: string
          session_id?: string
          speaker?: string
          stage?: string | null
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "pitch_classifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_classifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          ai_summary: string | null
          audio_url: string | null
          company_id: string
          created_at: string
          credits_consumed: number | null
          id: string
          interruption_count: number
          is_boss_level: boolean
          is_first_of_world: boolean
          manually_saved: boolean
          mission_generated: string | null
          node_id: string | null
          pitch_stage_reached: string | null
          practice_type: string | null
          score: number | null
          score_breakdown: Json | null
          seller_id: string
          transcript: string | null
          world_id: number | null
        }
        Insert: {
          ai_summary?: string | null
          audio_url?: string | null
          company_id: string
          created_at?: string
          credits_consumed?: number | null
          id?: string
          interruption_count?: number
          is_boss_level?: boolean
          is_first_of_world?: boolean
          manually_saved?: boolean
          mission_generated?: string | null
          node_id?: string | null
          pitch_stage_reached?: string | null
          practice_type?: string | null
          score?: number | null
          score_breakdown?: Json | null
          seller_id: string
          transcript?: string | null
          world_id?: number | null
        }
        Update: {
          ai_summary?: string | null
          audio_url?: string | null
          company_id?: string
          created_at?: string
          credits_consumed?: number | null
          id?: string
          interruption_count?: number
          is_boss_level?: boolean
          is_first_of_world?: boolean
          manually_saved?: boolean
          mission_generated?: string | null
          node_id?: string | null
          pitch_stage_reached?: string | null
          practice_type?: string | null
          score?: number | null
          score_breakdown?: Json | null
          seller_id?: string
          transcript?: string | null
          world_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_archetype_performance: {
        Row: {
          archetype_id: string
          avg_score: number
          company_id: string
          consecutive_above_avg: number
          consecutive_below_avg: number
          created_at: string
          id: string
          improvement_trend: string
          is_in_reinforcement_mode: boolean
          last_practiced_at: string | null
          last_score: number | null
          seller_id: string
          sessions_count: number
          times_assigned: number
        }
        Insert: {
          archetype_id: string
          avg_score?: number
          company_id: string
          consecutive_above_avg?: number
          consecutive_below_avg?: number
          created_at?: string
          id?: string
          improvement_trend?: string
          is_in_reinforcement_mode?: boolean
          last_practiced_at?: string | null
          last_score?: number | null
          seller_id: string
          sessions_count?: number
          times_assigned?: number
        }
        Update: {
          archetype_id?: string
          avg_score?: number
          company_id?: string
          consecutive_above_avg?: number
          consecutive_below_avg?: number
          created_at?: string
          id?: string
          improvement_trend?: string
          is_in_reinforcement_mode?: boolean
          last_practiced_at?: string | null
          last_score?: number | null
          seller_id?: string
          sessions_count?: number
          times_assigned?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_archetype_performance_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "client_archetypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_archetype_performance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_archetype_performance_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_arsenal: {
        Row: {
          bullet_text: string
          bullet_type: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          seller_id: string
          success_rate: number
          times_used: number
        }
        Insert: {
          bullet_text: string
          bullet_type: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          seller_id: string
          success_rate?: number
          times_used?: number
        }
        Update: {
          bullet_text?: string
          bullet_type?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          seller_id?: string
          success_rate?: number
          times_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_arsenal_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_arsenal_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_memory: {
        Row: {
          coach_notes: string | null
          company_id: string
          id: string
          progress_summary: string | null
          repeated_errors: string[] | null
          seller_id: string
          stealth_diagnostics: Json | null
          strengths: string[] | null
          updated_at: string
          weaknesses: string[] | null
        }
        Insert: {
          coach_notes?: string | null
          company_id: string
          id?: string
          progress_summary?: string | null
          repeated_errors?: string[] | null
          seller_id: string
          stealth_diagnostics?: Json | null
          strengths?: string[] | null
          updated_at?: string
          weaknesses?: string[] | null
        }
        Update: {
          coach_notes?: string | null
          company_id?: string
          id?: string
          progress_summary?: string | null
          repeated_errors?: string[] | null
          seller_id?: string
          stealth_diagnostics?: Json | null
          strengths?: string[] | null
          updated_at?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_memory_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_skill_state: {
        Row: {
          company_id: string
          created_at: string
          current_score: number
          evaluations_count: number
          id: string
          last_evaluated_at: string | null
          last_evidence: Json | null
          mastered: boolean
          mastered_at: string | null
          recurring_errors: Json
          reinforcement_needed: boolean
          reinforcement_reason: string | null
          seller_id: string
          skill_id: string
          trend: string
          unlocked_concepts: Json
          updated_at: string
          xp_in_skill: number
        }
        Insert: {
          company_id: string
          created_at?: string
          current_score?: number
          evaluations_count?: number
          id?: string
          last_evaluated_at?: string | null
          last_evidence?: Json | null
          mastered?: boolean
          mastered_at?: string | null
          recurring_errors?: Json
          reinforcement_needed?: boolean
          reinforcement_reason?: string | null
          seller_id: string
          skill_id: string
          trend?: string
          unlocked_concepts?: Json
          updated_at?: string
          xp_in_skill?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          current_score?: number
          evaluations_count?: number
          id?: string
          last_evaluated_at?: string | null
          last_evidence?: Json | null
          mastered?: boolean
          mastered_at?: string | null
          recurring_errors?: Json
          reinforcement_needed?: boolean
          reinforcement_reason?: string | null
          seller_id?: string
          skill_id?: string
          trend?: string
          unlocked_concepts?: Json
          updated_at?: string
          xp_in_skill?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_skill_state_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          company_id: string
          created_at: string
          credits_used_this_month: number
          current_level: string
          current_node: string
          current_world: number
          declaration: string | null
          experience_level: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_practice_date: string | null
          main_challenge: string | null
          map_tutorial_completed: boolean
          onboarding_completed: boolean
          profile_id: string
          streak_days: number
          xp_total: number
        }
        Insert: {
          company_id: string
          created_at?: string
          credits_used_this_month?: number
          current_level?: string
          current_node?: string
          current_world?: number
          declaration?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_practice_date?: string | null
          main_challenge?: string | null
          map_tutorial_completed?: boolean
          onboarding_completed?: boolean
          profile_id: string
          streak_days?: number
          xp_total?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          credits_used_this_month?: number
          current_level?: string
          current_node?: string
          current_world?: number
          declaration?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_practice_date?: string | null
          main_challenge?: string | null
          map_tutorial_completed?: boolean
          onboarding_completed?: boolean
          profile_id?: string
          streak_days?: number
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sellers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_evaluations: {
        Row: {
          company_id: string
          created_at: string
          evaluator_version: string
          failure_hits: Json
          id: string
          node_id: string | null
          notes_for_seller: string | null
          notes_internal: string | null
          score: number
          seller_id: string
          session_id: string
          skill_id: string
          success_hits: Json
          verdict: string
        }
        Insert: {
          company_id: string
          created_at?: string
          evaluator_version?: string
          failure_hits?: Json
          id?: string
          node_id?: string | null
          notes_for_seller?: string | null
          notes_internal?: string | null
          score: number
          seller_id: string
          session_id: string
          skill_id: string
          success_hits?: Json
          verdict: string
        }
        Update: {
          company_id?: string
          created_at?: string
          evaluator_version?: string
          failure_hits?: Json
          id?: string
          node_id?: string | null
          notes_for_seller?: string | null
          notes_internal?: string | null
          score?: number
          seller_id?: string
          session_id?: string
          skill_id?: string
          success_hits?: Json
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_evaluations_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          code: string
          created_at: string
          default_allowed_concepts: Json
          default_forbidden_concepts: Json
          failure_signals: Json
          id: string
          level_required: string
          mastery_threshold: number
          name: string
          parent_skill_id: string | null
          reinforcement_threshold: number
          short_description: string | null
          success_signals: Json
          world_id_introduced: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          default_allowed_concepts?: Json
          default_forbidden_concepts?: Json
          failure_signals?: Json
          id: string
          level_required?: string
          mastery_threshold?: number
          name: string
          parent_skill_id?: string | null
          reinforcement_threshold?: number
          short_description?: string | null
          success_signals?: Json
          world_id_introduced: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          default_allowed_concepts?: Json
          default_forbidden_concepts?: Json
          failure_signals?: Json
          id?: string
          level_required?: string
          mastery_threshold?: number
          name?: string
          parent_skill_id?: string | null
          reinforcement_threshold?: number
          short_description?: string | null
          success_signals?: Json
          world_id_introduced?: number
        }
        Relationships: [
          {
            foreignKeyName: "skills_parent_skill_id_fkey"
            columns: ["parent_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      worlds: {
        Row: {
          boss_level_description: string | null
          boss_level_name: string | null
          color: string | null
          description: string | null
          emotional_name: string | null
          icon: string | null
          id: number
          name: string
          order_index: number
        }
        Insert: {
          boss_level_description?: string | null
          boss_level_name?: string | null
          color?: string | null
          description?: string | null
          emotional_name?: string | null
          icon?: string | null
          id: number
          name: string
          order_index: number
        }
        Update: {
          boss_level_description?: string | null
          boss_level_name?: string | null
          color?: string | null
          description?: string | null
          emotional_name?: string | null
          icon?: string | null
          id?: number
          name?: string
          order_index?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_invite_code: { Args: { _code: string }; Returns: Json }
      consume_credits: {
        Args: { _seller_id: string; _session_type: string }
        Returns: Json
      }
      create_company_for_manager: { Args: { _name: string }; Returns: Json }
      current_company_id: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      generate_company_invite: { Args: never; Returns: Json }
      get_active_company_invite: { Args: never; Returns: Json }
      is_manager: { Args: never; Returns: boolean }
      owns_seller: { Args: { _seller_id: string }; Returns: boolean }
      register_invite_failed_attempt: {
        Args: { _code: string }
        Returns: undefined
      }
      save_onboarding_answer: {
        Args: {
          _answer: string
          _block_number: number
          _question_id: string
          _question_text: string
        }
        Returns: undefined
      }
      select_archetype_for_session: {
        Args: { _node_id: string; _seller_id: string; _world_id: number }
        Returns: string
      }
      update_company_brain: { Args: { _brain: Json }; Returns: Json }
      validate_invite_code: { Args: { _code: string }; Returns: Json }
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
