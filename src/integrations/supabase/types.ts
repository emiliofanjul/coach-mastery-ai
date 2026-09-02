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
      archivo_mentalidad_cards: {
        Row: {
          audience: string | null
          body: string | null
          card_content_type: string | null
          card_order: number | null
          card_type: string | null
          created_at: string | null
          flip_back_text: string | null
          id: string | null
          node_id: string | null
          skill_ids: string[] | null
          title: string | null
        }
        Insert: {
          audience?: string | null
          body?: string | null
          card_content_type?: string | null
          card_order?: number | null
          card_type?: string | null
          created_at?: string | null
          flip_back_text?: string | null
          id?: string | null
          node_id?: string | null
          skill_ids?: string[] | null
          title?: string | null
        }
        Update: {
          audience?: string | null
          body?: string | null
          card_content_type?: string | null
          card_order?: number | null
          card_type?: string | null
          created_at?: string | null
          flip_back_text?: string | null
          id?: string | null
          node_id?: string | null
          skill_ids?: string[] | null
          title?: string | null
        }
        Relationships: []
      }
      archivo_mentalidad_nodes: {
        Row: {
          boss_goal: string | null
          checkpoints: Json | null
          conversation_scope: string | null
          description: string | null
          difficulty_level: number | null
          engine_type: string | null
          field_mission: string | null
          id: string | null
          is_boss: boolean | null
          name: string | null
          node_type: string | null
          order_index: number | null
          practice_script: Json | null
          reps_required: number | null
          technique: string | null
          world_id: number | null
        }
        Insert: {
          boss_goal?: string | null
          checkpoints?: Json | null
          conversation_scope?: string | null
          description?: string | null
          difficulty_level?: number | null
          engine_type?: string | null
          field_mission?: string | null
          id?: string | null
          is_boss?: boolean | null
          name?: string | null
          node_type?: string | null
          order_index?: number | null
          practice_script?: Json | null
          reps_required?: number | null
          technique?: string | null
          world_id?: number | null
        }
        Update: {
          boss_goal?: string | null
          checkpoints?: Json | null
          conversation_scope?: string | null
          description?: string | null
          difficulty_level?: number | null
          engine_type?: string | null
          field_mission?: string | null
          id?: string | null
          is_boss?: boolean | null
          name?: string | null
          node_type?: string | null
          order_index?: number | null
          practice_script?: Json | null
          reps_required?: number | null
          technique?: string | null
          world_id?: number | null
        }
        Relationships: []
      }
      archivo_mentalidad_quiz: {
        Row: {
          correct_option: string | null
          created_at: string | null
          explanation_correct: string | null
          explanation_wrong: string | null
          id: string | null
          node_id: string | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question_order: number | null
          question_text: string | null
        }
        Insert: {
          correct_option?: string | null
          created_at?: string | null
          explanation_correct?: string | null
          explanation_wrong?: string | null
          id?: string | null
          node_id?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_order?: number | null
          question_text?: string | null
        }
        Update: {
          correct_option?: string | null
          created_at?: string | null
          explanation_correct?: string | null
          explanation_wrong?: string | null
          id?: string | null
          node_id?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_order?: number | null
          question_text?: string | null
        }
        Relationships: []
      }
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
      coach_recommendations: {
        Row: {
          company_id: string
          created_at: string
          events_considered: number
          fortaleza: string | null
          id: string
          input_summary: Json | null
          last_event_id: string | null
          model: string
          notes_considered: number
          plan: Json
          prioridad: string
          prompt_version: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          events_considered?: number
          fortaleza?: string | null
          id?: string
          input_summary?: Json | null
          last_event_id?: string | null
          model: string
          notes_considered?: number
          plan?: Json
          prioridad: string
          prompt_version?: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          events_considered?: number
          fortaleza?: string | null
          id?: string
          input_summary?: Json | null
          last_event_id?: string | null
          model?: string
          notes_considered?: number
          plan?: Json
          prioridad?: string
          prompt_version?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_recommendations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_recommendations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          brain_updated_at: string | null
          company_sales_brain: Json | null
          created_at: string
          credits_per_month: number
          id: string
          industry: string | null
          is_personal: boolean
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          plan: string
          slug: string | null
        }
        Insert: {
          brain_updated_at?: string | null
          company_sales_brain?: Json | null
          created_at?: string
          credits_per_month?: number
          id?: string
          industry?: string | null
          is_personal?: boolean
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean
          plan?: string
          slug?: string | null
        }
        Update: {
          brain_updated_at?: string | null
          company_sales_brain?: Json | null
          created_at?: string
          credits_per_month?: number
          id?: string
          industry?: string | null
          is_personal?: boolean
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          plan?: string
          slug?: string | null
        }
        Relationships: []
      }
      company_brain_versions: {
        Row: {
          brain: Json
          company_id: string
          created_at: string
          edited_by: string | null
          id: string
        }
        Insert: {
          brain: Json
          company_id: string
          created_at?: string
          edited_by?: string | null
          id?: string
        }
        Update: {
          brain?: Json
          company_id?: string
          created_at?: string
          edited_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_brain_versions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invites: {
        Row: {
          code: string
          company_id: string
          created_at: string
          created_by: string | null
          duration_hours: number | null
          email: string | null
          expires_at: string
          failed_attempts: number
          id: string
          locked_until: string | null
          revoked_at: string | null
          used: boolean
          used_by: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          created_by?: string | null
          duration_hours?: number | null
          email?: string | null
          expires_at?: string
          failed_attempts?: number
          id?: string
          locked_until?: string | null
          revoked_at?: string | null
          used?: boolean
          used_by?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          duration_hours?: number | null
          email?: string | null
          expires_at?: string
          failed_attempts?: number
          id?: string
          locked_until?: string | null
          revoked_at?: string | null
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
            foreignKeyName: "company_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      company_pitches: {
        Row: {
          channel: string
          client_type: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          missing_data: Json
          published_at: string | null
          relationship: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          channel?: string
          client_type: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          missing_data?: Json
          published_at?: string | null
          relationship?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          channel?: string
          client_type?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          missing_data?: Json
          published_at?: string | null
          relationship?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_pitches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_pitches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      director_decisions: {
        Row: {
          classifier_ran: boolean | null
          created_at: string
          cut_reason: string | null
          decision: string
          director_version: string | null
          elapsed_seconds: number | null
          evidence_sufficient: boolean | null
          id: string
          latency_ms: number | null
          node_id: string | null
          scope_covered: boolean | null
          session_id: string | null
          user_turns: number | null
        }
        Insert: {
          classifier_ran?: boolean | null
          created_at?: string
          cut_reason?: string | null
          decision: string
          director_version?: string | null
          elapsed_seconds?: number | null
          evidence_sufficient?: boolean | null
          id?: string
          latency_ms?: number | null
          node_id?: string | null
          scope_covered?: boolean | null
          session_id?: string | null
          user_turns?: number | null
        }
        Update: {
          classifier_ran?: boolean | null
          created_at?: string
          cut_reason?: string | null
          decision?: string
          director_version?: string | null
          elapsed_seconds?: number | null
          evidence_sufficient?: boolean | null
          id?: string
          latency_ms?: number | null
          node_id?: string | null
          scope_covered?: boolean | null
          session_id?: string | null
          user_turns?: number | null
        }
        Relationships: []
      }
      doctrina: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          order_index: number
          section_key: string
          title: string
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          order_index: number
          section_key: string
          title: string
          version: number
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          section_key?: string
          title?: string
          version?: number
        }
        Relationships: []
      }
      invite_attempts: {
        Row: {
          actor_id: string | null
          code: string
          created_at: string
          id: string
          outcome: string
        }
        Insert: {
          actor_id?: string | null
          code: string
          created_at?: string
          id?: string
          outcome: string
        }
        Update: {
          actor_id?: string | null
          code?: string
          created_at?: string
          id?: string
          outcome?: string
        }
        Relationships: []
      }
      llm_calls: {
        Row: {
          analisis_turnos: Json | null
          cache_creation_tokens: number | null
          cached_tokens: number | null
          company_id: string | null
          created_at: string
          event_id: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string | null
          output_tokens: number | null
          phase: string
          prompt_version: string | null
          seller_id: string | null
          session_id: string | null
        }
        Insert: {
          analisis_turnos?: Json | null
          cache_creation_tokens?: number | null
          cached_tokens?: number | null
          company_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          phase: string
          prompt_version?: string | null
          seller_id?: string | null
          session_id?: string | null
        }
        Update: {
          analisis_turnos?: Json | null
          cache_creation_tokens?: number | null
          cached_tokens?: number | null
          company_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          phase?: string
          prompt_version?: string | null
          seller_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_calls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "seller_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_calls_seller_id_fkey"
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
          audience: string | null
          body: string
          card_content_type: string
          card_order: number
          card_type: string
          created_at: string
          flip_back_text: string | null
          id: string
          node_id: string
          skill_ids: string[]
          title: string | null
        }
        Insert: {
          audience?: string | null
          body: string
          card_content_type?: string
          card_order: number
          card_type: string
          created_at?: string
          flip_back_text?: string | null
          id?: string
          node_id: string
          skill_ids?: string[]
          title?: string | null
        }
        Update: {
          audience?: string | null
          body?: string
          card_content_type?: string
          card_order?: number
          card_type?: string
          created_at?: string
          flip_back_text?: string | null
          id?: string
          node_id?: string
          skill_ids?: string[]
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
          option_d: string | null
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
          option_d?: string | null
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
          option_d?: string | null
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
      pitch_feedback: {
        Row: {
          classification: string | null
          closer_response: string | null
          created_at: string
          id: string
          manager_message: string | null
          outcome: string | null
          pitch_id: string
          section_id: string | null
        }
        Insert: {
          classification?: string | null
          closer_response?: string | null
          created_at?: string
          id?: string
          manager_message?: string | null
          outcome?: string | null
          pitch_id: string
          section_id?: string | null
        }
        Update: {
          classification?: string | null
          closer_response?: string | null
          created_at?: string
          id?: string
          manager_message?: string | null
          outcome?: string | null
          pitch_id?: string
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_feedback_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "company_pitches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_feedback_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_version_integrity"
            referencedColumns: ["pitch_id"]
          },
          {
            foreignKeyName: "pitch_feedback_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "pitch_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_sections: {
        Row: {
          alternatives: Json
          content: string | null
          created_at: string
          edited_by_manager: boolean
          id: string
          is_stale: boolean
          order_index: number
          pitch_id: string
          prompt_version: string | null
          rationale_long: string | null
          rationale_short: string | null
          section_key: string
          section_kind: string
          skill_ids: string[]
          stale_reason: string | null
          step: number
          warning: string | null
        }
        Insert: {
          alternatives?: Json
          content?: string | null
          created_at?: string
          edited_by_manager?: boolean
          id?: string
          is_stale?: boolean
          order_index: number
          pitch_id: string
          prompt_version?: string | null
          rationale_long?: string | null
          rationale_short?: string | null
          section_key: string
          section_kind?: string
          skill_ids?: string[]
          stale_reason?: string | null
          step: number
          warning?: string | null
        }
        Update: {
          alternatives?: Json
          content?: string | null
          created_at?: string
          edited_by_manager?: boolean
          id?: string
          is_stale?: boolean
          order_index?: number
          pitch_id?: string
          prompt_version?: string | null
          rationale_long?: string | null
          rationale_short?: string | null
          section_key?: string
          section_kind?: string
          skill_ids?: string[]
          stale_reason?: string | null
          step?: number
          warning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_sections_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "company_pitches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_sections_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_version_integrity"
            referencedColumns: ["pitch_id"]
          },
        ]
      }
      pitch_versions: {
        Row: {
          id: string
          pitch_id: string
          published_at: string
          published_by: string | null
          snapshot: Json
          version: number
        }
        Insert: {
          id?: string
          pitch_id: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          version: number
        }
        Update: {
          id?: string
          pitch_id?: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pitch_versions_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "company_pitches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_versions_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_version_integrity"
            referencedColumns: ["pitch_id"]
          },
          {
            foreignKeyName: "pitch_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          ai_summary: string | null
          audio_url: string | null
          company_id: string
          conversation_history: Json | null
          created_at: string
          credits_consumed: number | null
          end_reason: string | null
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
          conversation_history?: Json | null
          created_at?: string
          credits_consumed?: number | null
          end_reason?: string | null
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
          conversation_history?: Json | null
          created_at?: string
          credits_consumed?: number | null
          end_reason?: string | null
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
      seller_events: {
        Row: {
          audio_url: string | null
          created_at: string
          event_type: string
          id: string
          model: string | null
          node_id: string | null
          payload: Json
          prompt_version: string | null
          script_version: string | null
          seller_id: string
          skill_ids: string[]
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          event_type: string
          id?: string
          model?: string | null
          node_id?: string | null
          payload?: Json
          prompt_version?: string | null
          script_version?: string | null
          seller_id: string
          skill_ids?: string[]
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          event_type?: string
          id?: string
          model?: string | null
          node_id?: string | null
          payload?: Json
          prompt_version?: string | null
          script_version?: string | null
          seller_id?: string
          skill_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "seller_events_seller_id_fkey"
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
          evidence_count: number
          id: string
          last_practiced_at: string | null
          mastery_score: number
          recurring_failures: Json
          seller_id: string
          skill_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          evidence_count?: number
          id?: string
          last_practiced_at?: string | null
          mastery_score?: number
          recurring_failures?: Json
          seller_id: string
          skill_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          evidence_count?: number
          id?: string
          last_practiced_at?: string | null
          mastery_score?: number
          recurring_failures?: Json
          seller_id?: string
          skill_id?: string
          updated_at?: string
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
          audio_consent: boolean
          certified_at: string | null
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
          joined_at: string | null
          joined_via_invite_id: string | null
          last_practice_date: string | null
          main_challenge: string | null
          map_tutorial_completed: boolean
          onboarding_completed: boolean
          profile_id: string
          streak_days: number
          xp_total: number
        }
        Insert: {
          audio_consent?: boolean
          certified_at?: string | null
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
          joined_at?: string | null
          joined_via_invite_id?: string | null
          last_practice_date?: string | null
          main_challenge?: string | null
          map_tutorial_completed?: boolean
          onboarding_completed?: boolean
          profile_id: string
          streak_days?: number
          xp_total?: number
        }
        Update: {
          audio_consent?: boolean
          certified_at?: string | null
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
          joined_at?: string | null
          joined_via_invite_id?: string | null
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
            foreignKeyName: "sellers_joined_via_invite_id_fkey"
            columns: ["joined_via_invite_id"]
            isOneToOne: false
            referencedRelation: "company_invites"
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
          decay_half_life_days: number | null
          default_allowed_concepts: Json
          default_forbidden_concepts: Json
          failure_signals: Json
          id: string
          level_required: string
          mastery_threshold: number
          name: string
          parent_skill_id: string | null
          reinforcement_threshold: number
          requires_audio: boolean
          short_description: string | null
          skill_type: string | null
          status: string
          success_signals: Json
          world_id_introduced: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          decay_half_life_days?: number | null
          default_allowed_concepts?: Json
          default_forbidden_concepts?: Json
          failure_signals?: Json
          id: string
          level_required?: string
          mastery_threshold?: number
          name: string
          parent_skill_id?: string | null
          reinforcement_threshold?: number
          requires_audio?: boolean
          short_description?: string | null
          skill_type?: string | null
          status?: string
          success_signals?: Json
          world_id_introduced: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          decay_half_life_days?: number | null
          default_allowed_concepts?: Json
          default_forbidden_concepts?: Json
          failure_signals?: Json
          id?: string
          level_required?: string
          mastery_threshold?: number
          name?: string
          parent_skill_id?: string | null
          reinforcement_threshold?: number
          requires_audio?: boolean
          short_description?: string | null
          skill_type?: string | null
          status?: string
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
      tts_calls: {
        Row: {
          cache_hit: boolean
          characters: number
          company_id: string | null
          created_at: string
          estimated_usd: number
          id: string
          latency_ms: number | null
          model: string | null
          node_id: string | null
          phase: string | null
          seller_id: string | null
          session_id: string | null
          voice_id: string | null
        }
        Insert: {
          cache_hit?: boolean
          characters?: number
          company_id?: string | null
          created_at?: string
          estimated_usd?: number
          id?: string
          latency_ms?: number | null
          model?: string | null
          node_id?: string | null
          phase?: string | null
          seller_id?: string | null
          session_id?: string | null
          voice_id?: string | null
        }
        Update: {
          cache_hit?: boolean
          characters?: number
          company_id?: string | null
          created_at?: string
          estimated_usd?: number
          id?: string
          latency_ms?: number | null
          model?: string | null
          node_id?: string | null
          phase?: string | null
          seller_id?: string | null
          session_id?: string | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tts_calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tts_calls_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
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
      pitch_version_integrity: {
        Row: {
          channel: string | null
          client_type: string | null
          company_id: string | null
          pitch_id: string | null
          sections: number | null
          sections_desactualizadas: number | null
          sections_sin_version: number | null
          status: string | null
          versiones: string[] | null
          versiones_distintas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_pitches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _company_prefix: { Args: { _name: string }; Returns: string }
      _gen_invite_suffix: { Args: never; Returns: string }
      apply_invite_code: { Args: { _code: string }; Returns: Json }
      consume_credits: {
        Args: { _seller_id: string; _session_type: string }
        Returns: Json
      }
      convert_personal_to_company: { Args: { _name: string }; Returns: Json }
      create_company_for_manager: { Args: { _name: string }; Returns: Json }
      create_personal_company: { Args: never; Returns: Json }
      create_team_company: { Args: { _name: string }; Returns: Json }
      current_company_id: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      generate_company_invite:
        | { Args: never; Returns: Json }
        | { Args: { _hours?: number }; Returns: Json }
      get_active_company_invite: { Args: never; Returns: Json }
      get_current_mastery: {
        Args: { _last_practiced_at: string; _mastery_score: number }
        Returns: number
      }
      is_manager: { Args: never; Returns: boolean }
      join_company_with_code: { Args: { _code: string }; Returns: Json }
      llm_call_usd: {
        Args: {
          _cache_write: number
          _cached: number
          _input: number
          _model: string
          _output: number
        }
        Returns: number
      }
      llm_usage_report: {
        Args: { _from: string; _to: string }
        Returns: {
          avg_latency_ms: number
          cache_creation_tokens: number
          cached_tokens: number
          calls: number
          company_id: string
          company_name: string
          input_tokens: number
          model: string
          output_tokens: number
          phase: string
        }[]
      }
      owns_seller: { Args: { _seller_id: string }; Returns: boolean }
      register_invite_failed_attempt: {
        Args: { _code: string }
        Returns: undefined
      }
      revoke_company_invite: { Args: never; Returns: Json }
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
      set_seller_active: {
        Args: { _active: boolean; _seller_id: string }
        Returns: Json
      }
      update_company_brain: { Args: { _brain: Json }; Returns: Json }
      update_company_identity: {
        Args: { _industry: string; _logo_url: string; _name: string }
        Returns: Json
      }
      usage_cost_report: {
        Args: { _from: string; _to: string }
        Returns: {
          company_id: string
          company_name: string
          llm_cached_tokens: number
          llm_calls: number
          llm_input_tokens: number
          llm_output_tokens: number
          llm_usd: number
          total_usd: number
          tts_cache_hits: number
          tts_calls: number
          tts_characters: number
          tts_usd: number
        }[]
      }
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
    Enums: {},
  },
} as const
